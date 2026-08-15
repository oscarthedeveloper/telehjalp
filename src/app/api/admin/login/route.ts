import { NextResponse } from "next/server";
import { ADMIN_COOKIE, TOKEN_MAX_AGE_SECONDS, createToken, pinMatches } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Enkel bromskloss mot gissning av PIN-koden.
const attempts = new Map<string, { count: number; until: number }>();

function throttled(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= 8;
}

function registerFailure(ip: string) {
  const entry = attempts.get(ip);
  const until = Date.now() + 15 * 60 * 1000;
  attempts.set(ip, { count: (entry?.count ?? 0) + 1, until });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "okänd";

  if (throttled(ip)) {
    return NextResponse.json(
      { error: "För många försök. Vänta en kvart och prova igen." },
      { status: 429 }
    );
  }

  let pin = "";
  try {
    const body = await request.json();
    pin = String(body?.pin ?? "");
  } catch {
    return NextResponse.json({ error: "Felaktig begäran." }, { status: 400 });
  }

  if (!pinMatches(pin)) {
    registerFailure(ip);
    return NextResponse.json({ error: "Fel PIN-kod." }, { status: 401 });
  }

  attempts.delete(ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
