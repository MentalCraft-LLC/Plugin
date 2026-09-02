import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { convertVideoToWebp, extractFramesForDisassembly, findFfmpeg } from "./record-interaction-webp.ts";

describe("Plugin/scripts/record-interaction-webp - 60fps WebP Interaction Engine", () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const dir of cleanups) {
      rmSync(dir, { recursive: true, force: true });
    }
    cleanups.length = 0;
  });

  function makeTmpDir(): string {
    const dir = join(tmpdir(), `webp-rec-test-${process.pid}-${Date.now() % 100000}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    cleanups.push(dir);
    return dir;
  }

  test("findFfmpeg locates system ffmpeg binary", () => {
    const ffmpeg = findFfmpeg();
    expect(existsSync(ffmpeg)).toBe(true);
    expect(ffmpeg).toContain("ffmpeg");
  });

  test("converts video to 60fps animated WebP and extracts frames for disassembly", () => {
    const dir = makeTmpDir();
    const testVideo = join(dir, "test.mp4");
    const testWebp = join(dir, "test.webp");
    const framesDir = join(dir, "frames");

    const ffmpeg = findFfmpeg();
    // Generate a 0.5s dummy test video with ffmpeg testsrc
    const genRes = spawnSync(ffmpeg, [
      "-y",
      "-f", "lavfi",
      "-i", "testsrc=duration=0.5:size=320x240:rate=30",
      "-vcodec", "libx264",
      "-pix_fmt", "yuv420p",
      testVideo,
    ], { encoding: "utf8" });
    expect(genRes.status).toBe(0);
    expect(existsSync(testVideo)).toBe(true);

    // 1. Convert to Animated WebP
    const res = convertVideoToWebp(testVideo, testWebp, { fps: 30, quality: 80 });
    expect(res.webpPath).toBe(testWebp);
    expect(existsSync(testWebp)).toBe(true);
    expect(res.bytes).toBeGreaterThan(100);

    // 2. Extract frames for pixel disassembly
    const ext = extractFramesForDisassembly(testWebp, framesDir, 10);
    expect(ext.frameCount).toBeGreaterThanOrEqual(1);
    expect(ext.frames.length).toBe(ext.frameCount);
    expect(existsSync(ext.frames[0])).toBe(true);
    expect(ext.frames[0].endsWith(".webp")).toBe(true);
  });
});
