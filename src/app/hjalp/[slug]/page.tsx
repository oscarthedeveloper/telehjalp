import { notFound } from "next/navigation";
import BigButton from "@/components/BigButton";
import PageHeader from "@/components/PageHeader";
import HomeLink from "@/components/HomeLink";
import AskAiButton from "@/components/AskAiButton";
import FallbackNotice from "@/components/FallbackNotice";
import { findNode, pathTo, publicView, solutionsOf } from "@/lib/content";
import { loadContent } from "@/lib/store";

export const revalidate = 60;

export default async function NodePage({ params }: { params: { slug: string } }) {
  const loaded = await loadContent();
  const { nodes } = publicView(loaded.content);

  const node = findNode(nodes, params.slug);
  if (!node) notFound();

  const trail = pathTo(nodes, node.slug).slice(0, -1);
  const children = node.children ?? [];
  const solutions = solutionsOf(node);

  return (
    <main>
      <PageHeader title={node.heading || node.label} intro={node.intro} trail={trail} />

      {loaded.source === "fallback" && <FallbackNotice problem={loaded.problem} />}

      {children.length > 0 && (
        <nav className="flex flex-col gap-4">
          {children.map((child) => (
            <BigButton
              key={child.slug}
              href={`/hjalp/${child.slug}`}
              label={child.label}
              icon={child.icon}
            />
          ))}
        </nav>
      )}

      {solutions.length > 0 && (
        <section className={children.length > 0 ? "mt-10" : ""}>
          <h2 className="mb-4 text-2xl font-semibold">Det kan bero på …</h2>
          <div className="flex flex-col gap-4">
            {solutions.map((solution) => (
              <BigButton
                key={solution.slug}
                href={`/hjalp/${node.slug}/${solution.slug}`}
                label={solution.title}
              />
            ))}
          </div>
        </section>
      )}

      {children.length === 0 && solutions.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-lg leading-relaxed text-subtle">
          Här finns inga förslag ännu. Tryck på <strong>Fråga AI</strong> nedan så
          hjälper Claude dig.
        </p>
      )}

      {(solutions.length > 0 || children.length === 0) && <AskAiButton slug={node.slug} />}

      <HomeLink />
    </main>
  );
}
