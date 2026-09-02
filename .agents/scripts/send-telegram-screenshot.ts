import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readTelegramConfig } from "../../Tool/Message/channels/telegram.ts";

export async function sendTelegramScreenshot(imagePath: string, caption?: string) {
  if (!existsSync(imagePath)) {
    throw new Error(`Image not found at: ${imagePath}`);
  }

  let webpPath = imagePath;
  if (!imagePath.endsWith(".webp")) {
    webpPath = imagePath.replace(/\.[a-zA-Z0-9]+$/, ".webp");
    const cwebp = "/Users/laiyongzhang/.homebrew/bin/cwebp";
    if (existsSync(cwebp)) {
      spawnSync(cwebp, ["-q", "90", imagePath, "-o", webpPath]);
    }
  }

  const config = readTelegramConfig();
  if (!config || !config.token || !config.chatId) {
    throw new Error(`Telegram not configured (checked env and ~/.config/holar/telegram.json)`);
  }
  const { token, chatId } = config;

  const fileBytes = readFileSync(webpPath);
  const blob = new Blob([fileBytes], { type: "image/webp" });

  const formData = new FormData();
  formData.append("chat_id", String(chatId));
  formData.append("photo", blob, "screenshot.webp");
  if (caption) {
    formData.append("caption", caption);
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: formData,
  });

  const json = (await res.json()) as any;
  if (!json.ok) {
    throw new Error(`Telegram API rejected: ${JSON.stringify(json)}`);
  }

  return { ok: true, messageId: json.result?.message_id, webpPath };
}

// CLI direct runner
if (import.meta.main) {
  const args = process.argv.slice(2);
  const file = args[0];
  const cap = args.slice(1).join(" ") || "📸 Visual Grounding Milestone Receipt (WebP)";
  if (!file) {
    console.error("Usage: bun Plugin/scripts/send-telegram-screenshot.ts <image_path> [caption]");
    process.exit(1);
  }
  sendTelegramScreenshot(file, cap)
    .then((res) => console.log(`✓ Delivered to Telegram chat! Message ID: ${res.messageId}`))
    .catch((err) => {
      console.error("Failed:", err.message);
      process.exit(1);
    });
}
