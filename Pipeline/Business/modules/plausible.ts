/**
 * Plugin/Business Plausible analytics catalog
 *
 * Public tracker host for MentalCraft product websites. Live stats require
 * PLAUSIBLE_API_KEY in the environment; never persist tokens in this repo.
 */

export const PLAUSIBLE_PUBLIC_HOST = "https://analytics.mentalcraft.org" as const;
export const PLAUSIBLE_TRACKER_PATH = "/js/script.js" as const;
export const PLAUSIBLE_TRACKER_URL = `${PLAUSIBLE_PUBLIC_HOST}${PLAUSIBLE_TRACKER_PATH}` as const;
export const PLAUSIBLE_EVENT_URL = `${PLAUSIBLE_PUBLIC_HOST}/api/event` as const;

export type PlausibleSite = {
  name: string;
  domain: string;
};

export const PLAUSIBLE_SITES: readonly PlausibleSite[] = Object.freeze([
  Object.freeze({ name: "AdCut", domain: "adcutapp.com" }),
  Object.freeze({ name: "Am I Big Back", domain: "amibigback.com" }),
  Object.freeze({ name: "EssayDetector", domain: "essaydetector.org" }),
  Object.freeze({ name: "EssayHumanize", domain: "essayhumanize.com" }),
  Object.freeze({ name: "Hookly", domain: "hookly.cc" }),
  Object.freeze({ name: "HumanBench", domain: "humanbench.org" }),
  Object.freeze({ name: "HWProbe", domain: "hwprobe.com" }),
  Object.freeze({ name: "iProbe", domain: "iprobe.net" }),
  Object.freeze({ name: "MentalCraft", domain: "mentalcraft.org" }),
  Object.freeze({ name: "PosiChat", domain: "posichat.app" }),
  Object.freeze({ name: "TractionRank", domain: "tractionrank.com" }),
  Object.freeze({ name: "VestGap", domain: "vestgap.com" }),
]);

export function normalizePlausibleDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0] ?? "";
}

export function lookupByDomain(domain: string): PlausibleSite {
  const normalized = normalizePlausibleDomain(domain);
  const found = PLAUSIBLE_SITES.find((site) => site.domain === normalized);
  if (!found) {
    throw new Error(`Unknown Plausible site domain: ${domain}`);
  }
  return found;
}

export function trackerSnippet(domain: string): string {
  const site = lookupByDomain(domain);
  return `<script defer data-domain="${site.domain}" src="${PLAUSIBLE_TRACKER_URL}"></script>`;
}

export function plausibleListSites() {
  return {
    host: PLAUSIBLE_PUBLIC_HOST,
    trackerPath: PLAUSIBLE_TRACKER_PATH,
    trackerUrl: PLAUSIBLE_TRACKER_URL,
    eventUrl: PLAUSIBLE_EVENT_URL,
    total: PLAUSIBLE_SITES.length,
    sites: PLAUSIBLE_SITES.map((site) => ({ ...site })),
  };
}

export function plausibleTrackerSnippet(domain: string) {
  if (!domain || !domain.trim()) {
    throw new Error("domain is required for plausible_tracker_snippet");
  }
  const site = lookupByDomain(domain);
  return {
    name: site.name,
    domain: site.domain,
    host: PLAUSIBLE_PUBLIC_HOST,
    snippet: trackerSnippet(domain),
  };
}

export type PlausibleWebsiteStatsResult =
  | {
      ok: false;
      reason: "PLAUSIBLE_API_KEY missing";
      domain: string;
    }
  | {
      ok: true;
      domain: string;
      stats: unknown;
    }
  | {
      ok: false;
      reason: string;
      domain: string;
      status?: number;
    };

export async function plausibleWebsiteStats(domain: string): Promise<PlausibleWebsiteStatsResult> {
  if (!domain || !domain.trim()) {
    throw new Error("domain is required for plausible_website_stats");
  }
  const site = lookupByDomain(domain);
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "PLAUSIBLE_API_KEY missing",
      domain: site.domain,
    };
  }

  const params = new URLSearchParams({
    site_id: site.domain,
    period: "30d",
    metrics: "visitors,pageviews,bounce_rate,visit_duration",
  });
  const url = `${PLAUSIBLE_PUBLIC_HOST}/api/v1/stats/aggregate?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: `Plausible stats request failed (${response.status})`,
      domain: site.domain,
      status: response.status,
    };
  }

  return {
    ok: true,
    domain: site.domain,
    stats: await response.json(),
  };
}
