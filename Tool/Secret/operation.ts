/**
 * Plugin/Secret - Mode-0600 Local Credential Vault & POSIX Secret Engine
 *
 * Provides atomic, mode-0600 credential storage, safe reads, secret rotation,
 * permission auditing, token pattern validation, and secure masking.
 *
 * 100% harness-free, POSIX compliant, Zero Ghost State.
 */

import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { atomicWriteSecret } from "./write.ts";

export type SecretAction = "write" | "read" | "mask" | "rotate" | "audit" | "validate" | "list_actions";

export type SecretTokenType =
  | "stripe"
  | "telegram"
  | "github"
  | "openai"
  | "anthropic"
  | "cloudflare"
  | "generic";

export type SecretInput = {
  action: SecretAction;
  path?: string;
  content?: string;
  secret?: string;
  tokenType?: SecretTokenType;
  unmasked?: boolean;
};

export type SecretAuditResult = {
  ok: boolean;
  path: string;
  exists: boolean;
  isDirectory?: boolean;
  modeOctal?: string;
  isPrivateMode?: boolean;
  violations?: string[];
};

export type SecretValidationResult = {
  valid: boolean;
  tokenType: SecretTokenType;
  detectedType?: string;
  fingerprint?: string;
  reason?: string;
};

/**
 * Masks a secret string keeping prefix and suffix for identity while hiding sensitive bits.
 */
export function maskSecret(val: string): string {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (trimmed.length <= 8) return "********";
  if (trimmed.length <= 16) {
    return `${trimmed.slice(0, 3)}****${trimmed.slice(-3)}`;
  }
  return `${trimmed.slice(0, 7)}****...****${trimmed.slice(-4)}`;
}

/**
 * Validates known token patterns
 */
export function validateTokenPattern(secret: string, expectedType?: SecretTokenType): SecretValidationResult {
  const trimmed = String(secret || "").trim();
  if (!trimmed) {
    return { valid: false, tokenType: expectedType || "generic", reason: "empty_token" };
  }

  // Detect token type
  let detected: SecretTokenType = "generic";
  if (/^(?:sk|rk)_(?:live|test)_[a-zA-Z0-9]{24,}/.test(trimmed)) {
    detected = "stripe";
  } else if (/^\d{8,12}:[a-zA-Z0-9_-]{35}$/.test(trimmed)) {
    detected = "telegram";
  } else if (/^gh[pousr]_[a-zA-Z0-9]{36,}/.test(trimmed)) {
    detected = "github";
  } else if (/^sk-ant-[a-zA-Z0-9_-]{20,}/.test(trimmed)) {
    detected = "anthropic";
  } else if (/^sk-[a-zA-Z0-9_-]{20,}/.test(trimmed)) {
    detected = "openai";
  } else if (/^[a-zA-Z0-9_-]{40}$/.test(trimmed)) {
    detected = "cloudflare";
  }

  const targetType = expectedType || detected;
  const isMatch = expectedType ? detected === expectedType : true;

  return {
    valid: isMatch,
    tokenType: targetType,
    detectedType: detected,
    fingerprint: maskSecret(trimmed),
    reason: isMatch ? undefined : `token format does not match expected ${expectedType} (detected ${detected})`,
  };
}

/**
 * Audits POSIX file or directory permissions (0600 for files, 0700 for directories)
 */
export function auditPermissions(targetPath: string): SecretAuditResult {
  const abs = resolve(targetPath);
  if (!existsSync(abs)) {
    return { ok: false, path: abs, exists: false, violations: ["path_does_not_exist"] };
  }

  const stat = statSync(abs);
  const isDir = stat.isDirectory();
  const mode = stat.mode & 0o777;
  const modeOctal = "0" + mode.toString(8);
  const violations: string[] = [];

  // World and group permission leak checks
  if ((stat.mode & 0o077) !== 0) {
    violations.push(`permissions_leak_group_or_world: octal ${modeOctal} allows access beyond owner`);
  }

  // File should strictly be 0600 or 0400
  if (!isDir && (mode !== 0o600 && mode !== 0o400)) {
    violations.push(`file_mode_not_0600: expected 0600 or 0400, got ${modeOctal}`);
  }

  // Directory should strictly be 0700 or 0500
  if (isDir && (mode !== 0o700 && mode !== 0o500)) {
    violations.push(`directory_mode_not_0700: expected 0700 or 0500, got ${modeOctal}`);
  }

  const isPrivate = violations.length === 0;
  return {
    ok: isPrivate,
    path: abs,
    exists: true,
    isDirectory: isDir,
    modeOctal,
    isPrivateMode: isPrivate,
    violations: violations.length > 0 ? violations : undefined,
  };
}

/**
 * Rotates an existing secret file: saves backup with 0600 mode and writes new content atomically.
 */
export function rotateSecret(targetPath: string, newContent: string): { ok: boolean; path: string; backupPath?: string; rotatedAt: string } {
  const abs = resolve(targetPath);
  let backupPath: string | undefined;

  if (existsSync(abs)) {
    const ts = Date.now();
    backupPath = `${abs}.bak-${ts}`;
    const oldContent = readFileSync(abs, "utf8");
    atomicWriteSecret(backupPath, oldContent);
  }

  atomicWriteSecret(abs, newContent);
  return {
    ok: true,
    path: abs,
    backupPath,
    rotatedAt: new Date().toISOString(),
  };
}

/**
 * Unified Functional Operation Entry Point for Secret Subsystem
 */
export function secretOperation(origInput: SecretInput): Record<string, unknown> {
  const raw: any = (origInput as any).params ? { ...origInput, ...(origInput as any).params } : origInput;
  const input = raw as SecretInput;
  const action = input.action;

  if (action === "list_actions") {
    return {
      action: "list_actions",
      ok: true,
      plugin: "secret",
      actions: ["write", "read", "mask", "rotate", "audit", "validate", "list_actions"],
      totalActions: 7,
      description: "MentalCraft Mode-0600 Local Credential Vault & POSIX Secret Engine",
    };
  }

  if (action === "mask") {
    const raw = input.secret ?? input.content ?? "";
    return {
      action: "mask",
      masked: maskSecret(raw),
      length: raw.length,
    };
  }

  if (action === "validate") {
    const raw = input.secret ?? input.content ?? "";
    const res = validateTokenPattern(raw, input.tokenType);
    return {
      action: "validate",
      ...res,
    };
  }

  if (action === "audit") {
    if (!input.path) throw new Error("secret action 'audit' requires 'path'");
    const res = auditPermissions(input.path);
    return {
      action: "audit",
      ...res,
    };
  }

  if (action === "write") {
    if (!input.path) throw new Error("secret action 'write' requires 'path'");
    if (input.content === undefined) throw new Error("secret action 'write' requires 'content'");
    const abs = resolve(input.path);
    atomicWriteSecret(abs, input.content);
    const stat = auditPermissions(abs);
    return {
      action: "write",
      ok: true,
      path: abs,
      mode: stat.modeOctal,
      bytes: Buffer.byteLength(input.content),
      fingerprint: maskSecret(input.content),
    };
  }

  if (action === "read") {
    if (!input.path) throw new Error("secret action 'read' requires 'path'");
    const abs = resolve(input.path);
    if (!existsSync(abs)) {
      throw new Error(`Secret file not found: ${abs}`);
    }
    const audit = auditPermissions(abs);
    const content = readFileSync(abs, "utf8");
    return {
      action: "read",
      path: abs,
      mode: audit.modeOctal,
      isPrivateMode: audit.isPrivateMode,
      bytes: Buffer.byteLength(content),
      fingerprint: maskSecret(content),
      content: input.unmasked === true ? content : undefined,
    };
  }

  if (action === "rotate") {
    if (!input.path) throw new Error("secret action 'rotate' requires 'path'");
    if (input.content === undefined) throw new Error("secret action 'rotate' requires 'content'");
    const res = rotateSecret(input.path, input.content);
    return {
      action: "rotate",
      ...res,
      fingerprint: maskSecret(input.content),
    };
  }

  throw new Error(`Unsupported secret action: ${action}`);
}
