import { describe, expect, test } from "bun:test";
import { businessOperation } from "./operation.ts";

describe("MentalCraft five-pillar path and 10000MRR mix", () => {
  test("five-pillar audit names SEO, LLMO, EEAT, 用户体验, 转化漏斗 with independent EEAT dimensions and an ordered funnel", async () => {
    const res = await businessOperation({
      action: "product_fullstack_excellence_audit",
      product_name: "MentalCraft",
      domain: "mentalcraft.org",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    const pillarNames = data.pillars.map((pillar: { name: string }) => pillar.name);
    expect(pillarNames).toEqual(["SEO", "LLMO", "EEAT", "用户体验", "转化漏斗"]);
    expect(data.pillars[3].alias).toBe("UX");
    expect(data.pillars[4].alias).toBe("Conversion Funnel");

    const eeat = data.pillars.find((pillar: { name: string }) => pillar.name === "EEAT");
    expect(eeat.eeatDimensions.Experience.name).toBe("Experience");
    expect(eeat.eeatDimensions.Experience.firstHand).toBe(true);
    expect(eeat.eeatDimensions.Expertise.name).toBe("Expertise");
    expect(eeat.eeatDimensions.Authoritativeness.name).toBe("Authoritativeness");
    expect(eeat.eeatDimensions.Trustworthiness.name).toBe("Trustworthiness");
    expect(typeof eeat.eeatDimensions.Experience.score).toBe("number");
    expect(typeof eeat.eeatDimensions.Expertise.score).toBe("number");
    expect(typeof eeat.eeatDimensions.Authoritativeness.score).toBe("number");
    expect(typeof eeat.eeatDimensions.Trustworthiness.score).toBe("number");

    const funnel = data.pillars.find((pillar: { name: string }) => pillar.name === "转化漏斗");
    expect(funnel.stages.map((stage: { order: number }) => stage.order)).toEqual([1, 2, 3, 4]);
    expect(funnel.stages[0].name).toContain("SEO");
    expect(funnel.stages[1].name).toContain("LLMO");
    expect(funnel.stages[3].name).toContain("Paid");
    expect(typeof funnel.conversionRatePercent).toBe("number");
    expect(typeof funnel.leakPercent).toBe("number");
    expect(typeof funnel.recoveredMrrUsd).toBe("number");
  });

  test("EEAT audit on MentalCraft reports Experience, Expertise, Authoritativeness, Trustworthiness independently", async () => {
    const res = await businessOperation({
      action: "product_eeat_audit",
      product_name: "MentalCraft",
      domain: "mentalcraft.org",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.dimensions.Experience.name).toBe("Experience");
    expect(data.dimensions.Experience.firstHand).toBe(true);
    expect(data.dimensions.Expertise.name).toBe("Expertise");
    expect(data.dimensions.Authoritativeness.name).toBe("Authoritativeness");
    expect(data.dimensions.Trustworthiness.name).toBe("Trustworthiness");
  });

  test("MentalCraft 10000MRR is price × subscribers on Practitioner Pro and Clinic", async () => {
    const res = await businessOperation({
      action: "company_mrr_engine",
      venture_name: "MentalCraft",
      domain: "mentalcraft.org",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.mix).toBe("MentalCraft");
    expect(data.cohorts.length).toBe(2);
    const recomputed = data.cohorts.reduce(
      (sum: number, cohort: { priceUsd: number; subscribers: number }) => sum + cohort.priceUsd * cohort.subscribers,
      0,
    );
    expect(data.totalMrrUsd).toBe(recomputed);
    expect(data.totalMrrUsd).toBeGreaterThanOrEqual(10000);
    expect(data.meetsTarget).toBe(true);
  });

  test("MentalCraft MRR arithmetic follows supplied prices and subscriber counts", async () => {
    const res = await businessOperation({
      action: "company_mrr_engine",
      venture_name: "MentalCraft",
      domain: "mentalcraft.org",
      practitioner_price: 40,
      practitioner_subscribers: 200,
      report_price: 10,
      report_subscribers: 250,
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.cohorts[0].mrrUsd).toBe(40 * 200);
    expect(data.cohorts[1].mrrUsd).toBe(10 * 250);
    expect(data.totalMrrUsd).toBe(40 * 200 + 10 * 250);
  });

  test("SEO pillar score rises when MentalCraft indexed pages increase", async () => {
    const sparse = await businessOperation({
      action: "product_fullstack_excellence_audit",
      product_name: "MentalCraft",
      domain: "mentalcraft.org",
      indexed_pages: 8,
    });
    const dense = await businessOperation({
      action: "product_fullstack_excellence_audit",
      product_name: "MentalCraft",
      domain: "mentalcraft.org",
      indexed_pages: 80,
    });
    const sparseSeo = (sparse.data as any).pillars.find((pillar: { name: string }) => pillar.name === "SEO").score;
    const denseSeo = (dense.data as any).pillars.find((pillar: { name: string }) => pillar.name === "SEO").score;
    expect(denseSeo).toBeGreaterThan(sparseSeo);
  });
});
