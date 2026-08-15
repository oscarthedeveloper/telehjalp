import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import HomeLink from "@/components/HomeLink";
import AskAiButton from "@/components/AskAiButton";
import ProtonPassButton from "@/components/ProtonPassButton";
import FallbackNotice from "@/components/FallbackNotice";
import { findNode, findSolution, pathTo, publicView } from "@/lib/content";
import { loadContent } from "@/lib/store";

export const revalidate = 60;

export default async function SolutionPage({
  params,
}: {
  params: { slug: string; losning: string };
}) {
  const loaded = await loadContent();
  const { settings, nodes } = publicView(loaded.content);

  const node = findNode(nodes, params.slug);
  if (!node) notFound();

  const solution = findSolution(node, params.losning);
  if (!solution) notFound();

  return (
    <main>
      <PageHeader title={solution.title} trail={pathTo(nodes, node.slug)} />

      {loaded.source === "fallback" && <FallbackNotice problem={loaded.problem} />}

      {solution.cause ? (
        <p className="mb-8 rounded-2xl bg-white p-5 text-xl leading-relaxed shadow-sm">
          {solution.cause}
        </p>
      ) : null}

      {solution.steps.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Gör så här</h2>
          <ol className="flex flex-col gap-4">
            {solution.steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-2xl bg-white p-5 text-xl leading-relaxed shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {solution.needsPassword && (
        <ProtonPassButton appUrl={settings.protonPassUrl} hint={solution.passwordHint} />
      )}

      <AskAiButton slug={node.slug} />
      <HomeLink />
    </main>
  );
}
