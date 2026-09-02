import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditPermissions, maskSecret, rotateSecret, secretOperation, validateTokenPattern } from "./operation.ts";
import { handleSecretRpc, SECRET_INPUT_SCHEMA, SECRET_TOOL } from "./mcp-server.ts";

describe("Plugin/Secret - Mode-0600 Local Credential Vault Engine", () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const dir of cleanups) {
      rmSync(dir, { recursive: true, force: true });
    }
    cleanups.length = 0;
  });

  function makeTmpDir(): string {
    const dir = join(tmpdir(), `secret-test-${process.pid}-${Date.now() % 100000}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    cleanups.push(dir);
    return dir;
  }

  test("maskSecret correctly obscures secrets while retaining prefix/suffix identifier", () => {
    expect(maskSecret("")).toBe("");
    expect(maskSecret("short")).toBe("********");
    expect(maskSecret("1234567890abcdef")).toBe("123****def");
    expect(maskSecret("sk_test_51M0abcdefghijklmnopqrstuvwxyz123456")).toBe("sk_test****...****3456");
  });

  test("validateTokenPattern identifies and validates tokens across standard providers", () => {
    // Stripe
    const stripe = validateTokenPattern("sk_test_51M0abc1234567890abcdef12345");
    expect(stripe.valid).toBe(true);
    expect(stripe.detectedType).toBe("stripe");

    // Telegram
    const tg = validateTokenPattern("123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789");
    expect(tg.valid).toBe(true);
    expect(tg.detectedType).toBe("telegram");

    // GitHub
    const gh = validateTokenPattern("ghp_123456789012345678901234567890123456");
    expect(gh.valid).toBe(true);
    expect(gh.detectedType).toBe("github");

    // Anthropic
    const ant = validateTokenPattern("sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz");
    expect(ant.valid).toBe(true);
    expect(ant.detectedType).toBe("anthropic");

    // Cloudflare
    const cf = validateTokenPattern("1234567890abcdef1234567890abcdef12345678");
    expect(cf.valid).toBe(true);
    expect(cf.detectedType).toBe("cloudflare");

    // Mismatched expected type
    const mismatch = validateTokenPattern("ghp_123456789012345678901234567890123456", "stripe");
    expect(mismatch.valid).toBe(false);
    expect(mismatch.reason).toContain("does not match");
  });

  test("auditPermissions detects compliant 0600 files and flags insecure permission leaks", () => {
    const dir = makeTmpDir();
    const secureFile = join(dir, "token.json");
    writeFileSync(secureFile, "{\"token\":\"abc\"}", { mode: 0o600 });
    chmodSync(secureFile, 0o600);

    const secureAudit = auditPermissions(secureFile);
    expect(secureAudit.ok).toBe(true);
    expect(secureAudit.modeOctal).toBe("0600");
    expect(secureAudit.violations).toBeUndefined();

    // Insecure file with group/world readable permissions
    const leakFile = join(dir, "leak.json");
    writeFileSync(leakFile, "{\"token\":\"leaked\"}", { mode: 0o644 });
    chmodSync(leakFile, 0o644);

    const leakAudit = auditPermissions(leakFile);
    expect(leakAudit.ok).toBe(false);
    expect(leakAudit.violations?.some((v) => v.includes("permissions_leak"))).toBe(true);
  });

  test("rotateSecret safely preserves backup file with 0600 mode and swaps new content", () => {
    const dir = makeTmpDir();
    const secretPath = join(dir, "api_key.txt");
    writeFileSync(secretPath, "old_secret_value", { mode: 0o600 });

    const rotateRes = rotateSecret(secretPath, "new_secret_value");
    expect(rotateRes.ok).toBe(true);
    expect(rotateRes.backupPath).toBeDefined();
    expect(existsSync(rotateRes.backupPath!)).toBe(true);

    // Verify backup content and mode
    const backupContent = readFileSync(rotateRes.backupPath!, "utf8");
    expect(backupContent).toBe("old_secret_value");
    const backupStat = statSync(rotateRes.backupPath!);
    expect(backupStat.mode & 0o777).toBe(0o600);

    // Verify current content and mode
    const currentContent = readFileSync(secretPath, "utf8");
    expect(currentContent).toBe("new_secret_value");
    const currentStat = statSync(secretPath);
    expect(currentStat.mode & 0o777).toBe(0o600);
  });

  test("secretOperation executes write, read, mask, rotate, audit, validate actions smoothly", () => {
    const dir = makeTmpDir();
    const file = join(dir, "creds.json");
    const payload = JSON.stringify({ key: "sk_test_1234567890abcdef1234567890" });

    // 1. write
    const writeRes = secretOperation({ action: "write", path: file, content: payload });
    expect(writeRes.action).toBe("write");
    expect(writeRes.ok).toBe(true);
    expect(writeRes.mode).toBe("0600");

    // 2. read (masked by default)
    const readRes = secretOperation({ action: "read", path: file });
    expect(readRes.action).toBe("read");
    expect(readRes.content).toBeUndefined(); // Masked by default
    expect(readRes.fingerprint).toBeDefined();

    // 2b. read unmasked
    const readUnmasked = secretOperation({ action: "read", path: file, unmasked: true });
    expect(readUnmasked.content).toBe(payload);

    // 3. audit
    const auditRes = secretOperation({ action: "audit", path: file });
    expect(auditRes.action).toBe("audit");
    expect(auditRes.ok).toBe(true);

    // 4. mask
    const maskRes = secretOperation({ action: "mask", secret: "sk_test_1234567890abcdef1234567890" });
    expect(maskRes.action).toBe("mask");
    expect(maskRes.masked).toContain("****");

    // 5. validate
    const valRes = secretOperation({ action: "validate", secret: "sk_test_1234567890abcdef1234567890" });
    expect(valRes.action).toBe("validate");
    expect(valRes.valid).toBe(true);
    expect(valRes.tokenType).toBe("stripe");

    // 6. rotate
    const newPayload = JSON.stringify({ key: "sk_test_9999999999zzzzzz9999999999" });
    const rotRes = secretOperation({ action: "rotate", path: file, content: newPayload });
    expect(rotRes.action).toBe("rotate");
    expect(rotRes.ok).toBe(true);
    expect(rotRes.backupPath).toBeDefined();
  });

  test("handleSecretRpc implements standard FastMCP JSON-RPC lifecycle", () => {
    const initRes = handleSecretRpc({ jsonrpc: "2.0", id: 1, method: "initialize" }) as any;
    expect(initRes.result.serverInfo.name).toBe("secret");

    const pingRes = handleSecretRpc({ jsonrpc: "2.0", id: 2, method: "ping" }) as any;
    expect(pingRes.result).toEqual({});

    const toolsRes = handleSecretRpc({ jsonrpc: "2.0", id: 3, method: "tools/list" }) as any;
    expect(toolsRes.result.tools).toHaveLength(1);
    expect(toolsRes.result.tools[0].name).toBe("secret");

    const maskRpc = handleSecretRpc({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "secret",
        arguments: { action: "mask", secret: "1234567890abcdef" },
      },
    }) as any;
    expect(maskRpc.result.content[0].type).toBe("text");
    const parsed = JSON.parse(maskRpc.result.content[0].text);
    expect(parsed.masked).toBe("123****def");
  });
});
