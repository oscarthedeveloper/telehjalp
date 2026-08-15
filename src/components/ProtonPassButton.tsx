"use client";

import { useState } from "react";

type Props = {
  /** URL som öppnar Proton Pass, t.ex. "protonpass://". Tom = visa bara instruktion. */
  appUrl: string;
  hint?: string | null;
};

/**
 * Öppnar Proton Pass. Händer ingenting inom ett par sekunder (t.ex. för att
 * app-länken ser annorlunda ut i en framtida version) visas i stället en
 * skriven instruktion, i stället för att kasta iväg användaren till App Store.
 */
export default function ProtonPassButton({ appUrl, hint }: Props) {
  const [showFallback, setShowFallback] = useState(!appUrl);

  function open() {
    if (!appUrl) {
      setShowFallback(true);
      return;
    }
    const startedAt = Date.now();
    window.location.href = appUrl;
    window.setTimeout(() => {
      // Har appen öppnats har fliken varit dold, eller så har det tagit tid.
      if (document.visibilityState === "visible" && Date.now() - startedAt < 4000) {
        setShowFallback(true);
      }
    }, 2000);
  }

  return (
    <div className="mt-6 rounded-2xl border-2 border-brand bg-brand-light p-5">
      <p className="mb-4 text-xl font-semibold leading-snug">
        🔑 Behöver du lösenordet?
      </p>
      {hint ? <p className="mb-4 text-lg leading-relaxed">{hint}</p> : null}

      <button
        type="button"
        onClick={open}
        className="tap flex w-full items-center justify-center gap-3 rounded-2xl bg-brand px-5 py-4 text-xl font-bold text-white active:scale-[0.99]"
      >
        Tryck här för att hitta lösenord
      </button>

      {showFallback && (
        <div className="mt-4 rounded-xl bg-white p-4 text-lg leading-relaxed">
          <p className="font-semibold">Öppnade Proton Pass inte?</p>
          <p className="mt-2">
            Tryck på hemknappen eller svep uppåt, öppna mappen på hemskärmen och tryck på
            <strong> Proton Pass</strong>. Sök sedan upp rätt konto i listan och tryck på
            lösenordet för att kopiera det.
          </p>
        </div>
      )}
    </div>
  );
}
