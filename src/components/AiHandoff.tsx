"use client";

import { useState } from "react";

type Props = {
  message: string;
  claudeUrl: string;
};

/**
 * Två tydliga steg: kopiera meddelandet, öppna Claude, klistra in.
 * Claude stöder inte längre förifyllda chattmeddelanden via länk, så
 * urklipp är det som fungerar pålitligt – även i gratisversionen.
 */
export default function AiHandoff({ message, claudeUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-3 text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg text-white">
            1
          </span>
          Kopiera frågan
        </p>
        <button
          type="button"
          onClick={copy}
          className={`tap flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-xl font-bold text-white active:scale-[0.99] ${
            copied ? "bg-ok" : "bg-brand"
          }`}
        >
          {copied ? "✓ Frågan är kopierad" : "Kopiera frågan"}
        </button>

        {failed && (
          <p className="mt-4 rounded-xl bg-amber-50 p-4 text-lg leading-relaxed text-warn">
            Det gick inte att kopiera automatiskt. Håll fingret på texten längst ned
            på sidan tills <strong>Markera allt</strong> visas, och tryck sedan på
            <strong> Kopiera</strong>.
          </p>
        )}
      </section>

      <section
        className={`rounded-2xl bg-white p-5 shadow-sm transition ${
          copied ? "" : "opacity-60"
        }`}
      >
        <p className="mb-3 flex items-center gap-3 text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg text-white">
            2
          </span>
          Öppna Claude
        </p>
        <a
          href={claudeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tap flex w-full items-center justify-center gap-3 rounded-2xl bg-ok px-5 py-4 text-xl font-bold text-white active:scale-[0.99]"
        >
          Öppna Claude
        </a>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-3 text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg text-white">
            3
          </span>
          Klistra in och skicka
        </p>
        <ol className="flex flex-col gap-3 text-lg leading-relaxed">
          <li>Tryck i det vita skrivfältet längst ned i Claude.</li>
          <li>
            Håll fingret nedtryckt en sekund tills <strong>Klistra in</strong> visas,
            och tryck på det.
          </li>
          <li>Tryck sedan på pilen ↑ för att skicka.</li>
        </ol>
      </section>

      <details className="rounded-2xl border-2 border-slate-300 bg-white p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          Visa frågan som skickas
        </summary>
        <pre className="mt-4 whitespace-pre-wrap break-words text-base leading-relaxed text-subtle">
          {message}
        </pre>
      </details>
    </div>
  );
}
