import { describe, expect, test } from "bun:test";
import { capabilityAllowed, DEFAULT_TARGET_POLICY, safeForegroundUrl, safeTargetUrl, type TargetPolicy } from "./modules/policy.ts";

describe("Browser target policy", () => {
  test("keeps the default universal policy broad and capability-gated", () => {
    expect(DEFAULT_TARGET_POLICY.origins).toEqual(["http://*/*", "https://*/*"]);
    expect(capabilityAllowed(DEFAULT_TARGET_POLICY, "screenshot")).toBe(true);
    expect(capabilityAllowed(DEFAULT_TARGET_POLICY, "session_read")).toBe(true);
    expect(safeTargetUrl("https://example.com/", DEFAULT_TARGET_POLICY)).toBe("https://example.com/");
    expect(safeTargetUrl("http://example.com/help", DEFAULT_TARGET_POLICY)).toBe("http://example.com/help");
    expect(() => safeTargetUrl("file:///tmp/private", DEFAULT_TARGET_POLICY)).toThrow("target policy");
  });

  test("supports a separately declared HTTPS target without changing the default policy", () => {
    const policy: TargetPolicy = {
      origins: ["https://example.com"],
      capabilities: ["navigate", "controls", "screenshot"],
    };
    expect(safeTargetUrl("https://example.com/help", policy)).toBe("https://example.com/help");
    expect(capabilityAllowed(policy, "screenshot")).toBe(true);
    expect(() => safeTargetUrl("http://example.com/help", policy)).toThrow("target policy");
    expect(safeTargetUrl("https://example.com/help", DEFAULT_TARGET_POLICY)).toBe("https://example.com/help");
    expect(safeForegroundUrl("https://example.com/private?view=1")).toBe("https://example.com/private?view=1");
    expect(safeForegroundUrl("http://example.com/private")).toBe("http://example.com/private");
  });
});
