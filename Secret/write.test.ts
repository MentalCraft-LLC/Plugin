import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { atomicWriteSecret } from "./write.ts";

describe("atomic 0600 secret write", () => {
  test("writes a 0600 file atomically", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomic-secret-"));
    const path = join(dir, "sub", "config.json");
    atomicWriteSecret(path, '{"secret":"value"}\n');
    const stat = statSync(path);
    expect(stat.mode & 0o777).toBe(0o600);
    expect(readFileSync(path, "utf8")).toBe('{"secret":"value"}\n');
    // no temp leftovers
    expect([...require("node:fs").readdirSync(join(dir, "sub"))].filter((n) => n.includes(".tmp-"))).toHaveLength(0);
  });

  test("overwrites an existing file atomically", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomic-secret-"));
    const path = join(dir, "config.json");
    writeFileSync(path, "old", { mode: 0o600 });
    atomicWriteSecret(path, "new");
    expect(readFileSync(path, "utf8")).toBe("new");
  });

  test("cleans up the temp file when the write fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomic-secret-"));
    // a directory at the target path makes rename fail after the temp write
    const path = join(dir, "config.json");
    require("node:fs").mkdirSync(path);
    expect(() => atomicWriteSecret(path, "payload")).toThrow();
    // the temp file must be cleaned up
    const leftovers = require("node:fs").readdirSync(dir).filter((n) => n.includes(".tmp-"));
    expect(leftovers).toHaveLength(0);
  });
});
