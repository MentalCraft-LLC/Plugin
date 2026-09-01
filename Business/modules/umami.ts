/**
 * Plugin/Business Umami analytics catalog
 *
 * Public tracker host for MentalCraft product websites. Live stats require
 * UMAMI_API_TOKEN in the environment; never persist tokens in this repo.
 */

export const UMAMI_PUBLIC_HOST = "https://analytics.mentalcraft.org" as const;
export const UMAMI_TRACKER_PATH = "/umami" as const;
export const UMAMI_SEND_URL = `${UMAMI_PUBLIC_HOST}/api/send` as const;
export const UMAMI_FALLBACK_HOST = "https://analytics.vestgap.com" as const;

export type UmamiWebsite = {
  name: string;
  domain: string;
  websiteId: string;
};

export const UMAMI_WEBSITES: readonly UmamiWebsite[] = Object.freeze([
  Object.freeze({ name: "AdCut", domain: "adcutapp.com", websiteId: "5d37ac35-c441-4be6-93e0-3221817b6aed" }),
  Object.freeze({ name: "Am I Big Back", domain: "amibigback.com", websiteId: "77a3e559-2077-4443-9644-6f6877671c4e" }),
  Object.freeze({ name: "EssayDetector", domain: "essaydetector.org", websiteId: "8548f245-ceae-42d5-b607-0fe751d3db76" }),
  Object.freeze({ name: "EssayHumanize", domain: "essayhumanize.com", websiteId: "ae58182e-0e69-4c59-bdb5-ac832c5b1191" }),
  Object.freeze({ name: "Hookly", domain: "hookly.cc", websiteId: "1731d5ff-5cc0-4f8f-9d9c-f6917e8b4c1e" }),
  Object.freeze({ name: "HumanBench", domain: "humanbench.org", websiteId: "8b7c6f6a-58ad-40eb-9ada-fdc6c606a76c" }),
  Object.freeze({ name: "HWProbe", domain: "hwprobe.com", websiteId: "df0577c4-5f0c-42fe-921f-3bf3d665c56c" }),
  Object.freeze({ name: "iProbe", domain: "iprobe.net", websiteId: "fc547cb1-8bc8-43df-94af-548beaa57174" }),
  Object.freeze({ name: "MentalCraft", domain: "mentalcraft.org", websiteId: "ad55ece2-f383-43da-97de-0bf4865568e0" }),
  Object.freeze({ name: "PosiChat", domain: "posichat.app", websiteId: "7c7dd1e2-b23e-46ca-9696-cbc3f59a431d" }),
  Object.freeze({ name: "TractionRank", domain: "tractionrank.com", websiteId: "c57157e1-70a3-4117-a4b1-7bb0863867d0" }),
  Object.freeze({ name: "VestGap", domain: "vestgap.com", websiteId: "0af8b3f8-091d-40f1-bf23-a1139713a486" }),
]);

export function normalizeUmamiDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0] ?? "";
}

export function lookupByDomain(domain: string): UmamiWebsite {
  const normalized = normalizeUmamiDomain(domain);
  const found = UMAMI_WEBSITES.find((site) => site.domain === normalized);
  if (!found) {
    throw new Error(`Unknown Umami website domain: ${domain}`);
  }
  return found;
}

export function trackerSnippet(domain: string): string {
  const site = lookupByDomain(domain);
  return `<script defer src="${UMAMI_PUBLIC_HOST}${UMAMI_TRACKER_PATH}" data-website-id="${site.websiteId}"></script>`;
}

export function umamiListWebsites() {
  return {
    host: UMAMI_PUBLIC_HOST,
    trackerPath: UMAMI_TRACKER_PATH,
    sendUrl: UMAMI_SEND_URL,
    fallbackHost: UMAMI_FALLBACK_HOST,
    total: UMAMI_WEBSITES.length,
    websites: UMAMI_WEBSITES.map((site) => ({ ...site })),
  };
}

export function umamiTrackerSnippet(domain: string) {
  if (!domain || !domain.trim()) {
    throw new Error("domain is required for umami_tracker_snippet");
  }
  const site = lookupByDomain(domain);
  return {
    name: site.name,
    domain: site.domain,
    websiteId: site.websiteId,
    host: UMAMI_PUBLIC_HOST,
    snippet: trackerSnippet(domain),
  };
}

export type UmamiWebsiteStatsResult =
  | {
      ok: false;
      reason: "UMAMI_API_TOKEN missing";
      domain: string;
      websiteId: string;
    }
  | {
      ok: true;
      domain: string;
      websiteId: string;
      stats: unknown;
    }
  | {
      ok: false;
      reason: string;
      domain: string;
      websiteId: string;
      status?: number;
    };

export async function umamiWebsiteStats(domain: string): Promise<UmamiWebsiteStatsResult> {
  if (!domain || !domain.trim()) {
    throw new Error("domain is required for umami_website_stats");
  }
  const site = lookupByDomain(domain);
  const token = process.env.UMAMI_API_TOKEN;
  if (!token) {
    return {
      ok: false,
      reason: "UMAMI_API_TOKEN missing",
      domain: site.domain,
      websiteId: site.websiteId,
    };
  }

  const url = `${UMAMI_PUBLIC_HOST}/api/websites/${site.websiteId}/stats`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: `Umami stats request failed (${response.status})`,
      domain: site.domain,
      websiteId: site.websiteId,
      status: response.status,
    };
  }

  return {
    ok: true,
    domain: site.domain,
    websiteId: site.websiteId,
    stats: await response.json(),
  };
}
