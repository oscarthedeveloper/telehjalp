"use client";

import type { NodeRow } from "@/lib/store";
import { Field } from "./EditFields";

/**
 * Väljare för var en knapp ska ligga. Knappen själv och allt som ligger
 * under den utelämnas ur listan – dit går den inte att flytta.
 */
export default function ParentPicker({
  node,
  allNodes,
  value,
  onChange,
}: {
  node: NodeRow;
  allNodes: NodeRow[];
  value: string | null;
  onChange: (parentId: string | null) => void;
}) {
  const forbidden = new Set<string>([node.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const candidate of allNodes) {
      if (candidate.parent_id && forbidden.has(candidate.parent_id) && !forbidden.has(candidate.id)) {
        forbidden.add(candidate.id);
        grew = true;
      }
    }
  }

  const options: { id: string; label: string }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    allNodes
      .filter((n) => n.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((n) => {
        if (!forbidden.has(n.id)) {
          options.push({ id: n.id, label: `${"– ".repeat(depth)}${n.label}` });
          walk(n.id, depth + 1);
        }
      });
  };
  walk(null, 0);

  return (
    <Field
      label="Ligger under"
      hint="Byter du här flyttas knappen med allt som ligger under den."
    >
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-brand focus:outline-none"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">Startsidan</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
