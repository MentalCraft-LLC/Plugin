import { describe, test, expect } from "bun:test";
import {
	computeTractionRankMrr,
	auditTractionRankFivePillars
} from "./modules/tractionrank_growth.ts";
import { generateProWeeklyDigest } from "./modules/email_digest.ts";
import { calculateMrrSnapshot, formatMrrReport } from "./modules/mrr_monitor.ts";

describe("TractionRank Five-Pillar Optimization & $10,000 MRR Engine", () => {
	test("Five-pillar audit covers SEO, LLMO, EEAT, User Experience, and Conversion Funnel", () => {
		const audit = auditTractionRankFivePillars();

		// SEO
		expect(audit.seo.status).toBe("PASS");
		expect(audit.seo.pSeoCategoriesCount).toBe(10);
		expect(audit.seo.sitemapUrlsCount).toBeGreaterThanOrEqual(2800);

		// LLMO
		expect(audit.llmo.status).toBe("PASS");
		expect(audit.llmo.llmsTxtPresent).toBe(true);
		expect(audit.llmo.llmsFullTxtPresent).toBe(true);
		expect(audit.llmo.markdownMirrorsCount).toBeGreaterThan(2000);

		// EEAT
		expect(audit.eeat.status).toBe("PASS");
		expect(audit.eeat.missingNeverZero).toBe(true);
		expect(audit.eeat.zeroPayToRankPolicy).toBe(true);
		expect(audit.eeat.experience.score).toBeGreaterThan(90);
		expect(audit.eeat.expertise.score).toBeGreaterThan(90);
		expect(audit.eeat.authoritativeness.score).toBeGreaterThan(90);
		expect(audit.eeat.trustworthiness.score).toBeGreaterThan(90);

		// UX
		expect(audit.ux.status).toBe("PASS");
		expect(audit.ux.instantSearch).toBe(true);
		expect(audit.ux.interactiveSparklines).toBe(true);
		expect(audit.ux.embedCustomizer).toBe(true);

		// Funnel
		expect(audit.funnel.totalMrrUsd).toBeGreaterThanOrEqual(10000);
		expect(audit.funnel.targetMet).toBe(true);
	});

	test("TractionRank $10,000 MRR calculation follows exact tier arithmetic", () => {
		const mrr = computeTractionRankMrr({
			proSubs: 350,
			proPrice: 19,
			sponsorSubs: 25,
			sponsorPrice: 99,
			apiSubs: 5,
			apiPrice: 199
		});

		expect(mrr.proTier.mrrUsd).toBe(350 * 19); // $6,650
		expect(mrr.sponsorTier.mrrUsd).toBe(25 * 99); // $2,475
		expect(mrr.apiTier.mrrUsd).toBe(5 * 199); // $995
		expect(mrr.totalMrrUsd).toBe(6650 + 2475 + 995); // $10,120
		expect(mrr.totalArrUsd).toBe(10120 * 12); // $121,440
		expect(mrr.goalAchieved).toBe(true);
	});

	test("Custom pricing parameters adapt dynamically and calculate goal status accurately", () => {
		const custom = computeTractionRankMrr({
			proSubs: 500,
			proPrice: 20,
			sponsorSubs: 0,
			apiSubs: 0
		});
		expect(custom.totalMrrUsd).toBe(10000);
		expect(custom.goalAchieved).toBe(true);

		const under = computeTractionRankMrr({
			proSubs: 100,
			proPrice: 19,
			sponsorSubs: 10,
			sponsorPrice: 99,
			apiSubs: 0
		});
		expect(under.totalMrrUsd).toBe(1900 + 990);
		expect(under.goalAchieved).toBe(false);
	});

	test("Weekly Pro email digest generates markdown & HTML with watchlist alerts", () => {
		const digest = generateProWeeklyDigest({
			subscriberEmail: "alex@venture.com",
			subscriberName: "Alex",
			window: "2026-07",
			watchlist: ["cursor.com", "suno.com"],
			topMovers: [
				{ domain: "cursor.com", rank: 13, delta_rank: 4, visits: 72400000, category: "AI Coding" },
				{ domain: "suno.com", rank: 14, delta_rank: 8, visits: 65600000, category: "AI Audio" },
				{ domain: "windsurf.com", rank: 21, delta_rank: 12, visits: 44900000, category: "AI Coding" }
			]
		});

		expect(digest.subject).toContain("TractionRank Weekly Digest");
		expect(digest.alertsCount).toBe(2);
		expect(digest.moversCount).toBe(3);
		expect(digest.markdown).toContain("Watchlist Alerts");
		expect(digest.markdown).toContain("cursor.com");
		expect(digest.markdown).toContain("suno.com");
		expect(digest.html).toContain("TractionRank Pro Digest");
		expect(digest.html).toContain("https://tractionrank.com/d/cursor.com");
	});

	test("MRR Monitor accurately calculates snapshot tiers, gaps, and daily pacing requirements", () => {
		const snapshot = calculateMrrSnapshot({
			proSubs: 175, // 50%
			sponsorSubs: 10, // 40%
			apiSubs: 2, // 40%
			window: "2026-07",
			daysRemainingInSprint: 30
		});

		expect(snapshot.tiers.pro.mrrUsd).toBe(175 * 19); // $3,325
		expect(snapshot.tiers.sponsor.mrrUsd).toBe(10 * 99); // $990
		expect(snapshot.tiers.api.mrrUsd).toBe(2 * 199); // $398
		expect(snapshot.totalMrrUsd).toBe(3325 + 990 + 398); // $4,713
		expect(snapshot.mrrGapUsd).toBe(10120 - 4713); // $5,407
		expect(snapshot.goalAchieved).toBe(false);
		expect(snapshot.dailyPacingRequired.daysToTarget).toBe(30);
		expect(snapshot.dailyPacingRequired.proNewPerDay).toBeGreaterThan(5);

		const formatted = formatMrrReport(snapshot);
		expect(formatted).toContain("TractionRank MRR Progress Report");
		expect(formatted).toContain("$4,713");
		expect(formatted).toContain("Category Spotlight Sponsor");
	});
});
