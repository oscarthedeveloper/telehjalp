import type { Node, Settings, Solution } from "./types";
import { DEFAULT_SETTINGS } from "./types";

/**
 * Granskar en inklistrad JSON innan den får bli knappar i databasen.
 * Allt som kan göra sidan trasig ska fastna här, med ett besked som säger
 * var i filen felet sitter.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type NormalisedImport = {
  settings: Partial<Settings>;
  nodes: Node[];
  counts: { nodes: number; solutions: number; settings: number };
};

export class ImportError extends Error {}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optional(value: unknown): string | null {
  const result = text(value).trim();
  return result === "" ? null : result;
}

function requireSlug(value: unknown, where: string): string {
  const slug = text(value).trim();
  if (!SLUG.test(slug)) {
    throw new ImportError(
      `Ogiltig adressdel "${slug}" (${where}). Endast små bokstäver, siffror och bindestreck.`
    );
  }
  return slug;
}

function normaliseSolution(input: any, where: string, seen: Set<string>): Solution {
  const title = text(input?.title).trim();
  if (!title) throw new ImportError(`En lösning under ${where} saknar rubrik.`);

  const slug = requireSlug(input?.slug, `${where} → ${title}`);
  if (seen.has(slug)) {
    throw new ImportError(`Två lösningar under ${where} har adressdelen "${slug}".`);
  }
  seen.add(slug);

  const steps = Array.isArray(input?.steps)
    ? input.steps.map((step: unknown) => text(step).trim()).filter(Boolean)
    : [];

  return {
    slug,
    title,
    cause: optional(input?.cause),
    steps,
    needsPassword: input?.needsPassword === true,
    passwordHint: optional(input?.passwordHint),
    published: input?.published !== false,
  };
}

function normaliseNode(input: any, trail: string[], seen: Set<string>): Node {
  const label = text(input?.label).trim();
  const where = [...trail, label || "?"].join(" › ");
  if (!label) throw new ImportError(`En knapp saknar text (${trail.join(" › ") || "toppnivån"}).`);

  const slug = requireSlug(input?.slug, where);
  if (seen.has(slug)) {
    throw new ImportError(`Adressdelen "${slug}" används av två knappar i filen (${where}).`);
  }
  seen.add(slug);

  const solutionSlugs = new Set<string>();

  return {
    slug,
    label,
    icon: optional(input?.icon),
    heading: optional(input?.heading),
    intro: optional(input?.intro),
    published: input?.published !== false,
    children: Array.isArray(input?.children)
      ? input.children.map((child: unknown) => normaliseNode(child, [...trail, label], seen))
      : [],
    solutions: Array.isArray(input?.solutions)
      ? input.solutions.map((s: unknown) => normaliseSolution(s, where, solutionSlugs))
      : [],
  };
}

export function normaliseImport(input: unknown): NormalisedImport {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ImportError("Filen måste innehålla ett JSON-objekt med fältet \"nodes\".");
  }

  const data = input as any;
  if (!Array.isArray(data.nodes)) {
    throw new ImportError("Fältet \"nodes\" saknas eller är inte en lista.");
  }

  const seen = new Set<string>();
  const nodes: Node[] = data.nodes.map((node: unknown) => normaliseNode(node, [], seen));

  const settings: Partial<Settings> = {};
  if (data.settings && typeof data.settings === "object") {
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (typeof data.settings[key] === "string") settings[key] = data.settings[key];
    }
  }

  let solutionCount = 0;
  const count = (list: Node[]) => {
    for (const node of list) {
      solutionCount += node.solutions?.length ?? 0;
      count(node.children ?? []);
    }
  };
  count(nodes);

  return {
    settings,
    nodes,
    counts: { nodes: seen.size, solutions: solutionCount, settings: Object.keys(settings).length },
  };
}
