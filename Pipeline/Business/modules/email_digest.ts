/**
 * Plugin/Business - TractionRank Pro Weekly Email Digest Generator
 *
 * Automatically generates weekly competitor intelligence and market breakout
 * alert emails for TractionRank Pro ($19/mo) and Category Sponsors ($99/mo).
 */

export type WeeklyMover = {
	domain: string;
	rank: number;
	delta_rank: number;
	visits: number;
	category: string;
};

export type WatchlistAlert = {
	domain: string;
	previousRank: number;
	currentRank: number;
	rankShift: number;
	direction: "UP" | "DOWN" | "STABLE";
	visits: number;
};

export type DigestOptions = {
	subscriberEmail: string;
	subscriberName?: string;
	window: string;
	watchlist?: string[];
	topMovers: WeeklyMover[];
	categoryHighlights?: Array<{ categoryName: string; leaderDomain: string; leaderVisits: number }>;
};

export type GeneratedDigest = {
	subject: string;
	markdown: string;
	html: string;
	moversCount: number;
	alertsCount: number;
};

function compact(v: number): string {
	if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
	if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
	if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
	return String(v);
}

export function generateProWeeklyDigest(options: DigestOptions): GeneratedDigest {
	const { subscriberName = "Founder", window, watchlist = [], topMovers } = options;

	const alerts: WatchlistAlert[] = [];
	for (const watchDomain of watchlist) {
		const mover = topMovers.find((m) => m.domain === watchDomain);
		if (mover) {
			const prev = mover.rank + mover.delta_rank;
			alerts.push({
				domain: watchDomain,
				previousRank: prev,
				currentRank: mover.rank,
				rankShift: Math.abs(mover.delta_rank),
				direction: mover.delta_rank > 0 ? "UP" : mover.delta_rank < 0 ? "DOWN" : "STABLE",
				visits: mover.visits
			});
		}
	}

	const top3 = topMovers.slice(0, 3);
	const subject = `⚡ TractionRank Weekly Digest: ${top3.map((m) => m.domain).join(", ")} surge in window ${window}`;

	let markdown = `# ⚡ TractionRank Pro Weekly Intelligence (${window})\n\n`;
	markdown += `Hi ${subscriberName},\n\n`;
	markdown += `Here is your weekly intelligence briefing on breakout AI products, competitor movements, and category traffic shifts across 2,454+ tracked websites.\n\n`;

	if (alerts.length > 0) {
		markdown += `## 🎯 Watchlist Alerts (${alerts.length})\n\n`;
		for (const a of alerts) {
			const icon = a.direction === "UP" ? "🚀" : a.direction === "DOWN" ? "🔻" : "➖";
			markdown += `- **${a.domain}**: ${icon} ${a.direction === "UP" ? "Surged" : "Dropped"} ${a.rankShift} spots (Now Rank #${a.currentRank}, ~${compact(a.visits)} visits/mo). [View Report](https://tractionrank.com/d/${a.domain})\n`;
		}
		markdown += `\n`;
	}

	markdown += `## 🚀 Top 5 Breakout AI Products This Week\n\n`;
	markdown += `| Rank | Product | Growth Velocity | Monthly Visits | Vertical |\n`;
	markdown += `|---:|---|---:|---:|---|\n`;
	for (const m of topMovers.slice(0, 5)) {
		markdown += `| #${m.rank} | [${m.domain}](https://tractionrank.com/d/${m.domain}) | ▲ ${m.delta_rank} spots | ${compact(m.visits)} | ${m.category} |\n`;
	}
	markdown += `\n`;

	markdown += `---\n\n`;
	markdown += `**TractionRank Pro Exclusive Features:**\n`;
	markdown += `- [Download Latest Raw CSV Export](https://tractionrank.com/pricing)\n`;
	markdown += `- [Compare Any 2 AI Products](https://tractionrank.com/compare)\n`;
	markdown += `- [Embed Your Dynamic Live SVG Badge](https://tractionrank.com/embed)\n\n`;
	markdown += `*You are receiving this because you are an active subscriber to TractionRank Pro ($19/mo).*`;

	const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0d10; color: #e8eaed; padding: 32px 20px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1c2128;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
    <span style="font-size: 24px;">⚡</span>
    <strong style="font-size: 20px; color: #ffffff;">TractionRank Pro Digest</strong>
    <span style="background: #172554; color: #93c5fd; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: auto;">${window}</span>
  </div>
  <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hi ${subscriberName}, here are the latest traffic shifts and breakout AI startups.</p>
  <h3 style="color: #60a5fa; font-size: 16px; border-bottom: 1px solid #1f242d; padding-bottom: 8px; margin-top: 24px;">🚀 Top Breakout AI Movers</h3>
  <ul style="padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
    ${topMovers.slice(0, 5).map((m) => `<li><a href="https://tractionrank.com/d/${m.domain}" style="color: #93c5fd; font-weight: 600; text-decoration: none;">${m.domain}</a>: <span style="color: #4ade80; font-weight: 600;">▲ ${m.delta_rank} spots</span> to #${m.rank} (~${compact(m.visits)} visits)</li>`).join("\n    ")}
  </ul>
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #1f242d; text-align: center;">
    <a href="https://tractionrank.com/board" style="background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 14px;">Browse Full AI Board →</a>
  </div>
</div>`;

	return {
		subject,
		markdown,
		html,
		moversCount: topMovers.length,
		alertsCount: alerts.length
	};
}
