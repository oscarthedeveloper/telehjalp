import Link from "next/link";

export default function HomeLink() {
  return (
    <Link
      href="/"
      className="tap no-print mt-10 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 text-xl font-semibold text-brand"
    >
      <span aria-hidden="true" className="text-2xl">⌂</span>
      Börja om från början
    </Link>
  );
}
