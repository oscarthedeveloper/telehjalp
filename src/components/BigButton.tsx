import Link from "next/link";

type Props = {
  href: string;
  label: string;
  icon?: string | null;
  tone?: "primary" | "neutral";
};

/** Den stora knappen som hela TeleHjälp bygger på. */
export default function BigButton({ href, label, icon, tone = "neutral" }: Props) {
  const base =
    "tap flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left shadow-sm active:scale-[0.99] transition";
  const styles =
    tone === "primary"
      ? "border-brand bg-brand text-white"
      : "border-slate-300 bg-white text-ink";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {icon ? (
        <span aria-hidden="true" className="text-4xl leading-none">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 text-2xl font-semibold leading-snug">{label}</span>
      <span
        aria-hidden="true"
        className={tone === "primary" ? "text-white/80 text-3xl" : "text-slate-400 text-3xl"}
      >
        ›
      </span>
    </Link>
  );
}
