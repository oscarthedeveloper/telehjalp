/**
 * Liten klient mot Tursos HTTP-API (POST /v2/pipeline).
 *
 * Turso har en egen SDK, men den behövs inte här: hela vårt behov är
 * "skicka SQL, få rader tillbaka". Genom att prata direkt med API:et
 * slipper projektet ett npm-beroende, och koden fungerar oförändrad i
 * vilken serverlös miljö som helst.
 *
 * Specifikation: https://docs.turso.tech/sdk/http/reference
 */

/** Så här ser ett värde ut på vägen till och från Turso. */
type WireValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "float"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string };

export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

export type Statement = { sql: string; args?: Cell[] };

export class DatabaseError extends Error {}

/* ------------------------------------------------------------------ */
/* Inställningar                                                       */
/* ------------------------------------------------------------------ */

export function isConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

function endpoint(): string {
  const raw = process.env.TURSO_DATABASE_URL;
  if (!raw) {
    throw new DatabaseError(
      "TURSO_DATABASE_URL saknas. Lägg till den under Site configuration → Environment variables i Netlify."
    );
  }
  // Turso anger adressen som libsql:// eller turso://. Över HTTP är det https://.
  const base = raw.trim().replace(/^(libsql|turso|http|https):\/\//, "").replace(/\/+$/, "");
  return `https://${base}/v2/pipeline`;
}

function token(): string {
  const value = process.env.TURSO_AUTH_TOKEN;
  if (!value) {
    throw new DatabaseError(
      "TURSO_AUTH_TOKEN saknas. Lägg till den under Site configuration → Environment variables i Netlify."
    );
  }
  return value;
}

/* ------------------------------------------------------------------ */
/* Översättning mellan JavaScript och Tursos format                    */
/* ------------------------------------------------------------------ */

function toWire(value: Cell): WireValue {
  if (value === null || value === undefined) return { type: "null" };
  if (typeof value === "boolean") return { type: "integer", value: value ? "1" : "0" };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { type: "integer", value: String(value) }
      : { type: "float", value };
  }
  return { type: "text", value: String(value) };
}

function fromWire(value: WireValue): Cell {
  switch (value?.type) {
    case "text":
      return value.value;
    // Heltal skickas som text för att inte tappa precision i JSON.
    case "integer":
      return Number(value.value);
    case "float":
      return value.value;
    case "blob":
      return value.base64;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Körning                                                             */
/* ------------------------------------------------------------------ */

type PipelineResult =
  | {
      type: "ok";
      response?: {
        type: string;
        result?: { cols: { name: string }[]; rows: WireValue[][] };
      };
    }
  | { type: "error"; error: { message: string; code?: string } };

/**
 * Kör en eller flera satser på samma anslutning och returnerar raderna
 * för varje sats. Anslutningen stängs direkt efteråt.
 */
export async function execute(statements: Statement[]): Promise<Row[][]> {
  if (statements.length === 0) return [];

  let response: Response;
  try {
    response = await fetch(endpoint(), {
      method: "POST",
      headers: {
        authorization: `Bearer ${token()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          ...statements.map((statement) => ({
            type: "execute",
            stmt: {
              sql: statement.sql,
              args: (statement.args ?? []).map(toWire),
            },
          })),
          { type: "close" },
        ],
      }),
      cache: "no-store",
    });
  } catch (err: any) {
    throw new DatabaseError(`Kunde inte nå databasen: ${err?.message ?? "okänt fel"}`);
  }

  if (response.status === 401 || response.status === 403) {
    throw new DatabaseError(
      "Databasen nekade åtkomst. Kontrollera att TURSO_AUTH_TOKEN är giltig och hör till rätt databas."
    );
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DatabaseError(`Databasen svarade ${response.status}. ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as { results?: PipelineResult[] };
  const results = payload.results ?? [];

  const rowsPerStatement: Row[][] = [];

  // Sista svaret hör till "close" och ska inte räknas.
  for (let i = 0; i < statements.length; i++) {
    const result = results[i];

    if (!result) {
      throw new DatabaseError(`Databasen svarade inte på sats ${i + 1}.`);
    }
    if (result.type === "error") {
      throw new DatabaseError(
        `${result.error.message} (i: ${statements[i].sql.slice(0, 80)})`
      );
    }

    const table = result.response?.result;
    if (!table) {
      rowsPerStatement.push([]);
      continue;
    }

    const names = table.cols.map((col) => col.name);
    rowsPerStatement.push(
      table.rows.map((cells) => {
        const row: Row = {};
        cells.forEach((cell, index) => {
          row[names[index]] = fromWire(cell);
        });
        return row;
      })
    );
  }

  return rowsPerStatement;
}

/** En enda fråga som ger rader tillbaka. */
export async function query(sql: string, args: Cell[] = []): Promise<Row[]> {
  const [rows] = await execute([{ sql, args }]);
  return rows ?? [];
}

/** En enda sats utan resultat. */
export async function run(sql: string, args: Cell[] = []): Promise<void> {
  await execute([{ sql, args }]);
}

/** Flera satser som en transaktion, på samma anslutning. */
export async function transaction(statements: Statement[]): Promise<void> {
  if (statements.length === 0) return;
  await execute([{ sql: "BEGIN" }, ...statements, { sql: "COMMIT" }]);
}
