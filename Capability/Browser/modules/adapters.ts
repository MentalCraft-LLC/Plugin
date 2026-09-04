export const GENERIC_ADAPTER = "generic-web" as const;

export type SiteAdapter = {
  id: string;
  matches: (url: URL) => boolean;
  capabilities: readonly string[];
};

function validAdapter(adapter: SiteAdapter): boolean {
  return /^[a-z0-9][a-z0-9_-]{1,63}$/.test(adapter.id)
    && adapter.id !== GENERIC_ADAPTER
    && Array.isArray(adapter.capabilities)
    && adapter.capabilities.every((item) => typeof item === "string" && /^[a-z0-9_-]{1,64}$/.test(item));
}

export function registerSiteAdapter(adapters: readonly SiteAdapter[], adapter: SiteAdapter): SiteAdapter[] {
  if (!validAdapter(adapter)) throw new Error("site_adapter_invalid");
  if (adapters.some((item) => item.id === adapter.id)) throw new Error("site_adapter_duplicate");
  return [...adapters, adapter];
}

export function resolveSiteAdapter(rawUrl: string, adapters: readonly SiteAdapter[] = []): SiteAdapter {
  let url;
  try { url = new URL(rawUrl); } catch { throw new Error("site_adapter_url_invalid"); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("site_adapter_origin_invalid");
  const match = adapters.find((adapter) => validAdapter(adapter) && adapter.matches(url));
  return match ?? { id: GENERIC_ADAPTER, matches: () => true, capabilities: ["diagnose", "navigate", "controls", "screenshot"] };
}
