import { afterEach, describe, expect, test } from "bun:test";
import { channelOrder, channelConfigured } from "./operation.ts";
import { telegramSend, telegramPoll, TELEGRAM_API, readTelegramConfig, writeTelegramConfig, resolveSessionBot } from "./channels/telegram.ts";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string | null = null;
const SESSION_ENV_KEYS = [
  "HOLAR_SESSION_ID",
  "HOLAR_SESSION_NAME",
  "GROK_SESSION_ID",
  "PI_SESSION_ID",
  "PI_SESSION_NAME",
] as const;
const priorSessionEnv = Object.fromEntries(SESSION_ENV_KEYS.map((key) => [key, process.env[key]]));

function replaceSessionEnv(values: Partial<Record<(typeof SESSION_ENV_KEYS)[number], string>> = {}): void {
  for (const key of SESSION_ENV_KEYS) {
    const next = values[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
}

function isolatedTelegramConfig(): void {
  process.env.HOLAR_TEST = "1";
  if (!tempDir) {
    tempDir = mkdtempSync(join(tmpdir(), "message-test-"));
    process.env.TELEGRAM_CONFIG_PATH = join(tempDir, "telegram.json");
  }
  replaceSessionEnv();
}

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
    delete process.env.TELEGRAM_CONFIG_PATH;
    delete process.env.HOLAR_TEST;
  }
  for (const key of SESSION_ENV_KEYS) {
    const value = priorSessionEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("message unified tool", () => {
  test("channel priority is telegram > imessage > email", () => {
    expect(channelOrder()).toEqual(["telegram", "imessage", "email"]);
  });

  test("no channel configured fails closed", () => {
    // Isolate from any ambient telegram config on the machine (a real
    // ~/.pi/agent/telegram/config.json may exist), then assert the adapter
    // fails closed with no channel.
    isolatedTelegramConfig();
    expect(telegramConfiguredSafe()).toBe(false);
  });

  test("telegram send posts to the bot API with the configured token and chat id", async () => {
    isolatedTelegramConfig();
    writeTelegramConfig({ token: "1234567890:TESTTOKENABCDEFGH", chatId: 42, lastUpdateId: 0 });
    let captured: { url: string; body: string } | null = null;
    const fetcher = (async (url: string, init: RequestInit) => {
      captured = { url, body: String(init.body ?? "") };
      return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 });
    }) as typeof fetch;
    const result = await telegramSend("hello from tests", fetcher);
    expect(result.ok).toBe(true);
    expect(captured?.url).toBe("https://api.telegram.org/bot1234567890:TESTTOKENABCDEFGH/sendMessage");
    expect(JSON.parse(captured?.body ?? "{}")).toEqual({ chat_id: 42, text: "hello from tests" });
  });

  test("telegram poll advances the update cursor and counts replies", async () => {
    isolatedTelegramConfig();
    writeTelegramConfig({ token: "1234567890:TESTTOKENABCDEFGH", chatId: 42, lastUpdateId: 0 });
    const updates = [
      { update_id: 7, message: { text: "1", from: { id: 1 } } },
      { update_id: 8, message: { text: "yes", from: { id: 1 } } },
    ];
    const fetcher = (async (_url: string) =>
      new Response(JSON.stringify({ ok: true, result: updates }), { status: 200 })) as typeof fetch;
    const result = await telegramPoll(fetcher);
    expect(result.ok).toBe(true);
    expect(result.count).toBe(2);
    expect(readTelegramConfig()?.lastUpdateId).toBe(8);
  });

  test("telegram poll captures reply_to_message context", async () => {
    isolatedTelegramConfig();
    writeTelegramConfig({ token: "1234567890:TESTTOKENABCDEFGH", chatId: 42, lastUpdateId: 0 });
    const updates = [
      {
        update_id: 9,
        message: {
          text: "1",
          from: { id: 1 },
          reply_to_message: { message_id: 55, text: "Which plan is cheapest?" },
        },
      },
      { update_id: 10, message: { text: "plain", from: { id: 1 } } },
    ];
    const fetcher = (async (_url: string) =>
      new Response(JSON.stringify({ ok: true, result: updates }), { status: 200 })) as typeof fetch;
    const result = await telegramPoll(fetcher);
    expect(result.reply_contexts?.length).toBe(1);
    expect(result.reply_contexts?.[0].message_id).toBe(55);
    expect(result.reply_contexts?.[0].reply_text_prefix).toBe("Which plan is cheapest?");
    // plain messages carry no reply context
    expect(result.replies?.[1]).toBe("plain");
  });

  test("telegram rejects empty and oversized text", async () => {
    isolatedTelegramConfig();
    writeTelegramConfig({ token: "1234567890:TESTTOKENABCDEFGH", chatId: 42, lastUpdateId: 0 });
    const empty = await telegramSend("");
    expect(empty.ok).toBe(false);
    expect(empty.error).toBe("telegram_text_invalid");
    const huge = await telegramSend("x".repeat(2001));
    expect(huge.ok).toBe(false);
  });

  test("API endpoint is the official bot API", () => {
    expect(TELEGRAM_API).toBe("https://api.telegram.org");
  });
});

function telegramConfiguredSafe(): boolean {
  return readTelegramConfig() !== null;
}

describe("session bot identity", () => {
  test("matches the shared tail word after a session rename (business-infra-interface -> business-interface)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "bots-test-"));
    try {
      const botsPath = join(dir, "bots.json");
      writeFileSync(
        botsPath,
        JSON.stringify([
          { bot_id: "business", token: "t1", assigned_session: "holar" },
          { bot_id: "interface", token: "t2", assigned_session: "business-infra-interface" },
        ]),
      );
      replaceSessionEnv({ PI_SESSION_ID: "019fe9a8" });
      const bot = await resolveSessionBot(botsPath);
      expect(bot?.token).toBe("t2");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
