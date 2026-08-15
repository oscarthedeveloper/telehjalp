import { randomUUID } from "crypto";
import { DatabaseError, execute, isConfigured, query, run, transaction, type Row } from "./db";
import { fallbackContent, uniqueSlug } from "./content";
import { DEFAULT_SETTINGS, type Content, type Node, type Settings, type Solution } from "./types";

/* ------------------------------------------------------------------ */
/* Tabeller                                                            */
/* ------------------------------------------------------------------ */

const DDL = [
  `create table if not exists nodes (
     id         text primary key,
     parent_id  text,
     slug       text not null unique,
     label      text not null,
     icon       text,
     heading    text,
     intro      text,
     sort_order integer not null default 0,
     published  integer not null default 1
   )`,
  `create index if not exists nodes_parent on nodes (parent_id, sort_order)`,
  `create table if not exists solutions (
     id             text primary key,
     node_id        text not null,
     slug           text not null,
     title          text not null,
     cause          text,
     steps          text not null default '[]',
     needs_password integer not null default 0,
     password_hint  text,
     sort_order     integer not null default 0,
     published      integer not null default 1,
     unique (node_id, slug)
   )`,
  `create index if not exists solutions_node on solutions (node_id, sort_order)`,
  `create table if not exists settings (
     key   text primary key,
     value text not null default ''
   )`,
];

/** Skapar tabellerna om de inte finns. Går att köra hur många gånger som helst. */
export async function ensureSchema(): Promise<void> {
  await execute(DDL.map((sql) => ({ sql })));
}

/* ------------------------------------------------------------------ */
/* Rader ur databasen                                                  */
/* ------------------------------------------------------------------ */

export type NodeRow = {
  id: string;
  parent_id: string | null;
  slug: string;
  label: string;
  icon: string | null;
  heading: string | null;
  intro: string | null;
  sort_order: number;
  published: boolean;
};

export type SolutionRow = {
  id: string;
  node_id: string;
  slug: string;
  title: string;
  cause: string | null;
  steps: string[];
  needs_password: boolean;
  password_hint: string | null;
  sort_order: number;
  published: boolean;
};

export type Snapshot = {
  nodes: NodeRow[];
  solutions: SolutionRow[];
  settings: Settings;
};

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function orNull(value: unknown): string | null {
  const result = str(value);
  return result === "" ? null : result;
}

function toNodeRow(row: Row): NodeRow {
  return {
    id: str(row.id),
    parent_id: row.parent_id == null ? null : str(row.parent_id),
    slug: str(row.slug),
    label: str(row.label),
    icon: orNull(row.icon),
    heading: orNull(row.heading),
    intro: orNull(row.intro),
    sort_order: Number(row.sort_order ?? 0),
    published: Number(row.published ?? 1) === 1,
  };
}

function toSolutionRow(row: Row): SolutionRow {
  let steps: string[] = [];
  try {
    const parsed = JSON.parse(str(row.steps) || "[]");
    if (Array.isArray(parsed)) steps = parsed.map(String);
  } catch {
    steps = [];
  }

  return {
    id: str(row.id),
    node_id: str(row.node_id),
    slug: str(row.slug),
    title: str(row.title),
    cause: orNull(row.cause),
    steps,
    needs_password: Number(row.needs_password ?? 0) === 1,
    password_hint: orNull(row.password_hint),
    sort_order: Number(row.sort_order ?? 0),
    published: Number(row.published ?? 1) === 1,
  };
}

/** Allt som finns i databasen, i platt form. Adminpanelen arbetar mot detta. */
export async function readSnapshot(): Promise<Snapshot> {
  const [nodeRows, solutionRows, settingRows] = await execute([
    { sql: "select * from nodes order by sort_order, label" },
    { sql: "select * from solutions order by sort_order, title" },
    { sql: "select * from settings" },
  ]);

  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const row of settingRows ?? []) {
    const key = str(row.key) as keyof Settings;
    if (key in settings) settings[key] = str(row.value);
  }

  return {
    nodes: (nodeRows ?? []).map(toNodeRow),
    solutions: (solutionRows ?? []).map(toSolutionRow),
    settings,
  };
}

/* ------------------------------------------------------------------ */
/* Från platta rader till trädet som sidorna renderar                  */
/* ------------------------------------------------------------------ */

export function buildTree(snapshot: Snapshot): Content {
  const byParent = new Map<string | null, NodeRow[]>();
  for (const row of snapshot.nodes) {
    const list = byParent.get(row.parent_id) ?? [];
    list.push(row);
    byParent.set(row.parent_id, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, "sv"));
  }

  const solutionsByNode = new Map<string, SolutionRow[]>();
  for (const row of snapshot.solutions) {
    const list = solutionsByNode.get(row.node_id) ?? [];
    list.push(row);
    solutionsByNode.set(row.node_id, list);
  }
  for (const list of solutionsByNode.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, "sv"));
  }

  const seen = new Set<string>();

  const build = (parentId: string | null): Node[] =>
    (byParent.get(parentId) ?? [])
      // Skydd mot en trasig parent_id-kedja som annars skulle loopa.
      .filter((row) => !seen.has(row.id) && seen.add(row.id) !== undefined)
      .map((row) => ({
        slug: row.slug,
        label: row.label,
        icon: row.icon,
        heading: row.heading,
        intro: row.intro,
        published: row.published,
        children: build(row.id),
        solutions: (solutionsByNode.get(row.id) ?? []).map(
          (s): Solution => ({
            slug: s.slug,
            title: s.title,
            cause: s.cause,
            steps: s.steps,
            needsPassword: s.needs_password,
            passwordHint: s.password_hint,
            published: s.published,
          })
        ),
      }));

  return { settings: snapshot.settings, nodes: build(null) };
}

/* ------------------------------------------------------------------ */
/* Läsning för de publika sidorna, med reservläge                      */
/* ------------------------------------------------------------------ */

export type LoadResult = {
  content: Content;
  /** "db" = färskt ur databasen, "fallback" = den inbakade reservfilen. */
  source: "db" | "fallback";
  problem?: string;
};

export async function loadContent(): Promise<LoadResult> {
  if (!isConfigured()) {
    return {
      content: fallbackContent,
      source: "fallback",
      problem: "Databasen är inte inkopplad ännu.",
    };
  }

  try {
    const snapshot = await readSnapshot();
    if (snapshot.nodes.length === 0) {
      return {
        content: fallbackContent,
        source: "fallback",
        problem: "Databasen är tom.",
      };
    }
    return { content: buildTree(snapshot), source: "db" };
  } catch (err: any) {
    return {
      content: fallbackContent,
      source: "fallback",
      problem: err instanceof DatabaseError ? err.message : (err?.message ?? "Okänt fel"),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Skrivning                                                           */
/* ------------------------------------------------------------------ */

async function takenSlugs(): Promise<Set<string>> {
  const rows = await query("select slug from nodes");
  return new Set(rows.map((row) => str(row.slug)));
}

async function nextSortOrder(parentId: string | null): Promise<number> {
  const rows = parentId
    ? await query("select max(sort_order) as top from nodes where parent_id = ?", [parentId])
    : await query("select max(sort_order) as top from nodes where parent_id is null");
  return Number(rows[0]?.top ?? 0) + 10;
}

export async function createNode(parentId: string | null, label = "Ny knapp"): Promise<string> {
  const id = randomUUID();
  const slug = uniqueSlug(label, await takenSlugs());
  const order = await nextSortOrder(parentId);

  await run(
    `insert into nodes (id, parent_id, slug, label, sort_order, published)
     values (?, ?, ?, ?, ?, 0)`,
    [id, parentId, slug, label, order]
  );
  return id;
}

const NODE_COLUMNS: Record<string, string> = {
  label: "label",
  icon: "icon",
  heading: "heading",
  intro: "intro",
  slug: "slug",
  published: "published",
};

export async function updateNode(id: string, patch: Record<string, unknown>): Promise<void> {
  const sets: string[] = [];
  const args: (string | number | null)[] = [];

  for (const [key, column] of Object.entries(NODE_COLUMNS)) {
    if (!(key in patch)) continue;
    const value = patch[key];
    sets.push(`${column} = ?`);
    if (key === "published") args.push(value === false ? 0 : 1);
    else if (key === "label" || key === "slug") args.push(str(value));
    else args.push(orNull(value));
  }

  if (sets.length === 0) return;
  args.push(id);
  await run(`update nodes set ${sets.join(", ")} where id = ?`, args);
}

/** Tar bort en knapp med alla underknappar och lösningar. */
export async function deleteNode(id: string): Promise<void> {
  const rows = await query("select id, parent_id from nodes");
  const children = new Map<string, string[]>();
  for (const row of rows) {
    const parent = row.parent_id == null ? "" : str(row.parent_id);
    children.set(parent, [...(children.get(parent) ?? []), str(row.id)]);
  }

  const doomed: string[] = [];
  const collect = (nodeId: string) => {
    doomed.push(nodeId);
    for (const child of children.get(nodeId) ?? []) collect(child);
  };
  collect(id);

  const placeholders = doomed.map(() => "?").join(", ");
  await transaction([
    { sql: `delete from solutions where node_id in (${placeholders})`, args: doomed },
    { sql: `delete from nodes where id in (${placeholders})`, args: doomed },
  ]);
}

/** Flyttar en knapp uppåt (-1) eller nedåt (+1) bland sina syskon. */
export async function moveNode(id: string, delta: number): Promise<void> {
  const target = await query("select parent_id from nodes where id = ?", [id]);
  if (target.length === 0) return;
  const parentId = target[0].parent_id == null ? null : str(target[0].parent_id);

  const siblings = parentId
    ? await query(
        "select id from nodes where parent_id = ? order by sort_order, label",
        [parentId]
      )
    : await query("select id from nodes where parent_id is null order by sort_order, label");

  const ids = siblings.map((row) => str(row.id));
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return;

  [ids[from], ids[to]] = [ids[to], ids[from]];

  // Skriv om hela syskonskarans ordning, så den alltid är entydig.
  await transaction(
    ids.map((nodeId, index) => ({
      sql: "update nodes set sort_order = ? where id = ?",
      args: [(index + 1) * 10, nodeId],
    }))
  );
}

/* ------------------------------ lösningar ------------------------- */

export async function createSolution(nodeId: string, title = "Ny orsak"): Promise<string> {
  const existing = await query("select slug, sort_order from solutions where node_id = ?", [
    nodeId,
  ]);
  const id = randomUUID();
  const slug = uniqueSlug(title, new Set(existing.map((row) => str(row.slug))));
  const order =
    existing.reduce((top, row) => Math.max(top, Number(row.sort_order ?? 0)), 0) + 10;

  await run(
    `insert into solutions (id, node_id, slug, title, steps, sort_order, published)
     values (?, ?, ?, ?, '[]', ?, 0)`,
    [id, nodeId, slug, title, order]
  );
  return id;
}

const SOLUTION_COLUMNS: Record<string, string> = {
  title: "title",
  slug: "slug",
  cause: "cause",
  steps: "steps",
  needsPassword: "needs_password",
  passwordHint: "password_hint",
  published: "published",
};

export async function updateSolution(id: string, patch: Record<string, unknown>): Promise<void> {
  const sets: string[] = [];
  const args: (string | number | null)[] = [];

  for (const [key, column] of Object.entries(SOLUTION_COLUMNS)) {
    if (!(key in patch)) continue;
    const value = patch[key];
    sets.push(`${column} = ?`);

    if (key === "published") args.push(value === false ? 0 : 1);
    else if (key === "needsPassword") args.push(value === true ? 1 : 0);
    else if (key === "steps") {
      const steps = Array.isArray(value) ? value.map((step) => str(step).trim()).filter(Boolean) : [];
      args.push(JSON.stringify(steps));
    } else if (key === "title" || key === "slug") args.push(str(value));
    else args.push(orNull(value));
  }

  if (sets.length === 0) return;
  args.push(id);
  await run(`update solutions set ${sets.join(", ")} where id = ?`, args);
}

export async function deleteSolution(id: string): Promise<void> {
  await run("delete from solutions where id = ?", [id]);
}

export async function moveSolution(id: string, delta: number): Promise<void> {
  const target = await query("select node_id from solutions where id = ?", [id]);
  if (target.length === 0) return;

  const rows = await query(
    "select id from solutions where node_id = ? order by sort_order, title",
    [str(target[0].node_id)]
  );

  const ids = rows.map((row) => str(row.id));
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return;

  [ids[from], ids[to]] = [ids[to], ids[from]];

  await transaction(
    ids.map((solutionId, index) => ({
      sql: "update solutions set sort_order = ? where id = ?",
      args: [(index + 1) * 10, solutionId],
    }))
  );
}

/* ------------------------------ inställningar --------------------- */

export async function updateSetting(key: string, value: string): Promise<void> {
  if (!(key in DEFAULT_SETTINGS)) throw new Error(`Okänd inställning: ${key}`);
  await run(
    `insert into settings (key, value) values (?, ?)
     on conflict (key) do update set value = excluded.value`,
    [key, value]
  );
}

/* ------------------------------------------------------------------ */
/* Första gången: fyll databasen från innehållsfilen                   */
/* ------------------------------------------------------------------ */

export async function isEmpty(): Promise<boolean> {
  const rows = await query("select count(*) as antal from nodes");
  return Number(rows[0]?.antal ?? 0) === 0;
}

export async function seedFromFile(): Promise<{ nodes: number; solutions: number }> {
  const statements: { sql: string; args: (string | number | null)[] }[] = [];
  let nodeCount = 0;
  let solutionCount = 0;

  const walk = (nodes: Node[], parentId: string | null) => {
    nodes.forEach((node, index) => {
      const id = randomUUID();
      nodeCount += 1;

      statements.push({
        sql: `insert into nodes (id, parent_id, slug, label, icon, heading, intro, sort_order, published)
              values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          parentId,
          node.slug,
          node.label,
          node.icon ?? null,
          node.heading ?? null,
          node.intro ?? null,
          (index + 1) * 10,
          node.published === false ? 0 : 1,
        ],
      });

      (node.solutions ?? []).forEach((solution, position) => {
        solutionCount += 1;
        statements.push({
          sql: `insert into solutions (id, node_id, slug, title, cause, steps, needs_password, password_hint, sort_order, published)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            randomUUID(),
            id,
            solution.slug,
            solution.title,
            solution.cause ?? null,
            JSON.stringify(solution.steps ?? []),
            solution.needsPassword === true ? 1 : 0,
            solution.passwordHint ?? null,
            (position + 1) * 10,
            solution.published === false ? 0 : 1,
          ],
        });
      });

      walk(node.children ?? [], id);
    });
  };

  walk(fallbackContent.nodes, null);

  for (const [key, value] of Object.entries(fallbackContent.settings)) {
    statements.push({
      sql: `insert into settings (key, value) values (?, ?)
            on conflict (key) do update set value = excluded.value`,
      args: [key, String(value)],
    });
  }

  await transaction(statements);
  return { nodes: nodeCount, solutions: solutionCount };
}
