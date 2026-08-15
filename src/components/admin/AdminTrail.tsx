import Link from "next/link";
import type { NodeRow } from "@/lib/store";

/** Motsvarar "Tillbaka till …" på de riktiga sidorna. */
export default function AdminTrail({ trail }: { trail: NodeRow[] }) {
  const parent = trail.length > 0 ? trail[trail.length - 1] : null;
  const href = parent ? `/admin/hjalp/${parent.slug}` : "/admin";
  const label = parent ? parent.label : "startsidan";

  return (
    <div className="mb-5">
      <Link
        href={href}
        className="tap inline-flex items-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 text-xl font-semibold text-brand"
      >
        <span aria-hidden="true" className="text-3xl leading-none">
          ‹
        </span>
        Tillbaka till {label}
      </Link>

      {trail.length > 0 && (
        <p className="mt-2 text-base text-subtle">{trail.map((n) => n.label).join(" › ")}</p>
      )}
    </div>
  );
}
