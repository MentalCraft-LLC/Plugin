import { telegramSend, telegramPoll, telegramConfigured } from "./channels/telegram.ts";
import { sendImessage, resolveRecipient, loadConfig as loadImessageConfig, watchReplies } from "./channels/imessage.ts";
import { loadConfig as loadSmtpConfig, sendEmail } from "./channels/email.ts";

export type ChannelId = "telegram" | "imessage" | "email";
export type MessageAction = "send" | "send_photo" | "poll" | "status" | "bootstrap";

export type MessageInput = {
  action: MessageAction;
  text?: string;
  photoPath?: string;
  caption?: string;
  channel?: ChannelId;
  chatId?: number | string;
};

export type MessagePollResult = {
  channel: ChannelId;
  ok: boolean;
  count: number;
  replies?: string[];
  reply_contexts?: Array<{ message_id?: number; reply_text_prefix?: string }>;
  error?: string;
};

export function requestedChannel(value: unknown): ChannelId | undefined {
  return value === "telegram" || value === "imessage" || value === "email" ? value : undefined;
}

export function channelOrder(): ChannelId[] {
  return ["telegram", "imessage", "email"];
}

export function channelConfigured(channel: ChannelId): boolean {
  if (channel === "telegram") return telegramConfigured();
  if (channel === "imessage") {
    try {
      loadImessageConfig(process.cwd());
      return true;
    } catch {
      return false;
    }
  }
  if (channel === "email") {
    try {
      loadSmtpConfig();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function sendViaChannel(channel: ChannelId, text: string): Promise<{ ok: boolean; error?: string }> {
  if (channel === "telegram") return telegramSend(text);
  if (channel === "imessage") {
    try {
      const config = loadImessageConfig(process.cwd());
      const recipient = resolveRecipient(config, "owner", process.cwd());
      await sendImessage(recipient, text);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message.slice(0, 120) : "imessage_failed" };
    }
  }
  if (channel === "email") {
    try {
      const config = loadSmtpConfig();
      if (!config.user.includes("@")) return { ok: false, error: "email_sender_invalid" };
      const result = await sendEmail(config, config.user, "MentalCraft", text);
      return result.ok ? { ok: true } : { ok: false, error: "email_send_failed" };
    } catch {
      return { ok: false, error: "email_not_configured" };
    }
  }
  return { ok: false, error: "channel_unknown" };
}

export async function pollViaChannel(channel: ChannelId): Promise<Omit<MessagePollResult, "channel">> {
  if (channel === "telegram") {
    const result = await telegramPoll();
    return result;
  }
  if (channel === "imessage") {
    try {
      const config = loadImessageConfig(process.cwd());
      const recipient = resolveRecipient(config, "owner", process.cwd());
      const rows = await watchReplies(recipient, "owner");
      return { ok: true, count: rows.length };
    } catch {
      return { ok: false, count: 0, error: "imessage_watch_unavailable" };
    }
  }
  return { ok: false, count: 0, error: "email_has_no_inbound" };
}

export function createMessageOperation() {
  return async (rawInput: MessageInput) => {
    const raw: any = (rawInput as any).params ? { ...rawInput, ...(rawInput as any).params } : rawInput;
    const action = raw.action || "status";
    const channel = raw.channel;
    const text = raw.text;
    const photoPath = raw.photoPath || raw.photo_path || text;
    const caption = raw.caption;
    const chatId = raw.chatId || raw.chat_id;

    if (action === "status") {
      const channels = channelOrder().map((ch) => ({
        channel: ch,
        configured: channelConfigured(ch),
      }));
      return { ok: true, channels };
    }

    if (action === "bootstrap") {
      return {
        ok: false,
        error: "bootstrap_local_only",
        channel: channel ?? "telegram",
      };
    }

    if (action === "poll") {
      const requested = requestedChannel(channel);
      const channels = requested ? [requested] : channelOrder().filter((ch) => channelConfigured(ch));
      const results: MessagePollResult[] = [];
      for (const ch of channels) {
        const result = await pollViaChannel(ch);
        results.push({ channel: ch, ...result });
      }
      const replies = results.flatMap((result) => result.replies ?? []);
      const reply_contexts = results.flatMap((result) => result.reply_contexts ?? []);
      return { ok: true, results, replies, reply_contexts };
    }

    if (action === "send_photo") {
      if (!photoPath) throw new Error("message send_photo requires photoPath");
      const { sendTelegramScreenshot } = await import("../../.agents/scripts/send-telegram-screenshot.ts");
      const res = await sendTelegramScreenshot(photoPath, caption || undefined);
      return { ok: true, channel: "telegram", messageId: res.messageId, webpPath: res.webpPath };
    }

    if (!text) throw new Error("message send requires text");
    const requested = requestedChannel(channel);
    const channels = requested ? [requested] : channelOrder().filter((ch) => channelConfigured(ch));
    if (channels.length === 0) throw new Error("message send: no channel configured");
    let lastError = "no_channel";
    for (const ch of channels) {
      const result = await sendViaChannel(ch, text);
      if (result.ok) return { ok: true, channel: ch };
      lastError = result.error ?? lastError;
    }
    return { ok: false, channels, error: lastError };
  };
}
