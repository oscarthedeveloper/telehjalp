import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { isConfigured } from "@/lib/db";
import ImportForm from "@/components/admin/ImportForm";
import NotConnected from "@/components/admin/NotConnected";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  if (!isAdmin()) notFound();
  if (!isConfigured()) return <NotConnected />;

  return <ImportForm />;
}
