export const SESSION_COOKIE = "hgs_admin_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

type Payload = { exp: number };

function getSecret(): string {
  const s = process.env.HGS_ADMIN_SESSION_SECRET;
  if (!s) throw new Error("Missing HGS_ADMIN_SESSION_SECRET env var");
  return s;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function hmac(data: string, secret: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(ttlSeconds = SESSION_TTL_SECONDS): Promise<string> {
  const payload: Payload = { exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body, getSecret());
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifySession(cookieValue: string | undefined | null): Promise<boolean> {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [body, providedSig] = parts;
  try {
    const expected = await hmac(body, getSecret());
    const provided = b64urlDecode(providedSig);
    if (!timingSafeEqual(expected, provided)) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Payload;
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookieAttributes(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieAttributes(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}
