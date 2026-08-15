import Link from "next/link";
import type { Node } from "@/lib/types";

type Props = {
  title: string;
  intro?: string | null;
  /** Vägen hit, utan den aktuella sidan. Sista posten blir "Tillbaka". */
  trail?: Node[];
};

export default function PageHeader({ title, intro, trail = [] }: Props) {
  const parent = trail.length > 0 ? trail[trail.length - 1] : null;
  const backHref = parent ? `/hjalp/${parent.slug}` : "/";
  const backLabel = parent ? parent.label : "Startsidan";

  return (
    <header className="mb-6">
      <Link
        href={backHref}
        className="tap no-print mb-5 inline-flex items-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 text-xl font-semibold text-brand"
      >
        <span aria-hidden="true" className="text-3xl leading-none">‹</span>
        Tillbaka till {backLabel}
      </Link>

      {trail.length > 0 && (
        <p className="mb-2 text-base text-subtle">
          {trail.map((n) => n.label).join(" › ")}
        </p>
      )}

      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      {intro ? <p className="mt-3 text-xl leading-relaxed text-subtle">{intro}</p> : null}
    </header>
  );
}
