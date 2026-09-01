/**
 * MentalCraft company-line growth: five-pillar audit and $10,000 MRR mix.
 *
 * Distinct from Essay MAXED_OUT tables and SpriteFlow 420×$19 defaults.
 * Scores and MRR are computed from MentalCraft inputs (price × subscribers, funnel volumes).
 */

export const MENTALCRAFT_PRODUCT = "MentalCraft";
export const MENTALCRAFT_DOMAIN = "mentalcraft.org";

export const MENTALCRAFT_PILLAR_SEO = "SEO";
export const MENTALCRAFT_PILLAR_LLMO = "LLMO";
export const MENTALCRAFT_PILLAR_EEAT = "EEAT";
export const MENTALCRAFT_PILLAR_UX = "用户体验";
export const MENTALCRAFT_PILLAR_FUNNEL = "转化漏斗";
export const MENTALCRAFT_UX_ALIAS = "UX";
export const MENTALCRAFT_FUNNEL_ALIAS = "Conversion Funnel";

export const MENTALCRAFT_EEAT_EXPERIENCE = "Experience";
export const MENTALCRAFT_EEAT_EXPERTISE = "Expertise";
export const MENTALCRAFT_EEAT_AUTHORITATIVENESS = "Authoritativeness";
export const MENTALCRAFT_EEAT_TRUSTWORTHINESS = "Trustworthiness";

export const MENTALCRAFT_PRACTITIONER_PRICE_USD = 29;
export const MENTALCRAFT_PRACTITIONER_SUBSCRIBERS = 250;
export const MENTALCRAFT_REPORT_PRICE_USD = 9.9;
export const MENTALCRAFT_REPORT_SUBSCRIBERS = 300;

export type MentalCraftSubjectInput = {
  productName?: string;
  domain?: string;
  ventureName?: string;
};

export function isMentalCraftSubject(input: MentalCraftSubjectInput): boolean {
  const blob = `${input.productName ?? ""} ${input.domain ?? ""} ${input.ventureName ?? ""}`;
  return /mentalcraft/i.test(blob);
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export type MentalCraftFivePillarInput = MentalCraftSubjectInput & {
  indexedPages?: number;
  keywordDifficultyMedian?: number;
  llmsTxtPresent?: boolean;
  entityTriples?: number;
  firstHandCaseStudies?: number;
  researcherDisclosures?: number;
  citationAnchors?: number;
  privacyPolicyPublished?: boolean;
  informedConsentOptIn?: boolean;
  crisisHotlineUnblocked?: boolean;
  viewportCoverage?: number;
  loafMs?: number;
  seoVisitors?: number;
  llmoVisitors?: number;
  landingVisitors?: number;
  trialStarts?: number;
  paidConversions?: number;
  leakRecoveryRate?: number;
};

export type MentalCraftEeatDimension = {
  name: typeof MENTALCRAFT_EEAT_EXPERIENCE | typeof MENTALCRAFT_EEAT_EXPERTISE | typeof MENTALCRAFT_EEAT_AUTHORITATIVENESS | typeof MENTALCRAFT_EEAT_TRUSTWORTHINESS;
  score: number;
  firstHand?: boolean;
  evidence: string;
};

export type MentalCraftFunnelStage = {
  order: number;
  name: string;
  visitors: number;
  conversionPercent: number;
};

export type MentalCraftFivePillarResult = {
  timestamp: string;
  productName: string;
  domain: string;
  pillars: [
    { name: typeof MENTALCRAFT_PILLAR_SEO; score: number; status: string },
    { name: typeof MENTALCRAFT_PILLAR_LLMO; score: number; status: string },
    {
      name: typeof MENTALCRAFT_PILLAR_EEAT;
      score: number;
      status: string;
      eeatDimensions: {
        Experience: MentalCraftEeatDimension;
        Expertise: MentalCraftEeatDimension;
        Authoritativeness: MentalCraftEeatDimension;
        Trustworthiness: MentalCraftEeatDimension;
      };
    },
    { name: typeof MENTALCRAFT_PILLAR_UX; alias: typeof MENTALCRAFT_UX_ALIAS; score: number; status: string },
    {
      name: typeof MENTALCRAFT_PILLAR_FUNNEL;
      alias: typeof MENTALCRAFT_FUNNEL_ALIAS;
      score: number;
      status: string;
      stages: MentalCraftFunnelStage[];
      conversionRatePercent: number;
      leakPercent: number;
      recoveredMrrUsd: number;
    },
  ];
};

export function resolveMentalCraftFivePillarInput(input: MentalCraftFivePillarInput = {}): Required<Omit<MentalCraftFivePillarInput, keyof MentalCraftSubjectInput>> & {
  productName: string;
  domain: string;
} {
  return {
    productName: input.productName?.trim() || MENTALCRAFT_PRODUCT,
    domain: input.domain?.trim() || MENTALCRAFT_DOMAIN,
    indexedPages: input.indexedPages ?? 36,
    keywordDifficultyMedian: input.keywordDifficultyMedian ?? 28,
    llmsTxtPresent: input.llmsTxtPresent ?? true,
    entityTriples: input.entityTriples ?? 24,
    firstHandCaseStudies: input.firstHandCaseStudies ?? 4,
    researcherDisclosures: input.researcherDisclosures ?? 3,
    citationAnchors: input.citationAnchors ?? 6,
    privacyPolicyPublished: input.privacyPolicyPublished ?? true,
    informedConsentOptIn: input.informedConsentOptIn ?? true,
    crisisHotlineUnblocked: input.crisisHotlineUnblocked ?? true,
    viewportCoverage: input.viewportCoverage ?? 8,
    loafMs: input.loafMs ?? 40,
    seoVisitors: input.seoVisitors ?? 8000,
    llmoVisitors: input.llmoVisitors ?? 2500,
    landingVisitors: input.landingVisitors ?? 4200,
    trialStarts: input.trialStarts ?? 1800,
    paidConversions: input.paidConversions ?? MENTALCRAFT_PRACTITIONER_SUBSCRIBERS + MENTALCRAFT_REPORT_SUBSCRIBERS,
    leakRecoveryRate: input.leakRecoveryRate ?? 0.12,
  };
}

export function scoreMentalCraftSeo(indexedPages: number, keywordDifficultyMedian: number): number {
  return clampScore(38 + indexedPages * 0.9 + Math.max(0, 45 - keywordDifficultyMedian));
}

export function scoreMentalCraftLlmo(llmsTxtPresent: boolean, entityTriples: number): number {
  return clampScore((llmsTxtPresent ? 42 : 8) + entityTriples * 1.8);
}

export function scoreMentalCraftUx(viewportCoverage: number, loafMs: number): number {
  const viewport = Math.min(8, Math.max(0, viewportCoverage)) * 8;
  const motion = Math.max(0, 40 - loafMs);
  return clampScore(28 + viewport + motion);
}

export function computeMentalCraftEeatDimensions(input: Required<Omit<MentalCraftFivePillarInput, keyof MentalCraftSubjectInput>>): {
  Experience: MentalCraftEeatDimension;
  Expertise: MentalCraftEeatDimension;
  Authoritativeness: MentalCraftEeatDimension;
  Trustworthiness: MentalCraftEeatDimension;
} {
  const firstHand = input.firstHandCaseStudies > 0;
  return {
    Experience: {
      name: MENTALCRAFT_EEAT_EXPERIENCE,
      firstHand,
      score: clampScore(58 + input.firstHandCaseStudies * 8),
      evidence: "Practitioner workbench and in-depth parenting diagnostic reports as first-hand clinical workflow evidence.",
    },
    Expertise: {
      name: MENTALCRAFT_EEAT_EXPERTISE,
      score: clampScore(52 + input.researcherDisclosures * 12),
      evidence: "Psychometric scale disclosures (GAD-7, PHQ-9) authored with computational social science methods.",
    },
    Authoritativeness: {
      name: MENTALCRAFT_EEAT_AUTHORITATIVENESS,
      score: clampScore(48 + input.citationAnchors * 7),
      evidence: "Citation anchors to validated screening instruments and dual-flywheel academic publications.",
    },
    Trustworthiness: {
      name: MENTALCRAFT_EEAT_TRUSTWORTHINESS,
      score: clampScore(
        (input.privacyPolicyPublished ? 32 : 0)
        + (input.informedConsentOptIn ? 34 : 0)
        + (input.crisisHotlineUnblocked ? 34 : 0),
      ),
      evidence: "IRB informed-consent opt-in, de-identified stores, and crisis hotline access that paywalls cannot block.",
    },
  };
}

export function computeMentalCraftFunnel(input: Required<Omit<MentalCraftFivePillarInput, keyof MentalCraftSubjectInput>>, blendedArpuUsd: number): {
  stages: MentalCraftFunnelStage[];
  conversionRatePercent: number;
  leakPercent: number;
  recoveredMrrUsd: number;
  score: number;
} {
  const acquisition = input.seoVisitors + input.llmoVisitors;
  const landing = Math.min(input.landingVisitors, acquisition);
  const trial = Math.min(input.trialStarts, landing);
  const paid = Math.min(input.paidConversions, trial);

  const stageConversion = (from: number, to: number) => (from <= 0 ? 0 : roundMoney((to / from) * 100));

  const stages: MentalCraftFunnelStage[] = [
    { order: 1, name: "SEO discovery", visitors: input.seoVisitors, conversionPercent: stageConversion(acquisition, input.seoVisitors) },
    { order: 2, name: "LLMO acquisition", visitors: input.llmoVisitors, conversionPercent: stageConversion(acquisition, input.llmoVisitors) },
    { order: 3, name: "Workbench trial", visitors: trial, conversionPercent: stageConversion(landing, trial) },
    { order: 4, name: "Paid conversion", visitors: paid, conversionPercent: stageConversion(trial, paid) },
  ];

  const conversionRatePercent = stageConversion(acquisition, paid);
  const leakPercent = roundMoney(100 - stageConversion(trial, paid));
  const leakedTrials = Math.max(0, trial - paid);
  const recoveredMrrUsd = roundMoney(leakedTrials * input.leakRecoveryRate * blendedArpuUsd);
  const score = clampScore(conversionRatePercent * 8 + (100 - leakPercent) * 0.35);

  return { stages, conversionRatePercent, leakPercent, recoveredMrrUsd, score };
}

export function auditMentalCraftFivePillars(input: MentalCraftFivePillarInput = {}): MentalCraftFivePillarResult {
  const resolved = resolveMentalCraftFivePillarInput(input);
  const eeatDimensions = computeMentalCraftEeatDimensions(resolved);
  const eeatScore = clampScore(
    (eeatDimensions.Experience.score
      + eeatDimensions.Expertise.score
      + eeatDimensions.Authoritativeness.score
      + eeatDimensions.Trustworthiness.score) / 4,
  );
  const mrr = computeMentalCraftMrr({
    ventureName: resolved.productName,
    domain: resolved.domain,
  });
  const funnel = computeMentalCraftFunnel(resolved, mrr.blendedArpuUsd);
  const seoScore = scoreMentalCraftSeo(resolved.indexedPages, resolved.keywordDifficultyMedian);
  const llmoScore = scoreMentalCraftLlmo(resolved.llmsTxtPresent, resolved.entityTriples);
  const uxScore = scoreMentalCraftUx(resolved.viewportCoverage, resolved.loafMs);
  const statusFor = (score: number) => (score >= 80 ? "healthy" : score >= 60 ? "watch" : "weak");

  return {
    timestamp: new Date().toISOString(),
    productName: resolved.productName,
    domain: resolved.domain,
    pillars: [
      { name: MENTALCRAFT_PILLAR_SEO, score: seoScore, status: statusFor(seoScore) },
      { name: MENTALCRAFT_PILLAR_LLMO, score: llmoScore, status: statusFor(llmoScore) },
      { name: MENTALCRAFT_PILLAR_EEAT, score: eeatScore, status: statusFor(eeatScore), eeatDimensions },
      { name: MENTALCRAFT_PILLAR_UX, alias: MENTALCRAFT_UX_ALIAS, score: uxScore, status: statusFor(uxScore) },
      {
        name: MENTALCRAFT_PILLAR_FUNNEL,
        alias: MENTALCRAFT_FUNNEL_ALIAS,
        score: funnel.score,
        status: statusFor(funnel.score),
        stages: funnel.stages,
        conversionRatePercent: funnel.conversionRatePercent,
        leakPercent: funnel.leakPercent,
        recoveredMrrUsd: funnel.recoveredMrrUsd,
      },
    ],
  };
}

export function auditMentalCraftEeat(input: MentalCraftFivePillarInput = {}) {
  const audit = auditMentalCraftFivePillars(input);
  const eeat = audit.pillars[2];
  return {
    timestamp: audit.timestamp,
    productName: audit.productName,
    domain: audit.domain,
    overallEeatScore: eeat.score,
    dimensions: {
      Experience: eeat.eeatDimensions.Experience,
      Expertise: eeat.eeatDimensions.Expertise,
      Authoritativeness: eeat.eeatDimensions.Authoritativeness,
      Trustworthiness: eeat.eeatDimensions.Trustworthiness,
    },
  };
}

export type MentalCraftCohort = {
  name: string;
  priceUsd: number;
  subscribers: number;
  mrrUsd: number;
};

export type MentalCraftMrrInput = MentalCraftSubjectInput & {
  practitionerPriceUsd?: number;
  practitionerSubscribers?: number;
  reportPriceUsd?: number;
  reportSubscribers?: number;
};

export type MentalCraftMrrResult = {
  timestamp: string;
  ventureName: string;
  domain: string;
  mix: "MentalCraft";
  cohorts: MentalCraftCohort[];
  totalMrrUsd: number;
  blendedArpuUsd: number;
  targetMrrUsd: 10000;
  meetsTarget: boolean;
};

export function computeMentalCraftMrr(input: MentalCraftMrrInput = {}): MentalCraftMrrResult {
  const practitionerPriceUsd = input.practitionerPriceUsd ?? MENTALCRAFT_PRACTITIONER_PRICE_USD;
  const practitionerSubscribers = input.practitionerSubscribers ?? MENTALCRAFT_PRACTITIONER_SUBSCRIBERS;
  const reportPriceUsd = input.reportPriceUsd ?? MENTALCRAFT_REPORT_PRICE_USD;
  const reportSubscribers = input.reportSubscribers ?? MENTALCRAFT_REPORT_SUBSCRIBERS;

  const cohorts: MentalCraftCohort[] = [
    {
      name: "Practitioner Pro",
      priceUsd: practitionerPriceUsd,
      subscribers: practitionerSubscribers,
      mrrUsd: roundMoney(practitionerPriceUsd * practitionerSubscribers),
    },
    {
      name: "In-Depth Reports",
      priceUsd: reportPriceUsd,
      subscribers: reportSubscribers,
      mrrUsd: roundMoney(reportPriceUsd * reportSubscribers),
    },
  ];

  const totalMrrUsd = roundMoney(cohorts.reduce((sum, cohort) => sum + cohort.mrrUsd, 0));
  const totalSubscribers = cohorts.reduce((sum, cohort) => sum + cohort.subscribers, 0);
  const blendedArpuUsd = totalSubscribers === 0 ? 0 : roundMoney(totalMrrUsd / totalSubscribers);

  return {
    timestamp: new Date().toISOString(),
    ventureName: input.ventureName?.trim() || MENTALCRAFT_PRODUCT,
    domain: input.domain?.trim() || MENTALCRAFT_DOMAIN,
    mix: "MentalCraft",
    cohorts,
    totalMrrUsd,
    blendedArpuUsd,
    targetMrrUsd: 10000,
    meetsTarget: totalMrrUsd >= 10000,
  };
}
