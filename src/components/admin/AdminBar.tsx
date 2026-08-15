"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/** Alltid överst i administrationen, så man aldrig tvivlar på var man är. */
export default function AdminBar() {
  const router = useRouter();
  const pathname = usePathname();
  const onSettings = pathname === "/admin/installningar";

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/");
    router.refresh();
  }

  const link =
    "rounded-lg border-2 border-white/40 px-3 py-2 text-base font-semibold text-white transition hover:bg-white/15";

  return (
    <div className="no-print mb-6 rounded-2xl bg-brand-dark px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin" className="mr-auto text-lg font-bold text-white">
          ✎ Administration
        </Link>

        {onSettings ? (
          <Link href="/admin" className={link}>
            Sidorna
          </Link>
        ) : (
          <Link href="/admin/installningar" className={link}>
            Inställningar
          </Link>
        )}

        <a href="/" target="_blank" rel="noopener noreferrer" className={link}>
          Visa riktiga sidan
        </a>

        <button type="button" onClick={logout} className={link}>
          Logga ut
        </button>
      </div>
    </div>
  );
}
