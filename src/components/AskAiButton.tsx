import Link from "next/link";

export default function AskAiButton({ slug }: { slug: string }) {
  return (
    <div className="no-print mt-10 rounded-2xl border-2 border-dashed border-slate-400 bg-white p-5">
      <p className="mb-4 text-xl font-semibold leading-snug">
        Hjälpte inget av förslagen?
      </p>
      <p className="mb-5 text-lg leading-relaxed text-subtle">
        Då kan du fråga Claude, en hjälpsam robot som svarar på svenska. TeleHjälp
        skriver frågan färdig åt dig.
      </p>
      <Link
        href={`/fraga-ai/${slug}`}
        className="tap flex w-full items-center justify-center gap-3 rounded-2xl bg-ok px-5 py-4 text-xl font-bold text-white active:scale-[0.99]"
      >
        <span aria-hidden="true" className="text-2xl">✳︎</span>
        Fråga AI
      </Link>
    </div>
  );
}
