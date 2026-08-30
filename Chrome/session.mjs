import { URL } from "node:url";

const MAX_COOKIES = 500;
const MAX_COOKIE_VALUE = 16_384;
const RETENTION_MS = 15 * 60 * 1000;
const sessions = new Map();

function normalUrl(raw) {
  let url;
  try { url = new URL(String(raw)); } catch { throw new Error("session_url_invalid"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("session_url_invalid");
  }
  return url;
}

function cleanCookie(cookie) {
  if (!cookie || typeof cookie !== "object") throw new Error("session_cookie_invalid");
  const name = String(cookie.name ?? "");
  const value = String(cookie.value ?? "");
  const domain = String(cookie.domain ?? "");
  const path = String(cookie.path ?? "/");
  if (!name || name.length > 512 || value.length > MAX_COOKIE_VALUE || !domain || domain.length > 512 || !/^\//.test(path)) {
    throw new Error("session_cookie_invalid");
  }
  return {
    name,
    value,
    domain,
    path,
    secure: Boolean(cookie.secure),
    http_only: Boolean(cookie.httpOnly),
    session: Boolean(cookie.session),
  };
}

function prune() {
  const cutoff = Date.now() - RETENTION_MS;
  for (const [origin, item] of sessions) if (item.updatedAt < cutoff) sessions.delete(origin);
}

export function storeSession(rawUrl, rawCookies) {
  const url = normalUrl(rawUrl);
  if (!Array.isArray(rawCookies) || rawCookies.length > MAX_COOKIES) throw new Error("session_cookie_set_invalid");
  const cookies = rawCookies.map(cleanCookie);
  prune();
  sessions.set(url.origin, { updatedAt: Date.now(), cookies });
  return {
    status: "stored",
    origin: url.origin,
    cookie_count: cookies.length,
    storage: "native_process_memory",
    retention_seconds: RETENTION_MS / 1000,
    raw_values_returned: false,
  };
}

export function clearSession(rawUrl) {
  const url = normalUrl(rawUrl);
  sessions.delete(url.origin);
  return { status: "cleared", origin: url.origin, raw_values_returned: false };
}

export function sessionCookieHeader(rawUrl) {
  const url = normalUrl(rawUrl);
  prune();
  const item = sessions.get(url.origin);
  if (!item) return "";
  return item.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
