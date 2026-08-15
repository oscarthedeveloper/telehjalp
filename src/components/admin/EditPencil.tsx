"use client";

/** Den lilla pennan i knappens högra hörn. */
export default function EditPencil({
  open,
  onClick,
  label,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? `Stäng redigering av ${label}` : `Ändra ${label}`}
      aria-expanded={open}
      className={`absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border-2 text-xl transition ${
        open
          ? "border-brand bg-brand text-white"
          : "border-slate-300 bg-white text-brand hover:bg-brand-light"
      }`}
    >
      {open ? "✕" : "✎"}
    </button>
  );
}
