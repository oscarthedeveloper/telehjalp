"use client";

import { useState } from "react";
import type { Settings, Node, Solution } from "@/lib/types";
import { buildAiMessage } from "@/lib/aiPrompt";
import { useAdminAction } from "@/lib/useAdminAction";
import { ErrorNote, Field, fieldClass } from "./EditFields";

const FIELDS: {
  key: keyof Settings;
  label: string;
  hint?: string;
  rows: "line" | "small" | "large";
}[] = [
  {
    key: "siteIntro",
    label: "Text på startsidan",
    hint: "Står under rubriken TeleHjälp.",
    rows: "small",
  },
  {
    key: "protonPassUrl",
    label: "Länk som öppnar Proton Pass",
    hint: "Fungerar knappen inte på telefonen: prova proton-pass:// eller lämna fältet tomt. Tomt fält gör att en skriven instruktion visas i stället.",
    rows: "line",
  },
  {
    key: "claudeUrl",
    label: "Länk som öppnar Claude",
    rows: "line",
  },
  {
    key: "aiDeviceInfo",
    label: "Utrustning som skickas med till Claude",
    hint: "Hamnar näst sist i meddelandet.",
    rows: "small",
  },
  {
    key: "aiClosing",
    label: "Sista stycket i meddelandet till Claude",
    hint: "Här står instruktionen om att svaret ska anpassas för pensionärer. Sista stycket i varje fråga.",
    rows: "large",
  },
];

/* Ett påhittat exempel, så förhandsvisningen ser ut som ett riktigt meddelande. */
const SAMPLE_PATH = [
  { slug: "appar", label: "En app" },
  { slug: "instagram", label: "Instagram" },
  { slug: "flode", label: "Mitt flöde ser märkligt ut" },
] as Node[];

const SAMPLE_SOLUTIONS = [
  { slug: "a", title: "Du är inloggad på fel konto", steps: [] },
  { slug: "b", title: "Appen behöver uppdateras" },
] as Solution[];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [draft, setDraft] = useState<Settings>(settings);
  const { run, busy, error } = useAdminAction();

  const preview = buildAiMessage({
    path: SAMPLE_PATH,
    solutions: SAMPLE_SOLUTIONS,
    deviceInfo: draft.aiDeviceInfo,
    closing: draft.aiClosing,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold leading-tight">Inställningar</h1>
        <p className="mt-2 text-xl leading-relaxed text-subtle">
          Texter och länkar som gäller hela sidan.
        </p>
      </div>

      {FIELDS.map((field) => {
        const changed = draft[field.key] !== settings[field.key];

        return (
          <div key={field.key} className="rounded-2xl border-2 border-slate-300 bg-white p-5">
            <Field label={field.label} hint={field.hint}>
              {field.rows === "line" ? (
                <input
                  className={`${fieldClass} font-mono`}
                  value={draft[field.key] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                />
              ) : (
                <textarea
                  className={`${fieldClass} ${field.rows === "large" ? "h-40" : "h-20"}`}
                  value={draft[field.key] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                />
              )}
            </Field>

            <button
              type="button"
              disabled={busy || !changed}
              onClick={() =>
                run({ action: "setting.update", key: field.key, value: draft[field.key] ?? "" })
              }
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-base font-semibold text-white disabled:opacity-40"
            >
              {changed ? "Spara" : "Sparat"}
            </button>
          </div>
        );
      })}

      <ErrorNote error={error} />

      <section className="rounded-2xl border-2 border-slate-300 bg-white p-5">
        <h2 className="text-xl font-bold">Så blir meddelandet till Claude</h2>
        <p className="mt-1 text-base text-subtle">
          Exempel med påhittade knapptryckningar. De tre första raderna byts ut mot den
          väg farmor eller farfar faktiskt gått.
        </p>
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-base leading-relaxed">
          {preview}
        </pre>
      </section>
    </div>
  );
}
