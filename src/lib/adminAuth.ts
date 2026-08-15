import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "th_admin";
const TTL_MS = 1000 * 60 * 60 * 8; // 8 timmar

function secret(): string {
  const value = process.env.ADMIN_SECRET;
  if (!value || value.length < 16) {
    throw new Error("ADMIN_SECRET saknas eller är för kort (minst 16 tecken).");
  }
  return value;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;

  const expected = sign(exp);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Läser inloggningskakan. Kastar aldrig – returnerar bara true/false. */
export function isAdmin(): boolean {
  try {
    return verifyToken(cookies().get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

/** Jämför PIN-koden utan att läcka information via svarstid. */
export function pinMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PIN ?? "";
  if (!expected) return false;
  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const TOKEN_MAX_AGE_SECONDS = TTL_MS / 1000;
