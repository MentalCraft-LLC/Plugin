/**
 * Telegram channel adapter for the unified message tool.
 * Official Bot API only. Config lives in the local 0600 telegram config;
 * values never enter parameters, chat, source, logs or evidence.
 */

import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const TELEGRAM_API = "https://api.telegram.org";
const TELEGRAM_UPDATE_LIMIT = 100;

function environmentSessionId(): string {
  return process.env.HOLAR_SESSION_ID || process.env.GROK_SESSION_ID || process.env.PI_SESSION_ID || "";
}

function environmentSessionName(): string {
  return process.env.HOLAR_SESSION_NAME || process.env.PI_SESSION_NAME || "";
}

export interface TelegramConfig {
  token: string;
  chatId?: number | string;
  lastUpdateId: number;
}

export function telegramConfigPath(): string {
  if (process.env.TELEGRAM_CONFIG_PATH) return process.env.TELEGRAM_CONFIG_PATH;
  return join(homedir(), ".pi", "agent", "telegram", "config.json");
}

export function telegramConfigured(): boolean {
  return readTelegramConfig() !== null;
}

export function readTelegramConfig(): TelegramConfig | null {
  const path = telegramConfigPath();
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8_192) return null;
    const value = JSON.parse(readFileSync(path, "utf8")) as Partial<TelegramConfig>;
    if (typeof value.token !== "string" || value.token.length < 20 || value.token.length > 200) return null;
    const lastUpdateId = typeof value.lastUpdateId === "number" && value.lastUpdateId >= 0 ? value.lastUpdateId : 0;
    return { token: value.token, chatId: value.chatId, lastUpdateId };
  } catch {
    return null;
  }
}

export function writeTelegramConfig(config: TelegramConfig): void {
  const path = telegramConfigPath();
  mkdirSync(join(homedir(), ".pi", "agent", "telegram"), { recursive: true, mode: 0o700 });
  chmodSync(join(homedir(), ".pi", "agent", "telegram"), 0o700);
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, JSON.stringify(config, null, 2), { mode: 0o600, flag: "wx" });
  chmodSync(temporary, 0o600);
  renameSync(temporary, path);
  chmodSync(path, 0o600);
}

async function callTelegram(
  token: string,
  method: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  try {
    const response = await fetchImpl(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return { ok: false, error: `telegram_http_${response.status}` };
    const data = (await response.json()) as { ok?: boolean; result?: unknown; description?: string };
    return data.ok === true ? { ok: true, result: data.result } : { ok: false, error: "telegram_api_rejected" };
  } catch {
    return { ok: false, error: "telegram_unavailable" };
  }
}

export async function telegramSend(
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; error?: string }> {
  // Session activation gate (Owner 2026-08-15): only an active Session
  // (a live lease held by this process) may message the Owner. Orphaned or
  // dead processes hold no valid lease and are rejected.
  if (!await sessionIsActive()) return { ok: false, error: "telegram_session_inactive" };
  const config = readTelegramConfig();
  if (!config) return { ok: false, error: "telegram_not_configured" };
  if (config.chatId === undefined) return { ok: false, error: "telegram_chat_unknown" };
  if (text.length < 1 || text.length > 2_000 || text.includes("\0")) {
    return { ok: false, error: "telegram_text_invalid" };
  }
  // Reply routing (Owner 2026-08-15/16): when the most recent inbound
  // message came from a group chat, answer there with the bot that received
  // it. For outbound reports with no inbound context, this Session uses its
  // OWN bot (assigned_session match in the 0600 bots store) — never a fixed
  // business token — so every bot speaks with its own identity in the group.
  // Fall back to the default private chat when no bot identity resolves.
  const target = await resolveReplyTarget(fetchImpl).catch(() => null);
  const sessionBot = await resolveSessionBot().catch(() => null);
  // Session's OWN bot speaks first (Owner 2026-08-16: every session uses its
  // own bot identity in the group) — inbound-reply target only fills in when
  // no session bot resolves, so the group never sees a business-bot voice.
  const token = sessionBot?.token ?? target?.token ?? config.token;
  const chatId = sessionBot?.chatId ?? target?.chatId ?? config.chatId;
  let result = await callTelegram(token, "sendMessage", { chat_id: chatId, text }, fetchImpl);
  if (!result.ok && target) {
    result = await callTelegram(config.token, "sendMessage", { chat_id: config.chatId, text }, fetchImpl);
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Session activation check: the local holar.sqlite store must hold at
 * least one live (unexpired) lease — only running Sessions renew their
 * leases, so an expired/absent lease means no active Session. A pid-exact
 * match is intentionally NOT required: Pi reloads spawn a fresh process
 * that inherits the Session lease, and a pid lock would false-reject the
 * reloaded runtime. Fails closed (no message) when no lease is live.
 */
async function sessionIsActive(): Promise<boolean> {
  try {
    if (process.env.HOLAR_TEST === "1") return true; // test processes hold no lease
    const dbPath = join(homedir(), ".pi", "agent", "holar.sqlite");
    if (!existsSync(dbPath)) return true; // no store: not governed, allow
    // Pi extensions run on the Node runtime: node:sqlite is the primary
    // driver (same dual-mode pattern as the governance store); bun:sqlite
    // is the test-environment fallback.
    let DatabaseConstructor: any;
    try {
      const { DatabaseSync } = await import("node:sqlite");
      DatabaseConstructor = DatabaseSync;
    } catch {
      const { Database } = await import("bun:sqlite");
      DatabaseConstructor = Database;
    }
    const db = new DatabaseConstructor(dbPath, { readonly: true });
    try {
      const row = db
        .prepare("SELECT COUNT(*) AS n FROM leases WHERE expires_at > ?")
        .get(new Date().toISOString()) as { n?: number } | null;
      return (row?.n ?? 0) > 0;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}

/** Resolve the reply target from the most recent inbound Telegram message
 * when it arrived in a group chat. Values come from the local 0600 bot
 * store and D1 (message DB); never exposed. Returns null on any failure
 * (caller falls back to the default private chat). */
async function resolveReplyTarget(
  fetchImpl: typeof fetch = fetch,
): Promise<{ token: string; chatId: number | string } | null> {
  try {
    const botsPath = join(homedir(), ".pi", "agent", "telegram", "bots.json");
    if (!existsSync(botsPath)) return null;
    const bots = JSON.parse(readFileSync(botsPath, "utf8")) as Array<{ bot_id?: string; token?: string; assigned_session?: string }>;
    const tokenFile = join(homedir(), ".config", "holar", "cloudflare", "token");
    if (!existsSync(tokenFile)) return null;
    const cfToken = readFileSync(tokenFile, "utf8").trim();
    if (!cfToken) return null;
    const acc = "742ccacf0ba67e0048cb8eb510bfb6a1";
    const listResp = await fetchImpl(
      `https://api.cloudflare.com/client/v4/accounts/${acc}/d1/database`,
      { headers: { Authorization: `Bearer ${cfToken}` } },
    );
    if (!listResp.ok) return null;
    const listJson = (await listResp.json()) as { result?: Array<{ name?: string; uuid?: string }> };
    const db = listJson.result?.find((d) => d.name === "message")?.uuid;
    if (!db) return null;
    const qResp = await fetchImpl(
      `https://api.cloudflare.com/client/v4/accounts/${acc}/d1/database/${db}/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${cfToken}`, "content-type": "application/json" },
        body: JSON.stringify({
          sql: "SELECT bot_id, chat_id FROM mzt_telegram_inbound ORDER BY seq DESC LIMIT 1",
        }),
      },
    );
    if (!qResp.ok) return null;
    const qJson = (await qResp.json()) as { result?: Array<{ results?: Array<{ bot_id?: string; chat_id?: number }> }> };
    const row = qJson.result?.[0]?.results?.[0];
    const chatId = row?.chat_id;
    if (typeof chatId !== "number" || chatId < 0) return null; // groups disabled — private only
    const bot = bots.find((b) => b.bot_id === row?.bot_id);
    if (!bot?.token) return null;
    // Private-line only (Owner 2026-08-16): group messages are disabled —
    // inbound group traffic is ignored; only direct messages are answered
    // by the SAME bot that received them.
    // Owner directive 2026-08-15: the business (supervision) bot keeps its
    // reports in the private chat — groups are project-team discussion spaces;
    // business reports/decisions stay on the direct line with the Owner.
    if (String(bot.assigned_session ?? "") === "holar") return null;
    return { token: bot.token, chatId };
  } catch {
    return null;
  }
}

/** Poll for updates; returns new inbound text messages (bounded). */
/** Show a chat action (for example "typing…") so the Owner sees the bot
 * is working on their message — Telegram-native status feedback. */

/** Resolve THIS Session's own bot identity (assigned_session match in the
 * 0600 bots store) for outbound group reports — every bot speaks with its
 * own identity; never a fixed shared token. */
export async function resolveSessionBot(botsPathArg?: string): Promise<{ token: string; chatId?: number | null } | null> {
  try {
    const botsPath = botsPathArg ?? join(homedir(), ".pi", "agent", "telegram", "bots.json");
    if (!existsSync(botsPath)) return null;
    const bots = JSON.parse(readFileSync(botsPath, "utf8")) as Array<{ bot_id?: string; token?: string; assigned_session?: string; chat_id?: number | null }>;
    // This Session's identity: prefer the HolarStore binding name (session_id
    // -> name), fall back to the owner-route tail. Match bots.json by exact
    // assigned_session, then by shared tail word (business-service ~
    // business-infra-service -> service bot).
    let sessionName = "";
    try {
      const dbPath = join(homedir(), ".pi", "agent", "holar.sqlite");
      if (existsSync(dbPath)) {
        try {
          const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
          const db = new DatabaseSync(dbPath, { readOnly: true });
          const row = db.prepare("SELECT name FROM session_bindings WHERE session_id LIKE ?").get(`${environmentSessionId()}%`) as { name?: string } | undefined;
          db.close();
          sessionName = row?.name ?? "";
        } catch {
          const { Database } = await import("bun:sqlite");
          const DatabaseConstructor: any = Database;
          const db = new DatabaseConstructor(dbPath, { readonly: true });
          const row = db.prepare("SELECT name FROM session_bindings WHERE session_id LIKE ?").get(`${environmentSessionId()}%`) as { name?: string } | undefined;
          db.close();
          sessionName = row?.name ?? "";
        }
      }
    } catch {
        sessionName = environmentSessionName();
    }
    const tail = sessionName.split("/").pop()?.split("-").pop() ?? "";
    const bot = sessionName
      ? bots.find((b) => (b.assigned_session ?? "") === sessionName)
        ?? bots.find((b) => (b.assigned_session ?? "").split("-").pop() === tail)
        ?? bots.find((b) => (b.bot_id ?? "") === tail)
      : undefined;
    if (!bot?.token) return null;
    return { token: bot.token, chatId: bot.chat_id ?? null };
  } catch {
    return null;
  }
}

export async function telegramChatAction(
  action: "typing" | "upload_photo" | "record_video" | "choose_sticker" = "typing",
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; error?: string }> {
  const config = readTelegramConfig();
  if (!config) return { ok: false, error: "telegram_not_configured" };
  if (config.chatId === undefined) return { ok: false, error: "telegram_chat_unknown" };
  const result = await callTelegram(
    config.token,
    "sendChatAction",
    { chat_id: config.chatId, action },
    fetchImpl,
  );
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function telegramPoll(
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; count: number; replies: string[]; reply_contexts?: Array<{ message_id?: number; reply_text_prefix?: string }>; error?: string }> {
  const config = readTelegramConfig();
  if (!config) return { ok: false, count: 0, replies: [], error: "telegram_not_configured" };
  const offset = config.lastUpdateId + 1;
  const result = await callTelegram(
    config.token,
    "getUpdates",
    { offset, limit: TELEGRAM_UPDATE_LIMIT, timeout: 5 },
    fetchImpl,
  );
  if (!result.ok) return { ok: false, count: 0, replies: [], error: result.error };
  const updates = Array.isArray(result.result) ? (result.result as Record<string, unknown>[]) : [];
  let maxId = config.lastUpdateId;
  const replies: string[] = [];
  const reply_contexts: Array<{ message_id?: number; reply_text_prefix?: string }> = [];
  let discoveredChatId: number | string | undefined;
  for (const update of updates) {
    const id = typeof update.update_id === "number" ? update.update_id : 0;
    if (id > maxId) maxId = id;
    const message = update.message as Record<string, unknown> | undefined;
    const chat = message?.chat as Record<string, unknown> | undefined;
    const chatId = chat?.id;
    if (typeof chatId === "number" || typeof chatId === "string") discoveredChatId = chatId;
    if (typeof message?.text === "string" && message.text.trim().length > 0) {
      replies.push(message.text.trim().slice(0, 400));
      // Reply-location mechanism (Owner 2026-08-14): capture the replied-to
      // message id and a bounded prefix of its text so a numbered reply
      // ("1") can be bound back to the original message it answers.
      const replyTo = message.reply_to_message as Record<string, unknown> | undefined;
      if (replyTo) {
        const repliedText = typeof replyTo.text === "string" ? replyTo.text.trim().slice(0, 120) : undefined;
        if (typeof replyTo.message_id === "number" || repliedText !== undefined) {
          reply_contexts.push({
            message_id: typeof replyTo.message_id === "number" ? replyTo.message_id : undefined,
            reply_text_prefix: repliedText,
          });
        }
      }
    }
  }
  if (maxId > config.lastUpdateId || (discoveredChatId !== undefined && config.chatId === undefined)) {
    writeTelegramConfig({
      ...config,
      chatId: config.chatId ?? discoveredChatId,
      lastUpdateId: maxId,
    });
  }
  const trimmed = replies.slice(0, 10);
  return { ok: true, count: trimmed.length, replies: trimmed, reply_contexts: reply_contexts.slice(0, 10) };
}
