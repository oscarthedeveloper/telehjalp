import Link from "next/link";

export default function NotFound() {
  return (
    <main className="pt-16 text-center">
      <p className="text-6xl" aria-hidden="true">🧭</p>
      <h1 className="mt-6 text-3xl font-bold">Sidan finns inte</h1>
      <p className="mt-3 text-xl leading-relaxed text-subtle">
        Något gick snett. Tryck på knappen så kommer du tillbaka.
      </p>
      <Link
        href="/"
        className="tap mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-brand px-5 py-4 text-xl font-bold text-white"
      >
        Till TeleHjälps startsida
      </Link>
    </main>
  );
}
