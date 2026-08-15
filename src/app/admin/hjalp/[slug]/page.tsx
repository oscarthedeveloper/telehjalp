import { notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/adminAuth";
import { childrenOf, nodeBySlug, readSnapshot, solutionsOfNode, trailOf } from "@/lib/store";
import AdminTrail from "@/components/admin/AdminTrail";
import EditableHeading from "@/components/admin/EditableHeading";
import EditableNodeButton from "@/components/admin/EditableNodeButton";
import EditableSolutionButton from "@/components/admin/EditableSolutionButton";
import AddItemButton from "@/components/admin/AddItemButton";
import NotConnected from "@/components/admin/NotConnected";

export const dynamic = "force-dynamic";

export default async function AdminNodePage({ params }: { params: { slug: string } }) {
  if (!isAdmin()) notFound();

  let snapshot;
  try {
    snapshot = await readSnapshot();
  } catch (err: any) {
    return <NotConnected problem={err?.message} />;
  }

  const node = nodeBySlug(snapshot, params.slug);
  if (!node) notFound();

  const trail = trailOf(snapshot, node).slice(0, -1);
  const children = childrenOf(snapshot, node.id);
  const solutions = solutionsOfNode(snapshot, node.id);

  return (
    <main>
      <AdminTrail trail={trail} />
      <EditableHeading node={node} />

      <section>
        <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-subtle">
          Knappar som leder vidare
        </h2>
        <div className="flex flex-col gap-4">
          {children.map((child) => (
            <EditableNodeButton key={child.id} node={child} />
          ))}
          <AddItemButton
            label="Lägg till knapp här"
            action={{ action: "node.create", parentId: node.id, label: "Ny knapp" }}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-2xl font-semibold">Det kan bero på …</h2>
        <p className="mb-3 text-base text-subtle">
          Lösningar som visas när den här knappen är slutstationen.
        </p>
        <div className="flex flex-col gap-4">
          {solutions.map((solution) => (
            <EditableSolutionButton
              key={solution.id}
              solution={solution}
              nodeSlug={node.slug}
            />
          ))}
          <AddItemButton
            label="Lägg till orsak här"
            action={{ action: "solution.create", nodeId: node.id, title: "Ny orsak" }}
          />
        </div>
      </section>

      {(solutions.length > 0 || children.length === 0) && (
        <section className="mt-10 rounded-2xl border-2 border-dashed border-slate-400 bg-white p-5">
          <p className="text-xl font-semibold leading-snug">Här visas knappen Fråga AI</p>
          <p className="mt-2 text-base leading-relaxed text-subtle">
            Farmor och farfar kan skicka just den här vägen genom knapparna till Claude.
            Meddelandets fasta delar ändrar du under{" "}
            <Link href="/admin/installningar" className="font-semibold text-brand underline">
              Inställningar
            </Link>
            .
          </p>
        </section>
      )}
    </main>
  );
}
