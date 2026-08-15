"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorNote } from "./EditFields";

type Counts = { nodes: number; solutions: number };
type Result = {
  nodesCreated: number;
  nodesUpdated: number;
  solutionsCreated: number;
  solutionsUpdated: number;
  settingsUpdated: number;
};

/** Räknar knappar och lösningar i filen, så man ser vad man är på väg att göra. */
function countTree(nodes: any[]): Counts {
  let count = { nodes: 0, solutions: 0 };
  for (const node of nodes ?? []) {
    count.nodes += 1;
    count.solutions += (node.solutions ?? []).length;
    const below = countTree(node.children ?? []);
    count.nodes += below.nodes;
    count.solutions += below.solutions;
  }
  return count;
}

/**
 * Sammanslagningen matchar på adressdel, inte på knappens text. Finns det
 * redan en knapp med samma text men en annan adressdel blir det två knappar
 * som ser likadana ut. Bättre att säga till innan än att förklara efteråt.
 */
function findClashes(
  nodes: any[],
  existing: { slug: string; label: string }[]
): { label: string; fromSlug: string; toSlug: string }[] {
  const bySlug = new Map(existing.map((n) => [n.slug, n]));
  const found: { label: string; fromSlug: string; toSlug: string }[] = [];

  const walk = (list: any[]) => {
    for (const node of list ?? []) {
      const label = String(node?.label ?? "").trim();
      const slug = String(node?.slug ?? "").trim();

      if (label && slug && !bySlug.has(slug)) {
        const sameLabel = existing.find(
          (n) => n.label.trim().toLowerCase() === label.toLowerCase()
        );
        if (sameLabel) {
          found.push({ label, fromSlug: sameLabel.slug, toSlug: slug });
        }
      }
      walk(node?.children ?? []);
    }
  };

  walk(nodes);
  return found;
}

export default function ImportForm({
  existing,
}: {
  existing: { slug: string; label: string }[];
}) {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  let parsed: any = null;
  let parseError: string | null = null;
  let counts: Counts | null = null;
  let clashes: { label: string; fromSlug: string; toSlug: string }[] = [];

  if (raw.trim()) {
    try {
      parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.nodes)) {
        parseError = 'Filen måste innehålla ett fält "nodes" med en lista.';
      } else {
        counts = countTree(parsed.nodes);
        clashes = findClashes(parsed.nodes, existing);
      }
    } catch (err: any) {
      parseError = `Det här är inte giltig JSON: ${err?.message ?? ""}`;
    }
  }

  async function readFile(file: File) {
    setRaw(await file.text());
    setResult(null);
    setError(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "import", content: parsed, mode }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Importen gick inte igenom.");
      setBusy(false);
      return;
    }

    setResult(payload);
    setRaw("");
    setBusy(false);
    router.refresh();
  }

  const radio = "flex gap-3 rounded-xl border-2 p-4 cursor-pointer transition";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold leading-tight">Importera innehåll</h1>
        <p className="mt-2 text-xl leading-relaxed text-subtle">
          Klistra in en JSON-fil så omvandlas den till knappar och lösningar.
        </p>
      </div>

      {result && (
        <div className="rounded-2xl border-2 border-ok bg-green-50 p-5">
          <p className="text-xl font-bold text-ok">Klart</p>
          <ul className="mt-2 flex flex-col gap-1 text-lg">
            <li>{result.nodesCreated} nya knappar, {result.nodesUpdated} uppdaterade</li>
            <li>
              {result.solutionsCreated} nya lösningar, {result.solutionsUpdated} uppdaterade
            </li>
            {result.settingsUpdated > 0 && <li>{result.settingsUpdated} inställningar</li>}
          </ul>
          <a
            href="/admin"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-lg font-semibold text-white"
          >
            Gå till sidorna och titta
          </a>
        </div>
      )}

      <div className="rounded-2xl border-2 border-slate-300 bg-white p-5">
        <label className="block text-base font-semibold text-subtle">Välj en fil</label>
        <input
          type="file"
          accept="application/json,.json"
          className="mt-2 block w-full text-base"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
          }}
        />

        <label className="mt-5 block text-base font-semibold text-subtle">
          … eller klistra in innehållet här
        </label>
        <textarea
          className="mt-2 h-56 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none"
          placeholder='{ "nodes": [ … ] }'
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setResult(null);
          }}
        />

        {parseError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-base text-red-800">{parseError}</p>}

        {clashes.length > 0 && (
          <div className="mt-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
            <p className="text-lg font-semibold text-warn">
              Det blir dubbletter av {clashes.length === 1 ? "en knapp" : `${clashes.length} knappar`}
            </p>
            <p className="mt-2 text-base leading-relaxed">
              Sammanslagningen matchar på adressdel, inte på texten. Följande knappar
              finns redan med samma text men en annan adressdel, och läggs därför till
              som nya:
            </p>
            <ul className="mt-3 flex flex-col gap-1 text-base">
              {clashes.map((clash) => (
                <li key={clash.toSlug}>
                  <strong>{clash.label}</strong>
                  <span className="ml-2 font-mono text-sm text-subtle">
                    {clash.fromSlug} → {clash.toSlug}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-base leading-relaxed">
              Vill du slå ihop dem: ändra adressdelen på den befintliga knappen till
              den som står till höger innan du importerar. Då uppdateras den i stället.
            </p>
          </div>
        )}

        {counts && (
          <p className="mt-3 rounded-lg bg-brand-light p-3 text-lg">
            Filen innehåller <strong>{counts.nodes} knappar</strong> och{" "}
            <strong>{counts.solutions} lösningar</strong>.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-lg font-semibold">Hur ska det befintliga innehållet hanteras?</p>

        <label
          className={`${radio} ${mode === "merge" ? "border-brand bg-brand-light" : "border-slate-300 bg-white"}`}
        >
          <input
            type="radio"
            className="mt-1 h-5 w-5"
            checked={mode === "merge"}
            onChange={() => setMode("merge")}
          />
          <span>
            <span className="block text-lg font-semibold">Lägg till och uppdatera</span>
            <span className="block text-base text-subtle">
              Knappar som redan finns med samma adressdel uppdateras. Nya läggs till.
              Ingenting tas bort.
            </span>
          </span>
        </label>

        <label
          className={`${radio} ${mode === "replace" ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"}`}
        >
          <input
            type="radio"
            className="mt-1 h-5 w-5"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
          />
          <span>
            <span className="block text-lg font-semibold">Ersätt allt</span>
            <span className="block text-base text-subtle">
              Allt nuvarande innehåll tas bort först. Kör <code>npm run export</code> innan,
              om du vill ha en kopia.
            </span>
          </span>
        </label>
      </div>

      <ErrorNote error={error} />

      <button
        type="button"
        disabled={busy || !counts}
        onClick={() => {
          if (
            mode === "replace" &&
            !confirm("Allt nuvarande innehåll tas bort och ersätts. Är du säker?")
          )
            return;
          submit();
        }}
        className={`tap flex w-full items-center justify-center rounded-2xl px-5 py-4 text-xl font-bold text-white disabled:opacity-40 ${
          mode === "replace" ? "bg-red-700" : "bg-brand"
        }`}
      >
        {busy ? "Importerar …" : mode === "replace" ? "Ersätt allt innehåll" : "Importera"}
      </button>
    </div>
  );
}
