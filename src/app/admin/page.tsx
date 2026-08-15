import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/adminAuth";
import { isConfigured } from "@/lib/db";
import { childrenOf, readSnapshot } from "@/lib/store";
import PinForm from "@/components/admin/PinForm";
import EditableNodeButton from "@/components/admin/EditableNodeButton";
import AddItemButton from "@/components/admin/AddItemButton";
import SeedBox from "@/components/admin/SeedBox";
import NotConnected from "@/components/admin/NotConnected";

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { k?: string };
}) {
  /* ------------------------- två lås ------------------------- */

  if (!isAdmin()) {
    const missing = missingSettings();
    if (missing.length > 0) return <SetupNeeded missing={missing} />;

    const key = process.env.ADMIN_KEY!.trim();
    if ((searchParams.k ?? "").trim() !== key) notFound();

    return <PinForm />;
  }

  /* -------------------- startsidan, speglad ------------------- */

  if (!isConfigured()) return <NotConnected />;

  let snapshot;
  try {
    snapshot = await readSnapshot();
  } catch (err: any) {
    return <NotConnected problem={err?.message} />;
  }

  const top = childrenOf(snapshot, null);

  return (
    <main>
      {snapshot.nodes.length === 0 && <SeedBox />}

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand">TeleHjälp</h1>
        <p className="mt-3 text-xl leading-relaxed text-subtle">
          {snapshot.settings.siteIntro}
        </p>
        <p className="mt-2 text-base text-subtle">
          Texten ändras under{" "}
          <Link href="/admin/installningar" className="font-semibold text-brand underline">
            Inställningar
          </Link>
          .
        </p>
      </header>

      <p className="mb-4 text-2xl font-semibold">Jag har besvär med …</p>

      <div className="flex flex-col gap-4">
        {top.map((node) => (
          <EditableNodeButton key={node.id} node={node} />
        ))}

        <AddItemButton
          label="Lägg till knapp här"
          action={{ action: "node.create", parentId: null, label: "Ny knapp" }}
        />
      </div>
    </main>
  );
}

function SetupNeeded({ missing }: { missing: string[] }) {
  return (
    <main className="p-2">
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
