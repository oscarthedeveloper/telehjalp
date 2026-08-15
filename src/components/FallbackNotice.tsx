/**
 * Visas när innehållet inte kunde hämtas ur databasen och sidan i stället
 * visar den inbakade reservversionen. Farmor och farfar får fortfarande
 * sin hjälp – men ska veta att texten kan vara något gammal.
 */
export default function FallbackNotice({ problem }: { problem?: string }) {
  return (
    <div className="mb-6 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
      <p className="text-xl font-semibold leading-snug text-warn">
        ⚠ Just nu visas en äldre version av hjälpen
      </p>
      <p className="mt-2 text-lg leading-relaxed">
        Instruktionerna nedan fungerar ändå. Ser något konstigt ut, hör av dig till den
        som sköter TeleHjälp.
      </p>
      {problem && (
        <p className="mt-3 text-sm text-subtle">
          Teknisk orsak: {problem}
        </p>
      )}
    </div>
  );
}
