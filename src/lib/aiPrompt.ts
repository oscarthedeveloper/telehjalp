import type { Node, Solution } from "./types";

/**
 * Bygger det färdiga meddelandet som klistras in i Claude.
 * Vägen genom knapparna beskriver problemet, och de lösningar som redan
 * visats markeras som provade utan resultat.
 */
export function buildAiMessage(opts: {
  path: Node[];
  solutions: Solution[];
  deviceInfo?: string;
  closing: string;
}): string {
  const { path, solutions, closing } = opts;
  const device = (opts.deviceInfo ?? "").trim();
  const lines: string[] = [];

  lines.push("Hej! Jag behöver hjälp med ett tekniskt problem.");
  lines.push("");
  lines.push("Jag har gått igenom en hjälpguide och valt så här:");
  path.forEach((node, i) => lines.push(`${i + 1}. ${node.label}`));

  if (solutions.length > 0) {
    lines.push("");
    lines.push("Guiden föreslog det här, men inget av det löste problemet:");
    solutions.forEach((solution) => lines.push(`- ${solution.title}`));
  }

  lines.push("");
  lines.push("Vad mer kan det bero på, och hur gör jag för att lösa det?");

  if (device) {
    lines.push("");
    lines.push(device);
  }

  lines.push("");
  lines.push(closing.trim());

  return lines.join("\n");
}
