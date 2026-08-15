"use client";

import { useAdminAction } from "@/lib/useAdminAction";
import { ErrorNote } from "./EditFields";

/** Den streckade "lägg till"-knappen längst ned i en lista. */
export default function AddItemButton({
  label,
  action,
}: {
  label: string;
  action: Record<string, unknown>;
}) {
  const { run, busy, error } = useAdminAction();

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(action)}
        className="tap flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand bg-white px-5 py-4 text-xl font-semibold text-brand transition hover:bg-brand-light disabled:opacity-50"
      >
        <span aria-hidden="true" className="text-2xl">
          +
        </span>
        {busy ? "Lägger till …" : label}
      </button>
      <div className="mt-2">
        <ErrorNote error={error} />
      </div>
    </div>
  );
}
