import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { readSnapshot } from "@/lib/store";
import SettingsForm from "@/components/admin/SettingsForm";
import NotConnected from "@/components/admin/NotConnected";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!isAdmin()) notFound();

  let snapshot;
  try {
    snapshot = await readSnapshot();
  } catch (err: any) {
    return <NotConnected problem={err?.message} />;
  }

  return <SettingsForm settings={snapshot.settings} />;
}
