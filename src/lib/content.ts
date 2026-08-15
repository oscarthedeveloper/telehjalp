import raw from "../../content/telehjalp.json";
import { DEFAULT_SETTINGS, type Content, type Node, type Settings, type Solution } from "./types";

/**
 * Rena hjälpfunktioner för trädet, plus reservinnehållet.
 *
 * content/telehjalp.json fyller två roller: den är utgångsläget som läses
 * in i databasen första gången, och den är reserven som visas om databasen
 * mot förmodan inte skulle svara.
 */

export function parseContent(input: unknown): Content {
  const data = (input ?? {}) as Partial<Content>;
  return {
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) } as Settings,
    nodes: Array.isArray(data.nodes) ? (data.nodes as Node[]) : [],
  };
}

export const fallbackContent: Content = parseContent(raw);

function isPublished(item: { published?: boolean }): boolean {
  return item.published !== false;
}

/** Plockar bort allt som inte är publicerat. */
export function publicView(content: Content): Content {
  const strip = (nodes: Node[]): Node[] =>
    nodes.filter(isPublished).map((node) => ({
      ...node,
      children: strip(node.children ?? []),
      solutions: (node.solutions ?? []).filter(isPublished),
    }));

  return { settings: content.settings, nodes: strip(content.nodes) };
}

/* ------------------------------------------------------------------ */

export function allNodes(nodes: Node[]): Node[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children ?? [])]);
}

export function findNode(nodes: Node[], slug: string): Node | undefined {
  return allNodes(nodes).find((node) => node.slug === slug);
}

/** Vägen från startsidan ned till noden, inklusive noden själv. */
export function pathTo(nodes: Node[], slug: string): Node[] {
  for (const node of nodes) {
    if (node.slug === slug) return [node];
    const below = pathTo(node.children ?? [], slug);
    if (below.length > 0) return [node, ...below];
  }
  return [];
}

export function solutionsOf(node: Node): Solution[] {
  return node.solutions ?? [];
}

export function findSolution(node: Node, slug: string): Solution | undefined {
  return solutionsOf(node).find((solution) => solution.slug === slug);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[éè]/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Gör en slug unik genom att lägga till -2, -3 … vid krock. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = slugify(base) || "knapp";
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
