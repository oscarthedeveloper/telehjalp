/** Visas i admin när databasen inte går att nå. */
export default function NotConnected({ problem }: { problem?: string }) {
  return (
    <main className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6">
      <h1 className="text-2xl font-bold text-warn">Databasen svarar inte</h1>
      <p className="mt-3 text-lg leading-relaxed">
        Adminpanelen behöver databasen för att kunna visa och spara innehåll. Den
        riktiga sidan fungerar under tiden – den visar reservinnehållet.
      </p>

      {problem && (
        <p className="mt-4 rounded-lg bg-white p-3 font-mono text-sm text-subtle">{problem}</p>
      )}

      <div className="mt-5 text-base leading-relaxed">
        <p className="font-semibold">Kontrollera i tur och ordning</p>
        <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
          <li>
            Att <code>TURSO_DATABASE_URL</code> och <code>TURSO_AUTH_TOKEN</code> finns i
            Netlify, med <em>Scopes</em> på <em>All scopes</em>.
          </li>
          <li>Att du deployat om efter att ha lagt in dem.</li>
          <li>
            Att tokenen hör till rätt databas:{" "}
            <code>turso db tokens create telehjalp</code>.
          </li>
        </ol>
      </div>
    </main>
  );
}
