"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SolutionRow } from "@/lib/store";
import { useAdminAction } from "@/lib/useAdminAction";
import EditPencil from "./EditPencil";
import { ActionRow, Checkbox, ErrorNote, Field, fieldClass } from "./EditFields";

/**
 * Lösningens innehåll på dess egen sida: orsaken, stegen och Proton
 * Pass-knappen. Visas precis som farmor och farfar ser det, med en penna
 * som växlar hela innehållet till redigering.
 */
export default function EditableSolutionContent({
  solution,
  nodeSlug,
}: {
  solution: SolutionRow;
  nodeSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    ...solution,
    stepsText: solution.steps.join("\n"),
  });
  const { run, busy, error } = useAdminAction();

  const changed =
    draft.title !== solution.title ||
    draft.slug !== solution.slug ||
    (draft.cause ?? "") !== (solution.cause ?? "") ||
    draft.stepsText !== solution.steps.join("\n") ||
    draft.needs_password !== solution.needs_password ||
    (draft.password_hint ?? "") !== (solution.password_hint ?? "") ||
    draft.published !== solution.published;

  async function save() {
    const ok = await run({
      action: "solution.update",
      id: solution.id,
      patch: {
        title: draft.title,
        slug: draft.slug,
        cause: draft.cause,
        steps: draft.stepsText.split("\n"),
        needsPassword: draft.needs_password,
        passwordHint: draft.password_hint,
        published: draft.published,
      },
    });
    if (!ok) return;
    setOpen(false);
    if (draft.slug !== solution.slug) {
      router.replace(`/admin/hjalp/${nodeSlug}/${draft.slug}`);
    }
  }

  if (open) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-brand bg-brand-light p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Ändra lösningen</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border-2 border-brand bg-brand px-4 py-2 text-base font-semibold text-white"
          >
            ✕ Stäng
          </button>
        </div>

        <Field label="Rubrik (texten på knappen i listan)">
          <input
            className={fieldClass}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>

        <Field label="Förklaring av orsaken" hint="Visas i den vita rutan högst upp.">
          <textarea
            className={`${fieldClass} h-24`}
            value={draft.cause ?? ""}
            onChange={(e) => setDraft({ ...draft, cause: e.target.value })}
          />
        </Field>

        <Field
          label="Steg – ett steg per rad"
          hint="En handling per rad. Skriv var på skärmen saken finns, inte bara vad den heter."
        >
          <textarea
            className={`${fieldClass} h-56`}
            value={draft.stepsText}
            onChange={(e) => setDraft({ ...draft, stepsText: e.target.value })}
          />
        </Field>

        <Checkbox
          checked={draft.needs_password}
          onChange={(needs_password) => setDraft({ ...draft, needs_password })}
        >
          Visa Proton Pass-knappen
        </Checkbox>

        {draft.needs_password && (
          <Field label="Text vid lösenordsknappen">
            <input
              className={fieldClass}
              value={draft.password_hint ?? ""}
              placeholder="Sök på Instagram i Proton Pass."
              onChange={(e) => setDraft({ ...draft, password_hint: e.target.value })}
            />
          </Field>
        )}

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

        <ErrorNote error={error} />

        <ActionRow
          busy={busy}
          changed={changed}
          onSave={save}
          onDelete={() => {
            if (!confirm(`Ta bort "${solution.title}"?`)) return;
            run({ action: "solution.delete", id: solution.id }).then((ok) => {
              if (ok) router.replace(`/admin/hjalp/${nodeSlug}`);
            });
          }}
          deleteLabel="Ta bort lösningen"
        />
      </div>
    );
  }

  /* ----------------------- visningsläge ----------------------- */

  return (
    <div className="relative rounded-2xl pr-20">
      <EditPencil open={false} onClick={() => setOpen(true)} label="lösningen" />

      {!solution.published && (
        <p className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-base font-semibold text-warn">
          Den här lösningen är dold för farmor och farfar
        </p>
      )}

      {solution.cause ? (
        <p className="mb-8 rounded-2xl bg-white p-5 text-xl leading-relaxed shadow-sm">
          {solution.cause}
        </p>
      ) : (
        <p className="mb-8 rounded-2xl border-2 border-dashed border-slate-300 p-5 text-xl leading-relaxed text-subtle">
          Ingen förklaring av orsaken än.
        </p>
      )}

      <h2 className="mb-4 text-2xl font-semibold">Gör så här</h2>

      {solution.steps.length > 0 ? (
        <ol className="flex flex-col gap-4">
          {solution.steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-2xl bg-white p-5 text-xl leading-relaxed shadow-sm"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-slate-300 p-5 text-xl leading-relaxed text-subtle">
          Inga steg än. Tryck på pennan för att skriva dem.
        </p>
      )}

      {solution.needs_password && (
        <div className="mt-6 rounded-2xl border-2 border-brand bg-brand-light p-5">
          <p className="mb-2 text-xl font-semibold leading-snug">🔑 Behöver du lösenordet?</p>
          {solution.password_hint ? (
            <p className="mb-4 text-lg leading-relaxed">{solution.password_hint}</p>
          ) : null}
          <div className="rounded-2xl bg-brand px-5 py-4 text-center text-xl font-bold text-white">
            Tryck här för att hitta lösenord
          </div>
        </div>
      )}
    </div>
  );
}
