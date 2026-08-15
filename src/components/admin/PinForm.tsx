"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PinForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (response.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Inloggningen misslyckades.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm pt-20">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-2 text-base text-subtle">Ange PIN-kod för att fortsätta.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="rounded-xl border-2 border-slate-300 px-4 py-3 text-xl tracking-widest"
          placeholder="PIN-kod"
        />
        <button
          type="submit"
          disabled={busy || pin.length === 0}
          className="rounded-xl bg-brand px-4 py-3 text-lg font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Loggar in …" : "Logga in"}
        </button>
        {error && <p className="text-base text-red-700">{error}</p>}
      </form>
    </main>
  );
}
