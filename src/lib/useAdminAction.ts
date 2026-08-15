"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Skickar en åtgärd till /api/admin och laddar om sidan när den gått igenom.
 * Eftersom adminsidorna speglar de riktiga sidorna ser man resultatet direkt
 * där man står.
 */
export function useAdminAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      setBusy(true);
      setError(null);

      try {
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(payload.error ?? "Något gick fel.");
          setBusy(false);
          return false;
        }

        router.refresh();
        // Låt uppdateringen hinna fram innan formuläret stängs.
        window.setTimeout(() => setBusy(false), 400);
        return true;
      } catch (err: any) {
        setError(err?.message ?? "Kunde inte nå servern.");
        setBusy(false);
        return false;
      }
    },
    [router]
  );

  return { run, busy, error, setError };
}
