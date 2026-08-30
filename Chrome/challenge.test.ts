import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));

function detect(page: unknown) {
  const sandbox: { globalThis?: Record<string, unknown> } = {};
  sandbox.globalThis = sandbox as unknown as Record<string, unknown>;
  vm.runInNewContext(readFileSync(resolve(here, "./extension/challenge.js"), "utf8"), sandbox);
  return (sandbox.globalThis.spiralDetectHumanBoundary as (value: unknown) => unknown)(page);
}

describe("human challenge boundary", () => {
  test("classifies resumable MFA/CAPTCHA/consent surfaces without exposing labels", () => {
    expect(detect({ controls: [{ name: "Verification code", role: "textbox" }] })).toEqual({ kind: "mfa", resumable: true });
    expect(detect({ controls: [{ name: "Verify you're human", role: "button" }] })).toEqual({ kind: "captcha", resumable: true });
    expect(detect({ controls: [{ name: "Accept cookies", role: "button" }] })).toEqual({ kind: "consent", resumable: true });
  });

  test("classifies Cookie controls as consent without treating an unrelated consent link as terms", () => {
    expect(detect({ controls: [{ name: "同意", role: "link" }] })).toBeNull();
    expect(detect({ controls: [{ name: "同意", role: "link" }, { name: "Allow All", role: "button" }] }))
      .toEqual({ kind: "consent", resumable: true });
    expect(detect({ controls: [{ name: "Confirm My Choices", role: "button" }] }))
      .toEqual({ kind: "consent", resumable: true });
  });

  test("ignores informational terms links but blocks an actionable terms control", () => {
    expect(detect({ controls: [{ name: "Terms of Service", role: "link" }] })).toBeNull();
    expect(detect({ controls: [{ name: "I agree to the Terms of Service", role: "button" }] })).toEqual({ kind: "terms", resumable: true });
    expect(detect({ controls: [{ name: "Terms of Service", role: "checkbox" }] })).toEqual({ kind: "terms", resumable: true });
  });

  test("does not block an ordinary page", () => {
    expect(detect({ controls: [{ name: "Save settings", role: "button" }] })).toBeNull();
  });

  test("classifies a login wall only with credential evidence", () => {
    // Lone "登录" control on an already signed-in console is not a login wall.
    expect(detect({ controls: [{ name: "登录", role: "button" }] })).toBeNull();
    // Login button plus a password/textbox input is a login wall.
    expect(detect({ controls: [{ name: "登录", role: "button" }, { name: "密码", role: "textbox" }] }))
      .toEqual({ kind: "login", resumable: true });
    // Login button plus a QR/scan marker is a login wall.
    expect(detect({ controls: [{ name: "Sign in", role: "button" }, { name: "扫码登录", role: "link" }] }))
      .toEqual({ kind: "login", resumable: true });
  });
});
