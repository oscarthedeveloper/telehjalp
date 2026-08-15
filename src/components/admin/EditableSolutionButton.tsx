"use client";

import Link from "next/link";
import { useState } from "react";
import type { SolutionRow } from "@/lib/store";
import { useAdminAction } from "@/lib/useAdminAction";
import EditPencil from "./EditPencil";
import { ActionRow, Checkbox, ErrorNote, Field, fieldClass } from "./EditFields";

/**
 * En orsak i listan "Det kan bero på …". Här redigeras bara rubriken och
 * ordningen – själva innehållet redigeras på lösningens egen sida.
 */
export default function EditableSolutionButton({
  solution,
  nodeSlug,
}: {
  solution: SolutionRow;
  nodeSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(solution);
  const { run, busy, error } = useAdminAction();

  const hidden = !solution.published;
  const changed =
    draft.title !== solution.title ||
    draft.slug !== solution.slug ||
    draft.published !== solution.published;

  async function save() {
    const ok = await run({
      action: "solution.update",
      id: solution.id,
      patch: { title: draft.title, slug: draft.slug, published: draft.published },
    });
    if (ok) setOpen(false);
  }

  const steps = solution.steps.length;

  return (
    <div>
      <div className="relative">
        <Link
          href={`/admin/hjalp/${nodeSlug}/${solution.slug}`}
          className={`tap flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 pr-20 text-left shadow-sm transition ${
            hidden ? "border-dashed border-slate-300 bg-slate-50 opacity-70" : "border-slate-300 bg-white"
          }`}
        >
          <span className="flex-1 text-2xl font-semibold leading-snug text-ink">
            {solution.title}
            {hidden && (
              <span className="ml-3 rounded-full bg-amber-100 px-3 py-1 align-middle text-base font-semibold text-warn">
                dold
              </span>
            )}
            <span className="mt-1 block text-base font-normal text-subtle">
              {steps === 0 ? "Inga steg än" : `${steps} steg`}
              {solution.needs_password && " · Proton Pass"}
            </span>
          </span>
          <span aria-hidden="true" className="text-3xl text-slate-400">
            ›
          </span>
        </Link>

        <EditPencil open={open} onClick={() => setOpen(!open)} label={solution.title} />
      </div>

      {open && (
        <div className="mt-2 flex flex-col gap-4 rounded-2xl border-2 border-brand bg-brand-light p-5">
          <Field label="Orsak (texten på knappen)">
            <input
              className={fieldClass}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>

          <Field label="Adressdel">
            <input
              className={`${fieldClass} font-mono`}
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
          </Field>

          <Checkbox
            checked={draft.published}
            onChange={(published) => setDraft({ ...draft, published })}
          >
            Synlig för farmor och farfar
          </Checkbox>

          <p className="text-base text-subtle">
            Orsaken, stegen och Proton Pass-knappen redigerar du inne på lösningens
            egen sida.
          </p>

          <ErrorNote error={error} />

          <ActionRow
            busy={busy}
            changed={changed}
            onSave={save}
            onMoveUp={() => run({ action: "solution.move", id: solution.id, delta: -1 })}
            onMoveDown={() => run({ action: "solution.move", id: solution.id, delta: 1 })}
            onDelete={() => {
              if (!confirm(`Ta bort "${solution.title}"?`)) return;
              run({ action: "solution.delete", id: solution.id });
            }}
          />
        </div>
      )}
    </div>
  );
}
