import { afterEach, describe, expect, test } from "bun:test";
import { channelOrder, channelConfigured } from "./operation.ts";
import { telegramSend, telegramPoll, TELEGRAM_API, readTelegramConfig, writeTelegramConfig, telegramConfigPath } from "./channels/telegram.ts";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string | null = null;

function isolatedTelegramConfig(): void {
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  if (!tempDir) {
    tempDir = mkdtempSync(join(tmpdir(), "message-test-"));
    process.env.TELEGRAM_CONFIG_PATH = join(tempDir, "telegram.json");
  }
}

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
    delete process.env.TELEGRAM_CONFIG_PATH;
  }
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
});

describe("message unified tool", () => {
  test("channel priority is telegram > imessage > email", () => {
    expect(channelOrder()).toEqual(["telegram", "imessage", "email"]);
  });

  test("no channel configured fails closed", () => {
    isolatedTelegramConfig();
    expect(readTelegramConfig()).toBe(null);
  });

  test("resolves telegram config from environment variables", () => {
    isolatedTelegramConfig();
    process.env.TELEGRAM_BOT_TOKEN = "1234567890:ABCDEF_TEST_ENV_TOKEN_GHIJKL";
    process.env.TELEGRAM_CHAT_ID = "99887766";
    const cfg = readTelegramConfig();
    expect(cfg).not.toBe(null);
    expect(cfg?.token).toBe("1234567890:ABCDEF_TEST_ENV_TOKEN_GHIJKL");
    expect(cfg?.chatId).toBe(99887766);
  });

  test("telegramPoll returns bounded replies and messages", async () => {
    isolatedTelegramConfig();
    writeTelegramConfig({ token: "1234567890:TESTTOKENABCDEFGH", chatId: 42, lastUpdateId: 0 });
    const updates = [
      {
        update_id: 9,
        message: {
          message_id: 101,
          text: "1",
          chat: { id: 42 },
          from: { id: 789, username: "testuser" },
          reply_to_message: { message_id: 55, text: "Which plan is cheapest?" },
        },
      },
      { update_id: 10, message: { message_id: 102, text: "plain", chat: { id: 42 }, from: { id: 1 } } },
    ];
    const fetcher = (async (_url: string) =>
      new Response(JSON.stringify({ ok: true, result: updates }), { status: 200 })) as typeof fetch;
    const result = await telegramPoll(fetcher);
    expect(result.count).toBe(2);
    expect(result.replies).toEqual(["1", "plain"]);
    expect(result.messages.length).toBe(2);
    expect(result.messages[0].fromUsername).toBe("testuser");
    expect(result.messages[0].replyToMessageId).toBe(55);
    expect(result.reply_contexts?.length).toBe(1);
    expect(result.reply_contexts?.[0].message_id).toBe(55);
    expect(result.reply_contexts?.[0].reply_text_prefix).toBe("Which plan is cheapest?");
  });

  test("telegram rejects empty and oversized text", async () => {
    isolatedTelegramConfig();
    writeTelegramConfig({ token: "1234567890:TESTTOKENABCDEFGH", chatId: 42, lastUpdateId: 0 });
    const empty = await telegramSend("");
    expect(empty.ok).toBe(false);
    expect(empty.error).toBe("telegram_text_invalid");
    const huge = await telegramSend("x".repeat(4001));
    expect(huge.ok).toBe(false);
  });

  test("API endpoint is the official bot API", () => {
    expect(TELEGRAM_API).toBe("https://api.telegram.org");
  });
});
