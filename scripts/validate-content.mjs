/**
 * Kontrollerar content/telehjalp.json innan sidan byggs.
 *
 * Körs automatiskt av "npm run build". Går den inte igenom stannar bygget,
 * och Netlify behåller den senast fungerande versionen av sidan uppe.
 * Det är skyddsnätet mot att en olycklig ändring i adminpanelen tar ned
 * TeleHjälp för farmor och farfar.
 */

import { readFile } from "node:fs/promises";

const PATH = process.env.CONTENT_PATH || "content/telehjalp.json";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SETTINGS = ["siteIntro", "protonPassUrl", "claudeUrl", "aiDeviceInfo", "aiClosing"];

const problems = [];
const warnings = [];

function check(condition, message) {
  if (!condition) problems.push(message);
}

let raw;
try {
  raw = await readFile(PATH, "utf8");
} catch {
  console.error(`✗ Hittar inte ${PATH}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`✗ ${PATH} innehåller trasig JSON: ${err.message}`);
  process.exit(1);
}

/* ---------------------------------------------------------------- */

check(data && typeof data === "object", "Filen måste innehålla ett objekt.");
check(Array.isArray(data?.nodes), "Fältet 'nodes' måste vara en lista.");
// Inställningar är valfria: en importfil innehåller ofta bara knappar, och
// appen har inbyggda standardvärden. Men finns de ska de vara texter.
if (data?.settings === undefined) {
  warnings.push("Filen saknar 'settings'. Det är i sin ordning för en importfil.");
} else {
  check(typeof data.settings === "object", "Fältet 'settings' måste vara ett objekt.");
  for (const key of SETTINGS) {
    if (data.settings?.[key] !== undefined) {
      check(typeof data.settings[key] === "string", `settings.${key} måste vara en text.`);
    }
  }
}

const nodeSlugs = new Map();
let nodeCount = 0;
let solutionCount = 0;

function visit(node, trail) {
  nodeCount += 1;
  const where = [...trail, node?.label ?? "?"].join(" › ");

  check(typeof node?.label === "string" && node.label.trim() !== "", `Knappen saknar text: ${where}`);
  check(SLUG.test(node?.slug ?? ""), `Ogiltig adressdel "${node?.slug}" (${where})`);

  if (nodeSlugs.has(node?.slug)) {
    problems.push(
      `Adressdelen "${node.slug}" används av två knappar: "${nodeSlugs.get(node.slug)}" och "${where}"`
    );
  } else {
    nodeSlugs.set(node?.slug, where);
  }

  const solutions = node?.solutions ?? [];
  check(Array.isArray(solutions), `'solutions' måste vara en lista (${where})`);

  const solutionSlugs = new Set();
  for (const solution of solutions) {
    solutionCount += 1;
    const label = `${where} → ${solution?.title ?? "?"}`;

    check(
      typeof solution?.title === "string" && solution.title.trim() !== "",
      `Lösningen saknar rubrik: ${label}`
    );
    check(SLUG.test(solution?.slug ?? ""), `Ogiltig adressdel "${solution?.slug}" (${label})`);

    if (solutionSlugs.has(solution?.slug)) {
      problems.push(`Två lösningar under "${where}" har adressdelen "${solution.slug}"`);
    }
    solutionSlugs.add(solution?.slug);

    check(Array.isArray(solution?.steps), `'steps' måste vara en lista (${label})`);
    if (Array.isArray(solution?.steps)) {
      for (const step of solution.steps) {
        check(typeof step === "string", `Varje steg måste vara en text (${label})`);
      }
      if (solution.steps.length === 0 && solution.published !== false) {
        warnings.push(`Synlig lösning utan steg: ${label}`);
      }
    }

    if (solution?.needsPassword === true && !solution?.passwordHint) {
      warnings.push(`Proton Pass-knapp utan förklarande text: ${label}`);
    }
  }

  const children = node?.children ?? [];
  check(Array.isArray(children), `'children' måste vara en lista (${where})`);
  for (const child of children) visit(child, [...trail, node?.label ?? "?"]);

  if (children.length === 0 && solutions.length === 0 && node?.published !== false) {
    warnings.push(`Synlig knapp som leder till en tom sida: ${where}`);
  }
}

for (const node of data?.nodes ?? []) visit(node, []);

/* ---------------------------------------------------------------- */

for (const warning of warnings) console.warn(`  ⚠ ${warning}`);

if (problems.length > 0) {
  console.error(`\n✗ ${PATH} går inte att använda:\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error("");
  process.exit(1);
}

console.log(
  `✓ ${PATH}: ${nodeCount} knappar, ${solutionCount} lösningar, ${warnings.length} varningar`
);
