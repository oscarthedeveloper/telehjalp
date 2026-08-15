"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { NodeRow, SolutionRow } from "@/lib/store";
import type { Settings } from "@/lib/types";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-subtle";
const btn = "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-40";

type Snapshot = {
  nodes: NodeRow[];
  solutions: SolutionRow[];
  settings: Settings;
  empty: boolean;
};

export default function AdminPanel() {
  const router = useRouter();

  const [data, setData] = useState<Snapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    const response = await fetch("/api/admin", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error ?? "Kunde inte hämta innehållet.");
      setBusy(false);
      return;
    }
    setError(null);
    setData(payload);
    setBusy(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const call = useCallback(
    async (body: Record<string, unknown>, message = "Sparat") => {
      setBusy(true);
      setError(null);
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Något gick fel.");
        setBusy(false);
        return null;
      }

      setStatus(message);
      window.setTimeout(() => setStatus(null), 2500);
      await load();
      return payload;
    },
    [load]
  );

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/");
    router.refresh();
  }

  const selected = useMemo(
    () => data?.nodes.find((node) => node.id === selectedId) ?? null,
    [data, selectedId]
  );

  const nodeSolutions = useMemo(
    () =>
      (data?.solutions ?? [])
        .filter((solution) => solution.node_id === selectedId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [data, selectedId]
  );

  function renderTree(parentId: string | null, depth = 0): React.ReactNode {
    if (!data) return null;

    return data.nodes
      .filter((node) => node.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((node) => {
        const active = selectedId === node.id;
        const count = data.solutions.filter((s) => s.node_id === node.id).length;

        return (
          <div key={node.id}>
            <button
              type="button"
              onClick={() => setSelectedId(node.id)}
              style={{ paddingLeft: `${10 + depth * 18}px` }}
              className={`flex w-full items-center gap-2 rounded-lg py-2 pr-2 text-left text-sm ${
                active ? "bg-brand text-white" : "hover:bg-slate-100"
              }`}
            >
              <span>{node.icon || "•"}</span>
              <span className="flex-1 truncate">{node.label}</span>
              {!node.published && (
                <span className={active ? "text-white/70" : "text-warn"}>dold</span>
              )}
              {count > 0 && (
                <span className={active ? "text-white/60" : "text-slate-400"}>{count}</span>
              )}
            </button>
            {renderTree(node.id, depth + 1)}
          </div>
        );
      });
  }

  /* ---------------------------------------------------------------- */

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-sm text-subtle">{busy ? "Hämtar innehåll …" : "Inget innehåll."}</p>
        {error && (
          <p className="mt-4 max-w-xl rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          TeleHjälp <span className="text-subtle">· admin</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {busy && <span className="text-sm text-subtle">Arbetar …</span>}
          {status && <span className="text-sm font-semibold text-ok">{status}</span>}
          <a href="/" target="_blank" className={`${btn} border border-slate-300`}>
            Visa sidan
          </a>
          <button onClick={logout} className={`${btn} border border-slate-300`}>
            Logga ut
          </button>
        </div>
      </header>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {data.empty && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-brand bg-brand-light p-6">
          <h2 className="text-lg font-bold">Databasen är tom</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed">
            Tabellerna är skapade, men det finns inget innehåll. Fyll på med grundstrukturen
            och exemplen från <code className="rounded bg-white px-1">content/telehjalp.json</code>{" "}
            så har du något att bygga vidare på.
          </p>
          <button
            className={`${btn} mt-4 bg-brand text-white`}
            disabled={busy}
            onClick={() => call({ action: "seed" }, "Innehållet är inläst")}
          >
            Fyll på från innehållsfilen
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* --------------------------- trädet --------------------------- */}
        <aside className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-subtle">Knappar</h2>
            <button
              className={`${btn} bg-brand text-white`}
              disabled={busy}
              onClick={() => call({ action: "node.create", parentId: null, label: "Ny knapp" })}
            >
              + Topp
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">{renderTree(null)}</div>
        </aside>

        {/* ------------------------- redigering ------------------------- */}
        <section className="flex flex-col gap-6">
          {!selected && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-subtle">
              Välj en knapp till vänster för att redigera den.
            </p>
          )}

          {selected && (
            <>
              <NodeEditor
                key={selected.id}
                node={selected}
                busy={busy}
                onSave={(patch) => call({ action: "node.update", id: selected.id, patch })}
                onMove={(delta) => call({ action: "node.move", id: selected.id, delta }, "Flyttad")}
                onAddChild={() =>
                  call({ action: "node.create", parentId: selected.id, label: "Ny knapp" })
                }
                onDelete={async () => {
                  if (
                    !confirm(
                      `Ta bort "${selected.label}"? Underknappar och lösningar under den försvinner också.`
                    )
                  )
                    return;
                  await call({ action: "node.delete", id: selected.id }, "Borttagen");
                  setSelectedId(null);
                }}
              />

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold">
                    Orsaker och lösningar
                    <span className="ml-2 text-sm font-normal text-subtle">
                      visas som knappar under &quot;Det kan bero på …&quot;
                    </span>
                  </h2>
                  <button
                    className={`${btn} bg-brand text-white`}
                    disabled={busy}
                    onClick={() => call({ action: "solution.create", nodeId: selected.id })}
                  >
                    + Ny orsak
                  </button>
                </div>

                {nodeSolutions.length === 0 && (
                  <p className="text-sm text-subtle">Inga orsaker än.</p>
                )}

                <div className="flex flex-col gap-4">
                  {nodeSolutions.map((solution) => (
                    <SolutionEditor
                      key={solution.id}
                      solution={solution}
                      busy={busy}
                      onSave={(patch) =>
                        call({ action: "solution.update", id: solution.id, patch })
                      }
                      onMove={(delta) =>
                        call({ action: "solution.move", id: solution.id, delta }, "Flyttad")
                      }
                      onDelete={async () => {
                        if (!confirm(`Ta bort "${solution.title}"?`)) return;
                        await call({ action: "solution.delete", id: solution.id }, "Borttagen");
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <SettingsEditor
            settings={data.settings}
            busy={busy}
            onSave={(key, value) => call({ action: "setting.update", key, value })}
          />
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NodeEditor({
  node,
  busy,
  onSave,
  onMove,
  onAddChild,
  onDelete,
}: {
  node: NodeRow;
  busy: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  onMove: (delta: number) => void;
  onAddChild: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(node);
  useEffect(() => setDraft(node), [node]);

  const changed = JSON.stringify(draft) !== JSON.stringify(node);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Knapp</h2>
        <div className="flex gap-1">
          <button className={`${btn} border border-slate-300`} disabled={busy} onClick={() => onMove(-1)}>
            ↑ Upp
          </button>
          <button className={`${btn} border border-slate-300`} disabled={busy} onClick={() => onMove(1)}>
            ↓ Ned
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[80px_1fr]">
        <div>
          <label className={labelCls}>Ikon</label>
          <input
            className={input}
            value={draft.icon ?? ""}
            placeholder="📱"
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Text på knappen</label>
          <input
            className={input}
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelCls}>Rubrik på sidan knappen leder till</label>
        <input
          className={input}
          value={draft.heading ?? ""}
          placeholder="Lämna tom för att använda knapptexten"
          onChange={(e) => setDraft({ ...draft, heading: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <label className={labelCls}>Kort text under rubriken (valfritt)</label>
        <textarea
          className={`${input} h-20`}
          value={draft.intro ?? ""}
          onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <label className={labelCls}>Adressdel</label>
        <input
          className={`${input} font-mono`}
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
        />
        <p className="mt-1 text-xs text-subtle">Sidan nås på /hjalp/{draft.slug}</p>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={draft.published}
          onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
        />
        Synlig för farmor och farfar
      </label>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className={`${btn} bg-brand text-white`}
          disabled={busy || !changed}
          onClick={() =>
            onSave({
              label: draft.label,
              icon: draft.icon,
              heading: draft.heading,
              intro: draft.intro,
              slug: draft.slug,
              published: draft.published,
            })
          }
        >
          {changed ? "Spara" : "Sparat"}
        </button>
        <button className={`${btn} border border-slate-300`} disabled={busy} onClick={onAddChild}>
          + Underknapp
        </button>
        <button
          className={`${btn} ml-auto text-red-700 hover:bg-red-50`}
          disabled={busy}
          onClick={onDelete}
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SolutionEditor({
  solution,
  busy,
  onSave,
  onMove,
  onDelete,
}: {
  solution: SolutionRow;
  busy: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState({ ...solution, stepsText: solution.steps.join("\n") });
  useEffect(
    () => setDraft({ ...solution, stepsText: solution.steps.join("\n") }),
    [solution]
  );

  const changed =
    draft.title !== solution.title ||
    draft.slug !== solution.slug ||
    (draft.cause ?? "") !== (solution.cause ?? "") ||
    draft.stepsText !== solution.steps.join("\n") ||
    draft.needs_password !== solution.needs_password ||
    (draft.password_hint ?? "") !== (solution.password_hint ?? "") ||
    draft.published !== solution.published;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-start gap-2">
        <div className="flex-1">
          <label className={labelCls}>Orsak (texten på knappen)</label>
          <input
            className={input}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <div className="flex gap-1 pt-5">
          <button className={`${btn} border border-slate-300`} disabled={busy} onClick={() => onMove(-1)}>
            ↑
          </button>
          <button className={`${btn} border border-slate-300`} disabled={busy} onClick={() => onMove(1)}>
            ↓
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Förklaring av orsaken</label>
        <textarea
          className={`${input} h-20`}
          value={draft.cause ?? ""}
          onChange={(e) => setDraft({ ...draft, cause: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className={labelCls}>Steg – ett steg per rad</label>
        <textarea
          className={`${input} h-40`}
          value={draft.stepsText}
          onChange={(e) => setDraft({ ...draft, stepsText: e.target.value })}
        />
      </div>

      <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={draft.needs_password}
          onChange={(e) => setDraft({ ...draft, needs_password: e.target.checked })}
        />
        Visa Proton Pass-knappen
      </label>

      {draft.needs_password && (
        <div className="mb-3">
          <label className={labelCls}>Text vid lösenordsknappen</label>
          <input
            className={input}
            value={draft.password_hint ?? ""}
            placeholder="Sök på Instagram i Proton Pass."
            onChange={(e) => setDraft({ ...draft, password_hint: e.target.value })}
          />
        </div>
      )}

      <div className="mb-3">
        <label className={labelCls}>Adressdel</label>
        <input
          className={`${input} font-mono`}
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={draft.published}
            onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
          />
          Synlig
        </label>

        <button
          className={`${btn} bg-brand text-white`}
          disabled={busy || !changed}
          onClick={() =>
            onSave({
              title: draft.title,
              slug: draft.slug,
              cause: draft.cause,
              steps: draft.stepsText.split("\n"),
              needsPassword: draft.needs_password,
              passwordHint: draft.password_hint,
              published: draft.published,
            })
          }
        >
          {changed ? "Spara" : "Sparat"}
        </button>

        <button
          className={`${btn} ml-auto text-red-700 hover:bg-red-50`}
          disabled={busy}
          onClick={onDelete}
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const SETTING_FIELDS: { key: keyof Settings; label: string; hint?: string }[] = [
  { key: "siteIntro", label: "Text på startsidan" },
  {
    key: "protonPassUrl",
    label: "Länk som öppnar Proton Pass",
    hint: "Fungerar den inte: prova proton-pass:// eller lämna tom för att visa en skriven instruktion i stället.",
  },
  { key: "claudeUrl", label: "Länk som öppnar Claude" },
  { key: "aiDeviceInfo", label: "Utrustning som skickas med i meddelandet till Claude" },
  { key: "aiClosing", label: "Sista stycket i meddelandet till Claude" },
];

function SettingsEditor({
  settings,
  busy,
  onSave,
}: {
  settings: Settings;
  busy: boolean;
  onSave: (key: string, value: string) => void;
}) {
  const [draft, setDraft] = useState<Settings>(settings);
  useEffect(() => setDraft(settings), [settings]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-base font-bold">Inställningar</h2>
      <div className="flex flex-col gap-4">
        {SETTING_FIELDS.map(({ key, label, hint }) => {
          const changed = draft[key] !== settings[key];
          return (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <textarea
                className={`${input} h-20`}
                value={draft[key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
              {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
              <button
                className={`${btn} mt-2 bg-brand text-white`}
                disabled={busy || !changed}
                onClick={() => onSave(key, draft[key] ?? "")}
              >
                {changed ? "Spara" : "Sparat"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
