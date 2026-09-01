import { describe, test, expect } from "bun:test";
import {
	computeTractionRankMrr,
	auditTractionRankFivePillars
} from "./modules/tractionrank_growth.ts";

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
});
