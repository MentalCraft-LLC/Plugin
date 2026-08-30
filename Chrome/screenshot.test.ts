import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { storeScreenshot } from "./screenshot.mjs";

const temporary: string[] = [];

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe("Local screenshot atom", () => {
  test("stores bounded image bytes privately and returns only a receipt", () => {
    const directory = mkdtempSync(join(tmpdir(), "spiral-screenshot-"));
    temporary.push(directory);
    const bytes = Buffer.from("fixture-image");
    const result = storeScreenshot(`data:image/jpeg;base64,${bytes.toString("base64")}`, directory) as Record<string, unknown>;
    const path = String(result.path);
    expect(result.status).toBe("stored");
    expect(result.raw_value_returned).toBe(false);
    expect(result.bytes).toBe(bytes.length);
    expect(result.retention_seconds).toBe(3600);
    expect(result).not.toHaveProperty("data_url");
    expect(readFileSync(path)).toEqual(bytes);
    expect(statSync(path).mode & 0o077).toBe(0);
    expect(statSync(directory).mode & 0o077).toBe(0);
  });

  test("fails closed on non-image or oversized payloads", () => {
    const directory = mkdtempSync(join(tmpdir(), "spiral-screenshot-"));
    temporary.push(directory);
    expect(() => storeScreenshot("data:text/plain;base64,ZmFpbA==", directory)).toThrow("screenshot_format_invalid");
    const oversized = Buffer.alloc(900_001).toString("base64");
    expect(() => storeScreenshot(`data:image/jpeg;base64,${oversized}`, directory)).toThrow("screenshot_size_invalid");
  });
});
