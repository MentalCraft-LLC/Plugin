/**
 * Plugin/Business - Radar Intelligence Contract Tests
 */

import { describe, it, expect } from "bun:test";
import { businessOperation } from "./operation.ts";

describe("Plugin/Business Radar Intelligence Actions", () => {
  it("executes business_radar_portfolio to reverse lookup webmaster sites", async () => {
    const result = await businessOperation({
      action: "business_radar_portfolio",
      domain: "sitedata.example.com",
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("business_radar_portfolio");
    expect(result.provider).toBe("radar");
    const data = result.data as any;
    expect(data.clusterCount).toBeGreaterThanOrEqual(2);
    expect(data.sharedIdentifiers.adsensePubId).toBe("pub-8472910482910481");
  });

  it("executes business_radar_ads to inspect active ad creatives and flag winning ads", async () => {
    const result = await businessOperation({
      action: "business_radar_ads",
      domain: "saascraft.io",
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("business_radar_ads");
    const data = result.data as any;
    expect(data.totalActiveCreatives).toBeGreaterThanOrEqual(3);
    expect(data.winningCreativesCount).toBeGreaterThanOrEqual(2);
  });

  it("executes business_radar_stack to inspect monetization networks and tracking scripts", async () => {
    const mockHtml = `
      <html>
        <head>
          <script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9988776655443322"></script>
        </head>
        <body>
          <a href="https://amazon.com?tag=outdoorgear-20">Link</a>
        </body>
      </html>
    `;

    const result = await businessOperation({
      action: "business_radar_stack",
      domain: "outdoorliving.com",
      html: mockHtml,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("business_radar_stack");
    const data = result.data as any;
    expect(data.adNetworks).toContain("Google AdSense");
    expect(data.affiliateTags).toContain("outdoorgear-20");
    expect(data.primaryPublisherId).toBe("ca-pub-9988776655443322");
  });
});
