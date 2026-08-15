import BigButton from "@/components/BigButton";
import FallbackNotice from "@/components/FallbackNotice";
import { publicView } from "@/lib/content";
import { loadContent } from "@/lib/store";

export const revalidate = 60;

export default async function Home() {
  const loaded = await loadContent();
  const { settings, nodes } = publicView(loaded.content);

  return (
    <main>
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand">TeleHjälp</h1>
        <p className="mt-3 text-xl leading-relaxed text-subtle">{settings.siteIntro}</p>
      </header>

      {loaded.source === "fallback" && <FallbackNotice problem={loaded.problem} />}

      <p className="mb-4 text-2xl font-semibold">Jag har besvär med …</p>

      <nav className="flex flex-col gap-4">
        {nodes.map((node) => (
          <BigButton
            key={node.slug}
            href={`/hjalp/${node.slug}`}
            label={node.label}
            icon={node.icon}
          />
        ))}
      </nav>

      {nodes.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-lg leading-relaxed text-subtle">
          Här är tomt än så länge. Lägg till knappar i adminpanelen.
        </p>
      )}
    </main>
  );
}
