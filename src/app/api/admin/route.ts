import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/adminAuth";
import { isConfigured } from "@/lib/db";
import { slugify } from "@/lib/content";
import {
  createNode,
  createSolution,
  deleteNode,
  deleteSolution,
  ensureSchema,
  importContent,
  isEmpty,
  moveNode,
  moveSolution,
  readSnapshot,
  reparentNode,
  seedFromFile,
  updateNode,
  updateSetting,
  updateSolution,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/** Rensar sidcachen så en ändring syns direkt. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function GET() {
  if (!isAdmin()) return fail("Ej behörig", 401);
  if (!isConfigured()) {
    return fail(
      "Databasen är inte inkopplad. Lägg till TURSO_DATABASE_URL och TURSO_AUTH_TOKEN i Netlify.",
      503
    );
  }

  try {
    // Billigt, och gör att tabellerna finns första gången panelen öppnas.
    await ensureSchema();
    const snapshot = await readSnapshot();
    return NextResponse.json({ ...snapshot, empty: snapshot.nodes.length === 0 });
  } catch (err: any) {
    return fail(err?.message ?? "Kunde inte läsa från databasen.");
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateSlug(value: unknown, what: string): string {
  const slug = String(value ?? "").trim();
  if (!SLUG.test(slug)) {
    throw new Error(
      `Ogiltig adressdel för ${what}: "${slug}". Endast små bokstäver, siffror och bindestreck.`
    );
  }
  return slug;
}

function requireText(value: unknown, what: string): string {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${what} får inte vara tom.`);
  return text;
}

export async function POST(request: Request) {
  if (!isAdmin()) return fail("Ej behörig", 401);
  if (!isConfigured()) return fail("Databasen är inte inkopplad.", 503);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return fail("Felaktig begäran.", 400);
  }

  const action = String(body?.action ?? "");

  try {
    await ensureSchema();

    switch (action) {
      /* ---------------- uppsättning ---------------- */

      case "seed": {
        if (!(await isEmpty())) {
          return fail("Databasen innehåller redan knappar. Töm den först om du vill börja om.", 400);
        }
        const result = await seedFromFile();
        refresh();
        return NextResponse.json({ ok: true, ...result });
      }

      case "import": {
        const mode = body.mode === "replace" ? "replace" : "merge";
        const result = await importContent(body.content, mode);
        refresh();
        return NextResponse.json({ ok: true, ...result });
      }

      /* ---------------- knappar ---------------- */

      case "node.create": {
        const id = await createNode(
          body.parentId ? String(body.parentId) : null,
          String(body.label ?? "Ny knapp")
        );
        refresh();
        return NextResponse.json({ ok: true, id });
      }

      case "node.update": {
        const patch: Record<string, unknown> = {};
        if ("label" in body.patch) patch.label = requireText(body.patch.label, "Knapptexten");
        if ("slug" in body.patch) patch.slug = validateSlug(body.patch.slug, "knappen");
        for (const key of ["icon", "heading", "intro"]) {
          if (key in body.patch) patch[key] = body.patch[key];
        }
        if ("published" in body.patch) patch.published = body.patch.published === true;

        await updateNode(String(body.id), patch);
        refresh();
        return NextResponse.json({ ok: true });
      }

      case "node.move": {
        await moveNode(String(body.id), Number(body.delta) < 0 ? -1 : 1);
        refresh();
        return NextResponse.json({ ok: true });
      }

      case "node.reparent": {
        await reparentNode(
          String(body.id),
          body.parentId ? String(body.parentId) : null
        );
        refresh();
        return NextResponse.json({ ok: true });
      }

      case "node.delete": {
        await deleteNode(String(body.id));
        refresh();
        return NextResponse.json({ ok: true });
      }

      /* ---------------- lösningar ---------------- */

      case "solution.create": {
        const id = await createSolution(String(body.nodeId), String(body.title ?? "Ny orsak"));
        refresh();
        return NextResponse.json({ ok: true, id });
      }

      case "solution.update": {
        const patch: Record<string, unknown> = {};
        if ("title" in body.patch) patch.title = requireText(body.patch.title, "Rubriken");
        if ("slug" in body.patch) patch.slug = validateSlug(body.patch.slug, "lösningen");
        if ("cause" in body.patch) patch.cause = body.patch.cause;
        if ("steps" in body.patch) patch.steps = body.patch.steps;
        if ("passwordHint" in body.patch) patch.passwordHint = body.patch.passwordHint;
        if ("needsPassword" in body.patch) patch.needsPassword = body.patch.needsPassword === true;
        if ("published" in body.patch) patch.published = body.patch.published === true;

        await updateSolution(String(body.id), patch);
        refresh();
        return NextResponse.json({ ok: true });
      }

      case "solution.move": {
        await moveSolution(String(body.id), Number(body.delta) < 0 ? -1 : 1);
        refresh();
        return NextResponse.json({ ok: true });
      }

      case "solution.delete": {
        await deleteSolution(String(body.id));
        refresh();
        return NextResponse.json({ ok: true });
      }

      /* ---------------- inställningar ---------------- */

      case "setting.update": {
        await updateSetting(String(body.key), String(body.value ?? ""));
        refresh();
        return NextResponse.json({ ok: true });
      }

      /* ---------------- hjälpmedel ---------------- */

      case "slugify": {
        return NextResponse.json({ slug: slugify(String(body.text ?? "")) });
      }

      default:
        return fail(`Okänd åtgärd: ${action}`, 400);
    }
  } catch (err: any) {
    const message = String(err?.message ?? "Något gick fel.");
    // Krock mot unique-villkoret ska ge ett begripligt besked.
    if (/UNIQUE constraint failed: nodes.slug/i.test(message)) {
      return fail("En annan knapp använder redan den adressdelen.", 400);
    }
    if (/UNIQUE constraint failed: solutions/i.test(message)) {
      return fail("En annan lösning under samma knapp använder redan den adressdelen.", 400);
    }
    return fail(message);
  }
}
