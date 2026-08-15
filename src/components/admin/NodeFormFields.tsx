"use client";

import type { NodeRow } from "@/lib/store";
import { Checkbox, Field, fieldClass } from "./EditFields";
import ParentPicker from "./ParentPicker";

/** Fälten för en knapp. Delas av listvyn och rubriken på knappens egen sida. */
export default function NodeFormFields({
  draft,
  onChange,
  allNodes,
}: {
  draft: NodeRow;
  onChange: (draft: NodeRow) => void;
  allNodes: NodeRow[];
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[90px_1fr]">
        <Field label="Ikon">
          <input
            className={fieldClass}
            value={draft.icon ?? ""}
            placeholder="📱"
            onChange={(e) => onChange({ ...draft, icon: e.target.value })}
          />
        </Field>
        <Field label="Text på knappen">
          <input
            className={fieldClass}
            value={draft.label}
            onChange={(e) => onChange({ ...draft, label: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Rubrik på sidan knappen leder till" hint="Lämnas den tom används knapptexten.">
        <input
          className={fieldClass}
          value={draft.heading ?? ""}
          onChange={(e) => onChange({ ...draft, heading: e.target.value })}
        />
      </Field>

      <Field label="Kort text under rubriken">
        <textarea
          className={`${fieldClass} h-20`}
          value={draft.intro ?? ""}
          onChange={(e) => onChange({ ...draft, intro: e.target.value })}
        />
      </Field>

      <Field label="Adressdel" hint={`Sidan nås på /hjalp/${draft.slug}`}>
        <input
          className={`${fieldClass} font-mono`}
          value={draft.slug}
          onChange={(e) => onChange({ ...draft, slug: e.target.value })}
        />
      </Field>

      <ParentPicker
        node={draft}
        allNodes={allNodes}
        value={draft.parent_id}
        onChange={(parent_id) => onChange({ ...draft, parent_id })}
      />

      <Checkbox
        checked={draft.published}
        onChange={(published) => onChange({ ...draft, published })}
      >
        Synlig för farmor och farfar
      </Checkbox>
    </>
  );
}
