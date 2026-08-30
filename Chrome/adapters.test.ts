import { describe, expect, test } from "bun:test";
import { GENERIC_ADAPTER, registerSiteAdapter, resolveSiteAdapter, type SiteAdapter } from "./modules/adapters.ts";

describe("site adapter registry", () => {
  test("keeps a generic fallback and accepts independently bounded adapters", () => {
    const generic = resolveSiteAdapter("https://unknown.example/");
    expect(generic.id).toBe(GENERIC_ADAPTER);
    const adapter: SiteAdapter = {
      id: "shop-example",
      matches: (url) => url.origin === "https://shop.example",
      capabilities: ["diagnose", "controls"],
    };
    const registry = registerSiteAdapter([], adapter);
    expect(resolveSiteAdapter("https://shop.example/cart", registry).id).toBe("shop-example");
    expect(() => registerSiteAdapter(registry, adapter)).toThrow("duplicate");
  });

  test("rejects browser-internal and malformed adapter inputs", () => {
    expect(() => resolveSiteAdapter("chrome://settings/")).toThrow("origin");
    expect(() => registerSiteAdapter([], {
      id: "bad id",
      matches: () => true,
      capabilities: ["controls"],
    })).toThrow("invalid");
  });
});
