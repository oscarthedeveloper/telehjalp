import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { isConfigured } from "@/lib/db";
import { readSnapshot } from "@/lib/store";
import ImportForm from "@/components/admin/ImportForm";
import NotConnected from "@/components/admin/NotConnected";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  if (!isAdmin()) notFound();
  if (!isConfigured()) return <NotConnected />;

  let existing: { slug: string; label: string }[] = [];
  try {
    const snapshot = await readSnapshot();
    existing = snapshot.nodes.map((node) => ({ slug: node.slug, label: node.label }));
  } catch (err: any) {
    return <NotConnected problem={err?.message} />;
  }

  return <ImportForm existing={existing} />;
}
