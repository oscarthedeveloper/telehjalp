/**
 * Hämtar hela innehållet ur databasen och skriver det till
 * content/telehjalp.json.
 *
 * Filen fyller två roller: den är reserven som visas om databasen inte
 * svarar, och den är utgångsläget om du någon gång fyller en tom databas.
 * Kör kommandot då och då så att reserven speglar det du faktiskt skrivit.
 *
 *   npm run export
 *
 * Läser TURSO_DATABASE_URL och TURSO_AUTH_TOKEN från .env.local, eller från
 * miljön om de redan är satta där.
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const ENV_FILE = ".env.local";
const OUT = process.env.CONTENT_PATH || "content/telehjalp.json";

/* ---------------------------------------------------------------- */

async function loadEnvFile() {
  if (!existsSync(ENV_FILE)) return;
  const text = await readFile(ENV_FILE, "utf8");

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function endpoint() {
  const raw = process.env.TURSO_DATABASE_URL;
  if (!raw) throw new Error("TURSO_DATABASE_URL saknas (varken i miljön eller .env.local).");
  const base = raw.trim().replace(/^(libsql|turso|http|https):\/\//, "").replace(/\/+$/, "");
  return `https://${base}/v2/pipeline`;
}

function fromWire(value) {
  switch (value?.type) {
    case "text": return value.value;
    case "integer": return Number(value.value);
    case "float": return value.value;
    default: return null;
  }
}

async function query(statements) {
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!token) throw new Error("TURSO_AUTH_TOKEN saknas (varken i miljön eller .env.local).");

  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      requests: [
        ...statements.map((sql) => ({ type: "execute", stmt: { sql } })),
        { type: "close" },
      ],
    }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Databasen nekade åtkomst. Kontrollera TURSO_AUTH_TOKEN.");
  }
  if (!response.ok) {
    throw new Error(`Databasen svarade ${response.status}.`);
  }

  const payload = await response.json();

  return statements.map((sql, i) => {
    const result = payload.results?.[i];
    if (!result) throw new Error(`Inget svar på sats ${i + 1}.`);
    if (result.type === "error") throw new Error(`${result.error.message} (i: ${sql})`);

    const table = result.response?.result;
    if (!table) return [];

    const names = table.cols.map((col) => col.name);
    return table.rows.map((cells) => {
      const row = {};
      cells.forEach((cell, index) => (row[names[index]] = fromWire(cell)));
      return row;
    });
  });
}

/* ---------------------------------------------------------------- */

function parseSteps(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Tar bort fält som är tomma, så filen blir läsbar för ett mänskligt öga. */
function tidy(object) {
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    if (value === null || value === undefined) continue;
    out[key] = value;
  }
  return out;
}

function buildTree(nodeRows, solutionRows) {
  const byParent = new Map();
  for (const row of nodeRows) {
    const key = row.parent_id ?? "";
    byParent.set(key, [...(byParent.get(key) ?? []), row]);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  const solutionsByNode = new Map();
  for (const row of solutionRows) {
    const list = solutionsByNode.get(row.node_id) ?? [];
    list.push(row);
    solutionsByNode.set(row.node_id, list);
  }
  for (const list of solutionsByNode.values()) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  const seen = new Set();

  const build = (parentKey) =>
    (byParent.get(parentKey) ?? [])
      .filter((row) => !seen.has(row.id))
      .map((row) => {
        seen.add(row.id);
        return tidy({
          slug: row.slug,
          label: row.label,
          icon: row.icon,
          heading: row.heading,
          intro: row.intro,
          published: Number(row.published ?? 1) === 1,
          children: build(row.id),
          solutions: (solutionsByNode.get(row.id) ?? []).map((s) =>
            tidy({
              slug: s.slug,
              title: s.title,
              cause: s.cause,
              steps: parseSteps(s.steps),
              needsPassword: Number(s.needs_password ?? 0) === 1,
              passwordHint: s.password_hint,
              published: Number(s.published ?? 1) === 1,
            })
          ),
        });
      });

  return build("");
}

/* ---------------------------------------------------------------- */

await loadEnvFile();

const [nodeRows, solutionRows, settingRows] = await query([
  "select * from nodes",
  "select * from solutions",
  "select * from settings",
]);

const settings = {};
for (const row of settingRows) settings[row.key] = row.value ?? "";

const content = { settings, nodes: buildTree(nodeRows, solutionRows) };

await writeFile(OUT, JSON.stringify(content, null, 2) + "\n", "utf8");

const hidden = nodeRows.filter((r) => Number(r.published ?? 1) === 0).length;

console.log(
  `✓ ${OUT} uppdaterad: ${nodeRows.length} knappar (varav ${hidden} dolda), ` +
  `${solutionRows.length} lösningar, ${settingRows.length} inställningar`
);
