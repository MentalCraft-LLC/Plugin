import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const SCREENSHOT_DIR = resolve(homedir(), ".config/holar/browser/screenshots");
const MAX_BYTES = 900_000;
const MAX_AGE_MS = 60 * 60 * 1000;
const MAX_FILES = 20;
const DATA_URL = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/;

function ensurePrivateDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  const mode = statSync(directory).mode & 0o077;
  if (mode !== 0) throw new Error("screenshot_directory_not_private");
}

function pruneScreenshots(directory) {
  const now = Date.now();
  const files = readdirSync(directory)
    .filter((name) => /^(?:\d+)-[a-f0-9]{16}\.(?:jpg|png)$/.test(name))
    .map((name) => {
      const path = resolve(directory, name);
      return { path, mtime: statSync(path).mtimeMs };
    });
  for (const file of files) if (now - file.mtime > MAX_AGE_MS) rmSync(file.path, { force: true });
  const remaining = files.filter((file) => now - file.mtime <= MAX_AGE_MS).sort((left, right) => right.mtime - left.mtime);
  for (const file of remaining.slice(MAX_FILES)) rmSync(file.path, { force: true });
}

export function storeScreenshot(dataUrl, directory = SCREENSHOT_DIR) {
  const match = String(dataUrl ?? "").match(DATA_URL);
  if (!match) throw new Error("screenshot_format_invalid");
  const format = match[1] === "png" ? "png" : "jpg";
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new Error("screenshot_size_invalid");
  ensurePrivateDirectory(directory);
  pruneScreenshots(directory);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const path = resolve(directory, `${Date.now()}-${sha256.slice(0, 16)}.${format}`);
  writeFileSync(path, bytes, { mode: 0o600, flag: "wx" });
  chmodSync(path, 0o600);
  return {
    status: "stored",
    format,
    bytes: bytes.length,
    sha256,
    path,
    raw_value_returned: false,
    retention_seconds: MAX_AGE_MS / 1000,
  };
}
