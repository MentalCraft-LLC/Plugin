/**
 * Plugin/scripts/record-interaction-webp.ts
 *
 * High-performance 60fps Animated WebP interaction recorder, converter,
 * pixel-level frame extractor, and Telegram milestone delivery bridge.
 *
 * Implements Rule 9 & Disassembly Law:
 * - Converts video/mov to high-compression 60fps animated .webp (ffmpeg + img2webp)
 * - Extracts frames for component pixel-level disassembly (webpmux / ffmpeg + cwebp)
 * - Directly pushes milestone WebP to Telegram via sendTelegramScreenshot
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { sendTelegramScreenshot } from "./send-telegram-screenshot.ts";

export type ConvertOptions = {
  fps?: number;
  quality?: number;
  lossless?: boolean;
  loop?: number;
  width?: number;
  telegramCaption?: string;
};

/**
 * Universal cross-runtime subprocess executor with deterministic stdout/stderr capture
 */
function runProcess(
  cmd: string,
  args: string[],
  options: { cwd?: string; input?: Buffer } = {}
): { status: number; stdout: string; stderr: string } {
  if (typeof Bun !== "undefined") {
    const proc = Bun.spawnSync([cmd, ...args], {
      cwd: options.cwd,
      stdin: options.input,
      stdout: "pipe",
      stderr: "pipe",
    });
    return {
      status: proc.exitCode,
      stdout: proc.stdout.toString(),
      stderr: proc.stderr.toString(),
    };
  }
  const res = spawnSync(cmd, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: "utf8",
  });
  return {
    status: res.status ?? 1,
    stdout: String(res.stdout || ""),
    stderr: String(res.stderr || ""),
  };
}

export function findFfmpeg(): string {
  const candidates = [
    "/Users/laiyongzhang/.homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  const whichRes = runProcess("which", ["ffmpeg"]);
  if (whichRes.status === 0 && whichRes.stdout.trim()) {
    return whichRes.stdout.trim();
  }
  throw new Error("ffmpeg binary not found in system paths");
}

export function findImg2webp(): string {
  const candidates = [
    "/Users/laiyongzhang/.homebrew/bin/img2webp",
    "/usr/local/bin/img2webp",
    "/opt/homebrew/bin/img2webp",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  const whichRes = runProcess("which", ["img2webp"]);
  if (whichRes.status === 0 && whichRes.stdout.trim()) {
    return whichRes.stdout.trim();
  }
  throw new Error("img2webp binary not found in system paths");
}

export function findCwebp(): string {
  const candidates = [
    "/Users/laiyongzhang/.homebrew/bin/cwebp",
    "/usr/local/bin/cwebp",
    "/opt/homebrew/bin/cwebp",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  const whichRes = runProcess("which", ["cwebp"]);
  if (whichRes.status === 0 && whichRes.stdout.trim()) {
    return whichRes.stdout.trim();
  }
  throw new Error("cwebp binary not found in system paths");
}

export function findWebpmux(): string {
  const candidates = [
    "/Users/laiyongzhang/.homebrew/bin/webpmux",
    "/usr/local/bin/webpmux",
    "/opt/homebrew/bin/webpmux",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  const whichRes = runProcess("which", ["webpmux"]);
  if (whichRes.status === 0 && whichRes.stdout.trim()) {
    return whichRes.stdout.trim();
  }
  throw new Error("webpmux binary not found in system paths");
}

/**
 * Converts a video file (.mov, .mp4, .webm) to an animated .webp at up to 60fps
 * Uses ffmpeg for frame sampling + img2webp for high-efficiency animated WebP compression.
 */
export function convertVideoToWebp(
  inputVideo: string,
  outputWebp?: string,
  options: ConvertOptions = {}
): { webpPath: string; bytes: number; frameCount: number } {
  const absInput = resolve(inputVideo);
  if (!existsSync(absInput)) {
    throw new Error(`Input video not found: ${absInput}`);
  }

  const ffmpeg = findFfmpeg();
  const img2webp = findImg2webp();

  const targetWebp = outputWebp
    ? resolve(outputWebp)
    : absInput.replace(/\.[a-zA-Z0-9]+$/, ".webp");

  mkdirSync(dirname(targetWebp), { recursive: true, mode: 0o700 });

  const fps = Math.min(60, Math.max(1, options.fps ?? 60));
  const quality = Math.min(100, Math.max(1, options.quality ?? 85));
  const durationPerFrameMs = Math.round(1000 / fps);

  // Temporary staging directory for uncompressed PNG frames
  const stageDir = join(tmpdir(), `webp-stage-${process.pid}-${Date.now() % 100000}`);
  mkdirSync(stageDir, { recursive: true, mode: 0o700 });

  try {
    let vf = `fps=${fps}`;
    if (options.width) {
      vf += `,scale=${options.width}:-1:flags=lanczos`;
    }

    const framePattern = join(stageDir, "f-%05d.png");
    const ffmpegRes = runProcess(ffmpeg, [
      "-y",
      "-i", absInput,
      "-vf", vf,
      framePattern,
    ]);

    if (ffmpegRes.status !== 0) {
      throw new Error(`ffmpeg frame extraction failed: ${ffmpegRes.stderr || ffmpegRes.stdout}`);
    }

    const frameFiles = readdirSync(stageDir)
      .filter((f) => f.startsWith("f-") && f.endsWith(".png"))
      .sort()
      .map((f) => join(stageDir, f));

    if (frameFiles.length === 0) {
      throw new Error(`No frames extracted from: ${absInput}`);
    }

    // Assemble frames into animated WebP via img2webp
    const imgArgs = [
      options.lossless ? "-lossless" : "-lossy",
      "-q", String(quality),
      "-d", String(durationPerFrameMs),
      ...frameFiles,
      "-o", targetWebp,
    ];

    const imgRes = runProcess(img2webp, imgArgs);
    if (imgRes.status !== 0 || !existsSync(targetWebp)) {
      throw new Error(`img2webp animated assembly failed: ${imgRes.stderr || imgRes.stdout}`);
    }

    const stat = statSync(targetWebp);
    return {
      webpPath: targetWebp,
      bytes: stat.size,
      frameCount: frameFiles.length,
    };
  } finally {
    rmSync(stageDir, { recursive: true, force: true });
  }
}

/**
 * Reads frame count directly from WebP RIFF ANMF chunks with zero-overhead binary parsing
 */
export function getWebpFrameCount(buffer: Buffer): number {
  if (buffer.length < 16) return 0;
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return 0;
  }
  let count = 0;
  let offset = 12;
  while (offset < buffer.length - 8) {
    const chunkHeader = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkHeader === "ANMF") {
      count++;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return count > 0 ? count : 1;
}

/**
 * Extracts frames from an animated WebP or video for pixel-level disassembly
 */
export function extractFramesForDisassembly(
  inputMedia: string,
  outputDirectory: string,
  fps = 10
): { outputDirectory: string; frameCount: number; frames: string[] } {
  const absInput = resolve(inputMedia);
  if (!existsSync(absInput)) {
    throw new Error(`Input media not found: ${absInput}`);
  }

  const absOut = resolve(outputDirectory);
  mkdirSync(absOut, { recursive: true, mode: 0o700 });

  // 1. If input is a WebP file, extract frames losslessly using webpmux
  if (absInput.endsWith(".webp")) {
    try {
      const buf = readFileSync(absInput);
      const totalFrames = getWebpFrameCount(buf);
      const webpmux = findWebpmux();

      const webpFrames: string[] = [];
      for (let i = 1; i <= totalFrames; i++) {
        const outName = `frame-${String(i).padStart(4, "0")}.webp`;
        const outPath = join(absOut, outName);
        if (totalFrames === 1) {
          copyFileSync(absInput, outPath);
        } else {
          runProcess(webpmux, ["-get", "frame", String(i), absInput, "-o", outPath]);
        }
        if (existsSync(outPath)) {
          webpFrames.push(outPath);
        }
      }
      if (webpFrames.length > 0) {
        return { outputDirectory: absOut, frameCount: webpFrames.length, frames: webpFrames };
      }
    } catch {
      // Fallback to ffmpeg below
    }
  }

  // 2. Video input (.mov, .mp4, etc.): extract via ffmpeg then cwebp
  const ffmpeg = findFfmpeg();
  const cwebp = findCwebp();

  const stageDir = join(tmpdir(), `disassemble-stage-${process.pid}-${Date.now() % 100000}`);
  mkdirSync(stageDir, { recursive: true, mode: 0o700 });

  try {
    const pngPattern = join(stageDir, "f-%04d.png");
    const ffmpegRes = runProcess(ffmpeg, [
      "-y",
      "-i", absInput,
      "-vf", `fps=${fps}`,
      pngPattern,
    ]);

    if (ffmpegRes.status !== 0) {
      throw new Error(`Failed to sample frames: ${ffmpegRes.stderr || ffmpegRes.stdout}`);
    }

    const pngFiles = readdirSync(stageDir)
      .filter((f) => f.startsWith("f-") && f.endsWith(".png"))
      .sort();

    const webpFrames: string[] = [];
    for (const [idx, png] of pngFiles.entries()) {
      const pngPath = join(stageDir, png);
      const outName = `frame-${String(idx + 1).padStart(4, "0")}.webp`;
      const outWebp = join(absOut, outName);
      runProcess(cwebp, ["-q", "95", pngPath, "-o", outWebp]);
      if (existsSync(outWebp)) {
        webpFrames.push(outWebp);
      }
    }

    return {
      outputDirectory: absOut,
      frameCount: webpFrames.length,
      frames: webpFrames,
    };
  } finally {
    rmSync(stageDir, { recursive: true, force: true });
  }
}

// CLI runner
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "convert") {
    const input = args[1];
    const output = args[2] && !args[2].startsWith("--") ? args[2] : undefined;
    if (!input) {
      console.error("Usage: bun record-interaction-webp.ts convert <input_video> [output_webp] [--fps 60] [--telegram]");
      process.exit(1);
    }
    const hasTg = args.includes("--telegram");
    const res = convertVideoToWebp(input, output);
    console.log(`✓ Converted to 60fps Animated WebP: ${res.webpPath} (${(res.bytes / 1024).toFixed(1)} KB, ${res.frameCount} frames)`);

    if (hasTg) {
      sendTelegramScreenshot(res.webpPath, `🎞️ 60fps Interaction Recording: ${basename(res.webpPath)}`)
        .then((tg) => console.log(`✓ Delivered to Telegram! (Message ID: ${tg.messageId})`))
        .catch((e) => console.error(`Telegram delivery notice: ${e.message}`));
    }
  } else if (command === "extract" || command === "disassemble") {
    const input = args[1];
    const outDir = args[2] || resolve(dirname(input || "."), "frames");
    if (!input) {
      console.error("Usage: bun record-interaction-webp.ts disassemble <input_video_or_webp> [output_dir] [--fps 10]");
      process.exit(1);
    }
    const res = extractFramesForDisassembly(input, outDir);
    console.log(`✓ Extracted ${res.frameCount} frames for pixel-level disassembly to: ${res.outputDirectory}`);
  } else {
    console.log("MentalCraft Animated WebP Interaction Teardown Tool");
    console.log("Commands:");
    console.log("  convert <input_video> [output_webp] [--fps 60] [--telegram]");
    console.log("  disassemble <input_video_or_webp> [output_dir] [--fps 10]");
  }
}
