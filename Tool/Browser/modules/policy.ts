export const ALLOWED_ORIGINS = [
  "http://*/*",
  "https://*/*",
] as const;

export const CAPABILITIES = [
  "navigate",
  "controls",
  "public_fill",
  "local_fill",
  "screenshot",
  "session_read",
  "text_read",
] as const;

export type BrowserCapability = (typeof CAPABILITIES)[number];

export type TargetPolicy = {
  origins: readonly string[];
  capabilities: readonly BrowserCapability[];
};

export const DEFAULT_TARGET_POLICY: TargetPolicy = {
  origins: ALLOWED_ORIGINS,
  capabilities: ["navigate", "controls", "public_fill", "local_fill", "screenshot", "session_read", "text_read"],
};

function originAllowed(origin: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => {
    const normalized = pattern.replace(/\/\*$/, "");
    return normalized.endsWith("://*") ? origin.startsWith(normalized.slice(0, -1)) : origin === normalized;
  });
}

export function capabilityAllowed(policy: TargetPolicy, capability: BrowserCapability): boolean {
  return policy.capabilities.includes(capability);
}

export function safeTargetUrl(raw: string, policy: TargetPolicy = DEFAULT_TARGET_POLICY): string {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Browser URL is invalid"); }
  if (
    !originAllowed(url.origin, policy.origins)
    || !["http:", "https:"].includes(url.protocol)
    || url.username
    || url.password
  ) throw new Error("Browser URL is outside the target policy");
  return url.toString();
}

export function safeForegroundUrl(raw: string): string {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Browser URL is invalid"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Browser URL is outside the foreground screenshot policy");
  }
  return url.toString();
}
