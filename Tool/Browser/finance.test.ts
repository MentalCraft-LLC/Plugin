import { describe, expect, test } from "bun:test";
import { requiresFinancialConfirmation } from "./modules/finance.ts";

describe("financial confirmation boundary", () => {
  test("blocks likely money-moving controls and allows ordinary controls", () => {
    expect(requiresFinancialConfirmation("click", "https://shop.example/checkout", ["Place order"])).toBe(true);
    expect(requiresFinancialConfirmation("click", "https://example.com/settings", ["Save"])).toBe(false);
    expect(requiresFinancialConfirmation("fill_public", "https://example.com/profile", ["Display name"])).toBe(false);
    expect(requiresFinancialConfirmation("open", "https://shop.example/checkout", [])).toBe(false);
  });
});
