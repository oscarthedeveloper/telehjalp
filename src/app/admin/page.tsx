import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/adminAuth";
import PinForm from "@/components/admin/PinForm";
import AdminPanel from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Miljövariabler som adminpanelen inte klarar sig utan. */
function missingSettings(): string[] {
  const missing: string[] = [];

  if (!process.env.ADMIN_KEY?.trim()) missing.push("ADMIN_KEY");
  if (!process.env.ADMIN_PIN?.trim()) missing.push("ADMIN_PIN");

  const secret = process.env.ADMIN_SECRET?.trim() ?? "";
  if (!secret) missing.push("ADMIN_SECRET");
  else if (secret.length < 16) missing.push("ADMIN_SECRET (minst 16 tecken)");

  return missing;
}

/**
 * Två lås:
 *   1. Rätt hemlig nyckel i adressen (?k=...). Fel nyckel ger "Sidan finns inte",
 *      så sidan går inte att snubbla in på.
 *   2. PIN-kod, som ger en signerad kaka i 8 timmar.
 *
 * Är variablerna inte satta alls går panelen ändå inte att komma in i, och då
 * är ett tydligt besked mer värt än en 404 som inte säger något.
 */
export default function AdminPage({
  searchParams,
}: {
  searchParams: { k?: string };
}) {
  if (isAdmin()) {
    return <AdminPanel />;
  }

  const missing = missingSettings();
  if (missing.length > 0) {
    return <SetupNeeded missing={missing} />;
  }

  // Trimmas på båda håll: ett efterhängande blanksteg i Netlify är annars
  // omöjligt att se men gör att nyckeln aldrig matchar.
  const key = process.env.ADMIN_KEY!.trim();
  if ((searchParams.k ?? "").trim() !== key) {
    notFound();
  }

  return <PinForm />;
}

function SetupNeeded({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Adminpanelen är inte uppsatt än</h1>
      <p className="mt-3 text-base leading-relaxed text-subtle">
        Följande miljövariabler saknas där sidan körs. Ingen kommer in i panelen
        förrän de är satta.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {missing.map((name) => (
          <li key={name} className="rounded-lg bg-red-50 px-4 py-2 font-mono text-sm text-red-800">
            {name}
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-lg border border-slate-300 bg-white p-4 text-base leading-relaxed">
        <p className="font-semibold">Så gör du i Netlify</p>
        <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
          <li>Site configuration → Environment variables → Add a variable.</li>
          <li>
            Låt <strong>Scopes</strong> stå på <em>All scopes</em>. Är den satt till
            enbart <em>Builds</em> ser den körande sidan inte variabeln.
          </li>
          <li>
            Deploys → Trigger deploy → <strong>Deploy site</strong>. Ändrade variabler
            slår inte igenom på en publicering som redan är gjord.
          </li>
        </ol>
      </div>
    </main>
  );
}
