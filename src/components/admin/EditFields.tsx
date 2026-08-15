"use client";

/** Gemensamma fältkomponenter för adminformulären. */

export const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand focus:outline-none";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-subtle">{label}</label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-sm text-subtle">{hint}</p>}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 text-base font-semibold">
      <input
        type="checkbox"
        className="h-5 w-5"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children}
    </label>
  );
}

export function ActionRow({
  busy,
  changed,
  onSave,
  onMoveUp,
  onMoveDown,
  onDelete,
  deleteLabel = "Ta bort",
}: {
  busy: boolean;
  changed: boolean;
  onSave: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  const btn = "rounded-lg px-4 py-2 text-base font-semibold transition disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
      <button
        type="button"
        className={`${btn} bg-brand text-white`}
        disabled={busy || !changed}
        onClick={onSave}
      >
        {changed ? "Spara" : "Sparat"}
      </button>

      {onMoveUp && (
        <button
          type="button"
          className={`${btn} border border-slate-300`}
          disabled={busy}
          onClick={onMoveUp}
          aria-label="Flytta uppåt"
        >
          ↑
        </button>
      )}
      {onMoveDown && (
        <button
          type="button"
          className={`${btn} border border-slate-300`}
          disabled={busy}
          onClick={onMoveDown}
          aria-label="Flytta nedåt"
        >
          ↓
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          className={`${btn} ml-auto text-red-700 hover:bg-red-50`}
          disabled={busy}
          onClick={onDelete}
        >
          🗑 {deleteLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="rounded-lg bg-red-50 p-3 text-base text-red-800">{error}</p>;
}
