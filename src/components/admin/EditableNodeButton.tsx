"use client";

import Link from "next/link";
import { useState } from "react";
import type { NodeRow } from "@/lib/store";
import { useAdminAction } from "@/lib/useAdminAction";
import EditPencil from "./EditPencil";
import { ActionRow, ErrorNote } from "./EditFields";
import NodeFormFields from "./NodeFormFields";

/**
 * En knapp som ser ut precis som på den riktiga sidan, med en penna i hörnet.
 * Pennan fäller ut allt man kan göra med knappen.
 */
export default function EditableNodeButton({ node }: { node: NodeRow }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(node);
  const { run, busy, error } = useAdminAction();

  const hidden = !node.published;
  const changed = JSON.stringify(draft) !== JSON.stringify(node);

  async function save() {
    const ok = await run({
      action: "node.update",
      id: node.id,
      patch: {
        label: draft.label,
        icon: draft.icon,
        heading: draft.heading,
        intro: draft.intro,
        slug: draft.slug,
        published: draft.published,
      },
    });
    if (ok) setOpen(false);
  }

  return (
    <div>
      <div className="relative">
        <Link
          href={`/admin/hjalp/${node.slug}`}
          className={`tap flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 pr-20 text-left shadow-sm transition ${
            hidden ? "border-dashed border-slate-300 bg-slate-50 opacity-70" : "border-slate-300 bg-white"
          }`}
        >
          {node.icon ? (
            <span aria-hidden="true" className="text-4xl leading-none">
              {node.icon}
            </span>
          ) : null}
          <span className="flex-1 text-2xl font-semibold leading-snug text-ink">
            {node.label}
            {hidden && (
              <span className="ml-3 rounded-full bg-amber-100 px-3 py-1 align-middle text-base font-semibold text-warn">
                dold
              </span>
            )}
          </span>
          <span aria-hidden="true" className="text-3xl text-slate-400">
            ›
          </span>
        </Link>

        <EditPencil open={open} onClick={() => setOpen(!open)} label={node.label} />
      </div>

      {open && (
        <div className="mt-2 flex flex-col gap-4 rounded-2xl border-2 border-brand bg-brand-light p-5">
          <NodeFormFields draft={draft} onChange={setDraft} />

          <ErrorNote error={error} />

          <ActionRow
            busy={busy}
            changed={changed}
            onSave={save}
            onMoveUp={() => run({ action: "node.move", id: node.id, delta: -1 })}
            onMoveDown={() => run({ action: "node.move", id: node.id, delta: 1 })}
            onDelete={() => {
              if (
                !confirm(
                  `Ta bort "${node.label}"? Alla knappar och lösningar under den försvinner också.`
                )
              )
                return;
              run({ action: "node.delete", id: node.id });
            }}
          />
        </div>
      )}
    </div>
  );
}
