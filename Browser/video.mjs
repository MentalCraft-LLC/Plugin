import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const VIDEO_DIR = resolve(homedir(), ".config/holar/browser/videos");
const MAX_BYTES = 50_000_000; // 50MB
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FILES = 30;

function ensurePrivateDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  const mode = statSync(directory).mode & 0o077;
  if (mode !== 0) throw new Error("video_directory_not_private");
}

function pruneVideos(directory) {
  const now = Date.now();
  try {
    const files = readdirSync(directory)
      .filter((name) => /^(?:\d+)-[a-f0-9]{16}\.(?:webm|mp4|json)$/.test(name))
      .map((name) => {
        const path = resolve(directory, name);
        return { path, mtime: statSync(path).mtimeMs };
      });
    for (const file of files) if (now - file.mtime > MAX_AGE_MS) rmSync(file.path, { force: true });
    const remaining = files
      .filter((file) => now - file.mtime <= MAX_AGE_MS)
      .sort((left, right) => right.mtime - left.mtime);
    for (const file of remaining.slice(MAX_FILES)) rmSync(file.path, { force: true });
  } catch {}
}

export function storeVideoRecording(payload, directory = VIDEO_DIR) {
  ensurePrivateDirectory(directory);
  pruneVideos(directory);

  let bytes;
  let format = "webm";
  let frameCount = 0;
  let durationMs = 0;
  let fps = 30;
  let width = 1280;
  let height = 720;

  if (typeof payload === "string" && payload.startsWith("data:video/")) {
    const comma = payload.indexOf(",");
    if (comma < 0) throw new Error("video_format_invalid");
    format = payload.includes("mp4") ? "mp4" : "webm";
    bytes = Buffer.from(payload.slice(comma + 1), "base64");
  } else if (Buffer.isBuffer(payload)) {
    bytes = payload;
  } else if (payload && typeof payload === "object" && Array.isArray(payload.frames)) {
    format = "json";
    frameCount = payload.frames.length;
    durationMs = payload.durationMs || 0;
    fps = payload.fps || (durationMs > 0 && frameCount > 0 ? Math.round((frameCount / durationMs) * 1000) : 30);
    width = payload.width || 1280;
    height = payload.height || 720;
    const json = JSON.stringify(payload);
    bytes = Buffer.from(json, "utf8");
  } else {
    throw new Error("unsupported_video_payload");
  }

  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error("video_size_invalid");
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const filename = `${Date.now()}-${sha256.slice(0, 16)}.${format}`;
  const path = resolve(directory, filename);

  writeFileSync(path, bytes, { mode: 0o600, flag: "wx" });
  chmodSync(path, 0o600);

  return {
    status: "stored",
    format,
    bytes: bytes.length,
    sha256,
    path,
    frameCount: frameCount || undefined,
    durationMs: durationMs || undefined,
    fps: fps || undefined,
    width,
    height,
    raw_value_returned: false,
    retention_seconds: MAX_AGE_MS / 1000,
  };
}
