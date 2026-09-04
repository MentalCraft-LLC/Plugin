/**
 * Automated Telegram Design Update Dispatcher
 * Rule 9 Compliance: Sends visual receipts (WebP) & design modification changelog to Telegram.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { telegramSend } from "../../Capability/Message/channels/telegram.ts";
import { sendTelegramScreenshot } from "./send-telegram-screenshot.ts";

export async function notifyDesignUpdate(options: {
  title: string;
  summary: string;
  screenshots?: string[];
}) {
  const { title, summary, screenshots = [] } = options;

  console.log(`Sending design update to Telegram: "${title}"...`);

  // 1. Send header & changelog text
  const text = `🎨 [Holar Design Update]

📌 ${title}

${summary}`;
  const textResult = await telegramSend(text);
  if (!textResult.ok) {
    console.warn(`Text dispatch warning: ${textResult.error}`);
  } else {
    console.log("✓ Changelog delivered to Telegram");
  }

  // 2. Dispatch screenshots (WebP converted)
  for (const imgPath of screenshots) {
    if (existsSync(imgPath)) {
      try {
        const res = await sendTelegramScreenshot(imgPath, `📸 Visual Grounding: ${title}`);
        console.log(`✓ Screenshot delivered to Telegram (Msg ID: ${res.messageId})`);
      } catch (err: any) {
        console.warn(`Screenshot dispatch failed for ${imgPath}: ${err.message}`);
      }
    }
  }

  return { ok: true };
}

if (import.meta.main) {
  const title = process.argv[2] || "Design System Modification";
  const summary = process.argv[3] || "Components updated in @mentalcraft/design-svelte";
  notifyDesignUpdate({ title, summary })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
