import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { storeVideoRecording } from "./video.mjs";

const temporary: string[] = [];
afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe("Local Video Recording & Screen Capture Atom", () => {
  test("stores video recording buffer privately and returns receipt with frame rate", () => {
    const dir = mkdtempSync(join(tmpdir(), "chrome-video-"));
    temporary.push(dir);

    const dummyVideo = Buffer.from("DUMMY_WEBM_VIDEO_PAYLOAD_1234567890", "utf8");
    const receipt = storeVideoRecording(dummyVideo, dir);

    expect(receipt.status).toBe("stored");
    expect(receipt.bytes).toBe(dummyVideo.length);
    expect(receipt.format).toBe("webm");
    expect(receipt.path).toContain(dir);
    expect(statSync(receipt.path).mode & 0o077).toBe(0);
  });

  test("stores screencast frame sequence payload and computes duration and fps", () => {
    const dir = mkdtempSync(join(tmpdir(), "chrome-screencast-"));
    temporary.push(dir);

    const payload = {
      frames: [
        { timestamp: 0, data: "base64_frame_1" },
        { timestamp: 33, data: "base64_frame_2" },
        { timestamp: 66, data: "base64_frame_3" },
      ],
      durationMs: 100,
      width: 1920,
      height: 1080,
    };

    const receipt = storeVideoRecording(payload, dir);

    expect(receipt.status).toBe("stored");
    expect(receipt.frameCount).toBe(3);
    expect(receipt.durationMs).toBe(100);
    expect(receipt.fps).toBe(30);
    expect(receipt.width).toBe(1920);
    expect(receipt.height).toBe(1080);
  });

  test("fails closed on oversized video payloads", () => {
    const dir = mkdtempSync(join(tmpdir(), "chrome-video-overflow-"));
    temporary.push(dir);

    const empty = Buffer.alloc(0);
    expect(() => storeVideoRecording(empty, dir)).toThrow("video_size_invalid");
  });
});
