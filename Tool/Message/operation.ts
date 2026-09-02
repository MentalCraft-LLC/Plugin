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
  return async (params: MessageInput) => {
    if (params.action === "status") {
      const channels = channelOrder().map((channel) => ({
        channel,
        configured: channelConfigured(channel),
      }));
      return { ok: true, channels };
    }

    if (params.action === "bootstrap") {
      return {
        ok: false,
        error: "bootstrap_local_only",
        channel: params.channel ?? "telegram",
      };
    }

    if (params.action === "poll") {
      const requested = requestedChannel(params.channel);
      const channels = requested ? [requested] : channelOrder().filter((channel) => channelConfigured(channel));
      const results: MessagePollResult[] = [];
      for (const channel of channels) {
        const result = await pollViaChannel(channel);
        results.push({ channel, ...result });
      }
      const replies = results.flatMap((result) => result.replies ?? []);
      const reply_contexts = results.flatMap((result) => result.reply_contexts ?? []);
      return { ok: true, results, replies, reply_contexts };
    }

    if (params.action === "send_photo") {
      const photoPath = params.photoPath || params.text;
      if (!photoPath) throw new Error("message send_photo requires photoPath");
      const { sendTelegramScreenshot } = await import("../../.agents/scripts/send-telegram-screenshot.ts");
      const res = await sendTelegramScreenshot(photoPath, params.caption || undefined);
      return { ok: true, channel: "telegram", messageId: res.messageId, webpPath: res.webpPath };
    }

    if (!params.text) throw new Error("message send requires text");
    const requested = requestedChannel(params.channel);
    const channels = requested ? [requested] : channelOrder().filter((channel) => channelConfigured(channel));
    if (channels.length === 0) throw new Error("message send: no channel configured");
    let lastError = "no_channel";
    for (const channel of channels) {
      const result = await sendViaChannel(channel, params.text);
      if (result.ok) return { ok: true, channel };
      lastError = result.error ?? lastError;
    }
    return { ok: false, channels, error: lastError };
  };
}
