/**
 * Atomic 0600 secret-file write, shared by every tool that persists local
 * credentials (contact, github, gmail, wechat, google-*, ...). Values never
 * enter tool parameters, chat, logs or evidence; the file is created 0600,
 * atomically renamed into place and never overwrites an existing file.
 *
 * This module is NOT a registered extension (no index.ts in package.json);
 * tools import it directly inside the same runtime.
 */
import { randomUUID } from "node:crypto";
import { chmodSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function atomicWriteSecret(path: string, content: string): void {
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(temporary, content, { mode: 0o600, flag: "wx" });
    chmodSync(temporary, 0o600);
    renameSync(temporary, path);
    chmodSync(path, 0o600);
  } catch (error) {
    try {
      rmSync(temporary, { force: true });
    } catch {
      // best-effort cleanup; the original error is authoritative
    }
    throw error;
  }
}
