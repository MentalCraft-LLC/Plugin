import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { emitEvent } from "../../.extension/event/pi.ts";
import { readTelegramConfig, writeTelegramConfig } from "./channels/telegram.ts";
import { writeSocialConfig } from "./channels/imessage.ts";
import { writeConfig as writeSmtpConfig, type GmailConfig } from "./channels/email.ts";
import {
  channelConfigured,
  channelOrder,
  createMessageOperation,
  requestedChannel,
  type ChannelId,
} from "./operation.ts";

export { channelConfigured, channelOrder, requestedChannel };
export type { ChannelId };

const executeMessage = createMessageOperation();

export default function messageExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "message",
    label: "Message",
    description:
      "Unified Owner messaging: send a bounded message over the best configured channel (telegram > imessage > email), poll all inbound channels for replies (emitted as events), inspect channel status, or bootstrap a channel through a local dialog. Channel credentials live only in local 0600 configs.",
    promptSnippet: "Send, poll, bootstrap or inspect Owner messaging channels",
    promptGuidelines: [
      "Message text must be bounded and never contain secrets.",
      "Channel credentials never enter parameters, chat, source, logs or evidence; bootstrap goes through local dialogs only.",
    ],
    parameters: Type.Object(
      {
        action: Type.Enum({ send: "send", poll: "poll", status: "status", bootstrap: "bootstrap" }),
        text: Type.Optional(Type.String({ minLength: 1, maxLength: 2000, pattern: "^[^\\u0000]*$" })),
        channel: Type.Optional(Type.Enum({ telegram: "telegram", imessage: "imessage", email: "email" })),
        chatId: Type.Optional(Type.Union([Type.Number(), Type.String({ minLength: 1, maxLength: 80 })])),
      },
      { additionalProperties: false },
    ),
    executionMode: "sequential",
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!ctx.isProjectTrusted()) throw new Error("message operation requires a trusted project");

      if (params.action === "bootstrap") {
        const channel = params.channel ?? "telegram";
        if (channel === "telegram") {
          const value = await ctx.ui.editor(
            'Paste the Telegram bot token from @BotFather (value stays local, 0600):\n{"token":"123456:ABC-..."} — or the bare token itself.',
          );
          const trimmed = (value || "").trim();
          let token = trimmed;
          try {
            const parsed = JSON.parse(trimmed) as { token?: string };
            if (typeof parsed?.token === "string") token = parsed.token;
          } catch {
            /* bare token */
          }
          if (typeof token !== "string" || token.length < 20) {
            throw new Error("message bootstrap: telegram token is invalid");
          }
          const existing = readTelegramConfig();
          const chatId = params.chatId ?? existing?.chatId;
          writeTelegramConfig({ token, chatId, lastUpdateId: existing?.lastUpdateId ?? 0 });
          return {
            content: [{ type: "text" as const, text: "Telegram bot token configured (0600). Send /start to the bot, then run message poll to discover the chat id." }],
            details: { ok: true, channel: "telegram" },
          };
        }
        if (channel === "email") {
          const value = await ctx.ui.editor(
            "Paste SMTP credentials as JSON (host/port/secure/user/pass; value stays local). QQ: {\"host\":\"smtp.qq.com\",\"port\":465,\"secure\":true,\"user\":\"QQ号@qq.com\",\"pass\":\"<SMTP授权码>\"}",
          );
          const parsed = JSON.parse(value || "{}") as Partial<GmailConfig>;
          if (typeof parsed.host !== "string" || !parsed.host.trim() || typeof parsed.user !== "string" || !parsed.user.trim() || typeof parsed.pass !== "string" || !parsed.pass) {
            throw new Error("message bootstrap: credentials must include host, user and pass");
          }
          writeSmtpConfig({ host: parsed.host.trim(), port: parsed.port ?? 465, secure: parsed.secure ?? true, user: parsed.user.trim(), pass: parsed.pass });
          return {
            content: [{ type: "text" as const, text: "SMTP credentials configured locally (host/port only)." }],
            details: { ok: true, channel: "email", host: parsed.host.trim(), port: parsed.port ?? 465 },
          };
        }
        if (channel === "imessage") {
          const value = await ctx.ui.editor(
            'Paste the Owner iMessage recipient (phone or email; value stays local, 0600):\n{"recipient":"+861234567890"}',
          );
          const trimmed = (value || "").trim();
          let recipient = trimmed;
          try {
            const parsed = JSON.parse(trimmed) as { recipient?: string };
            if (typeof parsed?.recipient === "string") recipient = parsed.recipient;
          } catch {
            /* bare form */
          }
          if (!recipient || recipient.length < 7) throw new Error("message bootstrap: imessage recipient is invalid");
          writeSocialConfig(recipient.trim());
          return {
            content: [{ type: "text" as const, text: "iMessage Owner recipient configured (0600)." }],
            details: { ok: true, channel: "imessage" },
          };
        }
        throw new Error("message bootstrap: unsupported channel");
      }

      const result = await executeMessage({
        action: params.action,
        text: params.text,
        channel: requestedChannel(params.channel),
        chatId: params.chatId,
      });

      if (params.action === "status" && "channels" in result) {
        const channels = result.channels as Array<{ channel: ChannelId; configured: boolean }>;
        const text = channels.map((channel) => `${channel.channel}:${channel.configured ? "configured" : "not configured"}`).join("; ");
        return { content: [{ type: "text" as const, text: `Message channels — ${text}.` }], details: result };
      }

      if (params.action === "poll" && "results" in result) {
        const results = result.results as Array<{ channel: ChannelId; count: number; replies?: string[] }>;
        for (const row of results) {
          if (row.channel === "telegram") {
            for (const reply of row.replies ?? []) {
              emitEvent("telegram", "reply", { time: Date.now(), len: reply.length });
            }
          }
          if (row.channel === "imessage" && row.count > 0) {
            emitEvent("imessage", "reply", { name: "owner", time: Date.now() });
          }
        }
        const total = results.reduce((sum, row) => sum + row.count, 0);
        const replyTexts = (result.replies as string[] | undefined) ?? [];
        const text = `Message poll — ${results.map((row) => `${row.channel}:${row.count}`).join(", ")}${total > 0 ? ` (${total} new reply/replies).` : "."}${replyTexts.length > 0 ? ` Replies: ${replyTexts.map((item) => JSON.stringify(item)).join(" | ")}` : ""}`;
        return { content: [{ type: "text" as const, text }], details: result };
      }

      if (params.action === "send" && result.ok && "channel" in result) {
        return {
          content: [{ type: "text" as const, text: `Message sent via ${result.channel}.` }],
          details: result,
        };
      }

      const lastError = "error" in result ? String(result.error) : "no_channel";
      const channels = "channels" in result ? (result.channels as ChannelId[]) : channelOrder().filter((channel) => channelConfigured(channel));
      return {
        content: [{ type: "text" as const, text: `Message could not be sent (${channels.join(", ")}): ${lastError}.` }],
        details: result,
      };
    },
  });
}
