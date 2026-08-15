"use client";

import { useAdminAction } from "@/lib/useAdminAction";
import { ErrorNote } from "./EditFields";

/** Visas bara när databasen är tom. */
export default function SeedBox() {
  const { run, busy, error } = useAdminAction();

  return (
    <div className="mb-8 rounded-2xl border-2 border-dashed border-brand bg-brand-light p-6">
      <h2 className="text-2xl font-bold">Databasen är tom</h2>
      <p className="mt-2 text-lg leading-relaxed">
        Tabellerna är skapade, men det finns inget innehåll än. Fyll på med
        grundstrukturen och de två färdiga exemplen så har du något att bygga vidare på.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => run({ action: "seed" })}
        className="tap mt-5 flex w-full items-center justify-center rounded-2xl bg-brand px-5 py-4 text-xl font-bold text-white disabled:opacity-50"
      >
        {busy ? "Läser in …" : "Fyll på från innehållsfilen"}
      </button>
      <div className="mt-3">
        <ErrorNote error={error} />
      </div>
    </div>
  );
}
