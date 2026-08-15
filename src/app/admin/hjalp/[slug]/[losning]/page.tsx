import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { nodeBySlug, readSnapshot, solutionBySlug, trailOf } from "@/lib/store";
import AdminTrail from "@/components/admin/AdminTrail";
import EditableSolutionContent from "@/components/admin/EditableSolutionContent";
import NotConnected from "@/components/admin/NotConnected";

export const dynamic = "force-dynamic";

export default async function AdminSolutionPage({
  params,
}: {
  params: { slug: string; losning: string };
}) {
  if (!isAdmin()) notFound();

  let snapshot;
  try {
    snapshot = await readSnapshot();
  } catch (err: any) {
    return <NotConnected problem={err?.message} />;
  }

  const node = nodeBySlug(snapshot, params.slug);
  if (!node) notFound();

  const solution = solutionBySlug(snapshot, node.id, params.losning);
  if (!solution) notFound();

  return (
    <main>
      <AdminTrail trail={trailOf(snapshot, node)} />

      <h1 className="mb-6 text-3xl font-bold leading-tight">{solution.title}</h1>

      <EditableSolutionContent solution={solution} nodeSlug={node.slug} />
    </main>
  );
}
