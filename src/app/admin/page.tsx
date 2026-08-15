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

/**
 * Två lås:
 *   1. Rätt hemlig nyckel i adressen (?k=...). Fel nyckel ger "Sidan finns inte",
 *      så sidan går inte att snubbla in på.
 *   2. PIN-kod, som ger en signerad kaka i 8 timmar.
 */
export default function AdminPage({
  searchParams,
}: {
  searchParams: { k?: string };
}) {
  if (isAdmin()) {
    return <AdminPanel />;
  }

  const key = process.env.ADMIN_KEY;
  if (!key || searchParams.k !== key) {
    notFound();
  }

  return <PinForm />;
}
