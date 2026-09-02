/**
 * Telegram channel adapter — Agent-Agnostic, 100% decoupled from legacy Pi.
 * Pure official Bot API implementation.
 *
 * Config resolution priority:
 * 1. Environment variables: TELEGRAM_BOT_TOKEN (or TELEGRAM_TOKEN), TELEGRAM_CHAT_ID
 * 2. TELEGRAM_CONFIG_PATH
 * 3. ~/.config/holar/telegram.json (Standard XDG configuration)
 * 4. ~/.pi/agent/telegram/config.json (Legacy migration fallback)
 */

import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const TELEGRAM_API = "https://api.telegram.org";
const TELEGRAM_UPDATE_LIMIT = 100;

export interface TelegramConfig {
  token: string;
  chatId?: number | string;
  lastUpdateId: number;
}

export function telegramConfigPath(): string {
  if (process.env.TELEGRAM_CONFIG_PATH) return process.env.TELEGRAM_CONFIG_PATH;
  const canonicalPath = join(homedir(), ".config", "holar", "telegram.json");
  if (existsSync(canonicalPath)) return canonicalPath;
  const legacyPath = join(homedir(), ".pi", "agent", "telegram", "config.json");
  if (existsSync(legacyPath)) return legacyPath;
  return canonicalPath;
}

export function telegramConfigured(): boolean {
  return readTelegramConfig() !== null;
}

export function readTelegramConfig(): TelegramConfig | null {
  // 1. Environment variables take highest priority
  const envToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
  const envChatId = process.env.TELEGRAM_CHAT_ID;
  if (envToken && envToken.length >= 20) {
    return {
      token: envToken,
      chatId: envChatId ? (isNaN(Number(envChatId)) ? envChatId : Number(envChatId)) : undefined,
      lastUpdateId: 0,
    };
  }

  // 2. File-based resolution
  const path = telegramConfigPath();
  try {
    if (!existsSync(path)) return null;
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
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
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
  for (let attempt = 0; attempt < 2; attempt++) {
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
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      return { ok: false, error: "telegram_unavailable" };
    }
  }
  return { ok: false, error: "telegram_unavailable" };
}

/** Send message directly to owner without agent or session restrictions */
export async function telegramSend(
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; error?: string }> {
  const config = readTelegramConfig();
  if (!config) return { ok: false, error: "telegram_not_configured" };
  if (config.chatId === undefined) return { ok: false, error: "telegram_chat_unknown" };
  if (text.length < 1 || text.length > 4_000 || text.includes("\0")) {
    return { ok: false, error: "telegram_text_invalid" };
  }

  const result = await callTelegram(config.token, "sendMessage", { chat_id: config.chatId, text }, fetchImpl);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Show a typing indicator on Telegram */
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

export type InboundTelegramMessage = {
  messageId: number;
  fromId?: number;
  fromUsername?: string;
  fromName?: string;
  chatId: number | string;
  text: string;
  date: number;
  replyToMessageId?: number;
};

/** Poll for updates from the official Telegram Bot API (Agent-Agnostic Long-Polling) */
export async function telegramPoll(
  fetchImpl: typeof fetch = fetch,
): Promise<{
  ok: boolean;
  count: number;
  replies: string[];
  messages: InboundTelegramMessage[];
  reply_contexts?: Array<{ message_id?: number; reply_text_prefix?: string }>;
  error?: string;
}> {
  const config = readTelegramConfig();
  if (!config) return { ok: false, count: 0, replies: [], messages: [], error: "telegram_not_configured" };
  const offset = config.lastUpdateId > 0 ? config.lastUpdateId + 1 : 0;
  const result = await callTelegram(
    config.token,
    "getUpdates",
    { offset, limit: TELEGRAM_UPDATE_LIMIT, timeout: 0 },
    fetchImpl,
  );
  if (!result.ok) return { ok: false, count: 0, replies: [], messages: [], error: result.error };
  const updates = Array.isArray(result.result) ? (result.result as Record<string, unknown>[]) : [];
  let maxId = config.lastUpdateId;
  const replies: string[] = [];
  const messages: InboundTelegramMessage[] = [];
  const reply_contexts: Array<{ message_id?: number; reply_text_prefix?: string }> = [];
  let discoveredChatId: number | string | undefined;

  for (const update of updates) {
    const id = typeof update.update_id === "number" ? update.update_id : 0;
    if (id > maxId) maxId = id;
    const message = update.message as Record<string, unknown> | undefined;
    const chat = message?.chat as Record<string, unknown> | undefined;
    const from = message?.from as Record<string, unknown> | undefined;
    const chatId = chat?.id;
    if (typeof chatId === "number" || typeof chatId === "string") discoveredChatId = chatId;
    if (typeof message?.text === "string" && message.text.trim().length > 0) {
      const text = message.text.trim();
      replies.push(text);

      const msgObj: InboundTelegramMessage = {
        messageId: typeof message.message_id === "number" ? message.message_id : 0,
        fromId: typeof from?.id === "number" ? from.id : undefined,
        fromUsername: typeof from?.username === "string" ? from.username : undefined,
        fromName: [from?.first_name, from?.last_name].filter(Boolean).join(" ") || undefined,
        chatId: chatId ?? config.chatId ?? "",
        text,
        date: typeof message.date === "number" ? message.date : Date.now(),
      };

      const replyTo = message.reply_to_message as Record<string, unknown> | undefined;
      if (replyTo) {
        msgObj.replyToMessageId = typeof replyTo.message_id === "number" ? replyTo.message_id : undefined;
        const repliedText = typeof replyTo.text === "string" ? replyTo.text.trim().slice(0, 120) : undefined;
        if (typeof replyTo.message_id === "number" || repliedText !== undefined) {
          reply_contexts.push({
            message_id: typeof replyTo.message_id === "number" ? replyTo.message_id : undefined,
            reply_text_prefix: repliedText,
          });
        }
      }

      messages.push(msgObj);
    }
  }

  if (maxId > config.lastUpdateId || (discoveredChatId !== undefined && config.chatId === undefined)) {
    writeTelegramConfig({
      ...config,
      chatId: config.chatId ?? discoveredChatId,
      lastUpdateId: maxId,
    });
  }

  return {
    ok: true,
    count: replies.length,
    replies,
    messages,
    reply_contexts,
  };
}
