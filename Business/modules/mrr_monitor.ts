/**
 * Plugin/Business - TractionRank MRR & Conversion Telemetry Engine
 *
 * Tracks and projects TractionRank's commercial trajectory towards $10,000 MRR ($120,000 ARR).
 */

export interface TractionRankTierState {
	name: string;
	priceUsd: number;
	activeSubscribers: number;
	targetSubscribers: number;
	mrrUsd: number;
	targetMrrUsd: number;
	progressPercent: number;
}

export interface MrrSnapshot {
	timestamp: string;
	window: string;
	tiers: {
		pro: TractionRankTierState;
		sponsor: TractionRankTierState;
		api: TractionRankTierState;
	};
	totalMrrUsd: number;
	targetMrrUsd: number;
	totalArrUsd: number;
	targetArrUsd: number;
	overallProgressPercent: number;
	mrrGapUsd: number;
	goalAchieved: boolean;
	dailyPacingRequired: {
		proNewPerDay: number;
		sponsorNewPerDay: number;
		daysToTarget: number;
	};
}

export const TARGET_BENCHMARKS = {
	proPrice: 19,
	proTargetSubs: 350,
	proTargetMrr: 6650,

	sponsorPrice: 99,
	sponsorTargetSubs: 25,
	sponsorTargetMrr: 2475,

	apiPrice: 199,
	apiTargetSubs: 5,
	apiTargetMrr: 995,

	totalTargetMrr: 10120,
	totalTargetArr: 121440
};

export function calculateMrrSnapshot(
	current: {
		proSubs: number;
		sponsorSubs: number;
		apiSubs: number;
		window?: string;
		daysRemainingInSprint?: number;
	}
): MrrSnapshot {
	const window = current.window || "2026-07";
	const daysLeft = current.daysRemainingInSprint || 60;

	const proMrr = current.proSubs * TARGET_BENCHMARKS.proPrice;
	const sponsorMrr = current.sponsorSubs * TARGET_BENCHMARKS.sponsorPrice;
	const apiMrr = current.apiSubs * TARGET_BENCHMARKS.apiPrice;
	const totalMrr = proMrr + sponsorMrr + apiMrr;

	const proProgress = Math.min(100, Math.round((current.proSubs / TARGET_BENCHMARKS.proTargetSubs) * 1000) / 10);
	const sponsorProgress = Math.min(100, Math.round((current.sponsorSubs / TARGET_BENCHMARKS.sponsorTargetSubs) * 1000) / 10);
	const apiProgress = Math.min(100, Math.round((current.apiSubs / TARGET_BENCHMARKS.apiTargetSubs) * 1000) / 10);
	const overallProgress = Math.min(100, Math.round((totalMrr / TARGET_BENCHMARKS.totalTargetMrr) * 1000) / 10);

	const mrrGap = Math.max(0, TARGET_BENCHMARKS.totalTargetMrr - totalMrr);

	const proNeeded = Math.max(0, TARGET_BENCHMARKS.proTargetSubs - current.proSubs);
	const sponsorNeeded = Math.max(0, TARGET_BENCHMARKS.sponsorTargetSubs - current.sponsorSubs);

	return {
		timestamp: new Date().toISOString(),
		window,
		tiers: {
			pro: {
				name: "TractionRank Pro",
				priceUsd: TARGET_BENCHMARKS.proPrice,
				activeSubscribers: current.proSubs,
				targetSubscribers: TARGET_BENCHMARKS.proTargetSubs,
				mrrUsd: proMrr,
				targetMrrUsd: TARGET_BENCHMARKS.proTargetMrr,
				progressPercent: proProgress
			},
			sponsor: {
				name: "Category Spotlight Sponsor",
				priceUsd: TARGET_BENCHMARKS.sponsorPrice,
				activeSubscribers: current.sponsorSubs,
				targetSubscribers: TARGET_BENCHMARKS.sponsorTargetSubs,
				mrrUsd: sponsorMrr,
				targetMrrUsd: TARGET_BENCHMARKS.sponsorTargetMrr,
				progressPercent: sponsorProgress
			},
			api: {
				name: "Enterprise Data API Feed",
				priceUsd: TARGET_BENCHMARKS.apiPrice,
				activeSubscribers: current.apiSubs,
				targetSubscribers: TARGET_BENCHMARKS.apiTargetSubs,
				mrrUsd: apiMrr,
				targetMrrUsd: TARGET_BENCHMARKS.apiTargetMrr,
				progressPercent: apiProgress
			}
		},
		totalMrrUsd: totalMrr,
		targetMrrUsd: TARGET_BENCHMARKS.totalTargetMrr,
		totalArrUsd: totalMrr * 12,
		targetArrUsd: TARGET_BENCHMARKS.totalTargetArr,
		overallProgressPercent: overallProgress,
		mrrGapUsd: mrrGap,
		goalAchieved: totalMrr >= 10000,
		dailyPacingRequired: {
			proNewPerDay: Math.round((proNeeded / Math.max(1, daysLeft)) * 10) / 10,
			sponsorNewPerDay: Math.round((sponsorNeeded / Math.max(1, daysLeft)) * 100) / 100,
			daysToTarget: daysLeft
		}
	};
}

export function formatMrrReport(snapshot: MrrSnapshot): string {
	let out = `# 💰 TractionRank MRR Progress Report (${snapshot.window})\n\n`;
	out += `**Current MRR:** $${snapshot.totalMrrUsd.toLocaleString()} / $${snapshot.targetMrrUsd.toLocaleString()} (${snapshot.overallProgressPercent}%)\n`;
	out += `**Current ARR:** $${snapshot.totalArrUsd.toLocaleString()} / $${snapshot.targetArrUsd.toLocaleString()}\n`;
	out += `**Status:** ${snapshot.goalAchieved ? "🎯 GOAL ACHIEVED" : `⏳ GAP: $${snapshot.mrrGapUsd.toLocaleString()}`}\n\n`;

	out += `## Tier Breakdown\n\n`;
	out += `| Tier | Price | Active / Target Subs | Current MRR | Target MRR | Progress |\n`;
	out += `|---|---|---|---|---|---|\n`;
	for (const t of Object.values(snapshot.tiers)) {
		out += `| **${t.name}** | $${t.priceUsd}/mo | ${t.activeSubscribers} / ${t.targetSubscribers} | $${t.mrrUsd.toLocaleString()} | $${t.targetMrrUsd.toLocaleString()} | ${t.progressPercent}% |\n`;
	}

	out += `\n## Daily Conversion Pacing (Sprint: ${snapshot.dailyPacingRequired.daysToTarget} days)\n`;
	out += `- **Pro Subscriptions Needed:** ~${snapshot.dailyPacingRequired.proNewPerDay} signups / day\n`;
	out += `- **Sponsor Subscriptions Needed:** ~${snapshot.dailyPacingRequired.sponsorNewPerDay} bookings / day\n`;

	return out;
}
