"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NodeRow } from "@/lib/store";
import { useAdminAction } from "@/lib/useAdminAction";
import EditPencil from "./EditPencil";
import { ActionRow, ErrorNote } from "./EditFields";
import NodeFormFields from "./NodeFormFields";

/**
 * Rubriken på en knapps egen sida. Samma text som farmor och farfar ser,
 * med en penna bredvid för att ändra sidan man står på.
 */
export default function EditableHeading({
  node,
  allNodes,
}: {
  node: NodeRow;
  allNodes: NodeRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(node);
  const { run, busy, error } = useAdminAction();

  const changed = JSON.stringify(draft) !== JSON.stringify(node);

  async function save() {
    if (draft.parent_id !== node.parent_id) {
      const moved = await run({
        action: "node.reparent",
        id: node.id,
        parentId: draft.parent_id,
      });
      if (!moved) return;
    }

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
    if (!ok) return;
    setOpen(false);
    // Adressdelen kan ha ändrats – då är sidan man står på inte samma längre.
    if (draft.slug !== node.slug) router.replace(`/admin/hjalp/${draft.slug}`);
  }

  return (
    <div className="mb-6">
      <div className="relative rounded-2xl py-1 pr-20">
        <h1 className="text-3xl font-bold leading-tight">
          {node.heading || node.label}
        </h1>
        {node.intro ? (
          <p className="mt-3 text-xl leading-relaxed text-subtle">{node.intro}</p>
        ) : null}
        {!node.published && (
          <p className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-base font-semibold text-warn">
            Den här sidan är dold för farmor och farfar
          </p>
        )}

        <EditPencil open={open} onClick={() => setOpen(!open)} label="den här sidan" />
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-4 rounded-2xl border-2 border-brand bg-brand-light p-5">
          <NodeFormFields draft={draft} onChange={setDraft} allNodes={allNodes} />

          <ErrorNote error={error} />

          <ActionRow
            busy={busy}
            changed={changed}
            onSave={save}
            onDelete={() => {
              if (
                !confirm(
                  `Ta bort "${node.label}"? Alla knappar och lösningar under den försvinner också.`
                )
              )
                return;
              run({ action: "node.delete", id: node.id }).then((ok) => {
                if (ok) router.replace("/admin");
              });
            }}
            deleteLabel="Ta bort den här sidan"
          />
        </div>
      )}
    </div>
  );
}
