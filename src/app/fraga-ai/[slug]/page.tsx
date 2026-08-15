import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import HomeLink from "@/components/HomeLink";
import AiHandoff from "@/components/AiHandoff";
import { buildAiMessage } from "@/lib/aiPrompt";
import { findNode, pathTo, publicView, solutionsOf } from "@/lib/content";
import { loadContent } from "@/lib/store";

export const revalidate = 60;

export default async function AskAiPage({ params }: { params: { slug: string } }) {
  const loaded = await loadContent();
  const { settings, nodes } = publicView(loaded.content);

  const node = findNode(nodes, params.slug);
  if (!node) notFound();

  const path = pathTo(nodes, node.slug);

  const message = buildAiMessage({
    path,
    solutions: solutionsOf(node),
    deviceInfo: settings.aiDeviceInfo,
    closing: settings.aiClosing,
  });

  return (
    <main>
      <PageHeader
        title="Fråga AI"
        intro="Claude är en hjälpsam robot som svarar på svenska. Gör så här, i tre steg."
        trail={path}
      />
      <AiHandoff message={message} claudeUrl={settings.claudeUrl} />
      <HomeLink />
    </main>
  );
}
