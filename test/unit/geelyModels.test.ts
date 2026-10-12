import { describe, it, expect } from "vitest";
import { GEELY_MODELS, geelyStartingPrice, geelyFaq } from "@/lib/geelyModels";

describe("geelyModels", () => {
  it("lists EX2, EX5 and STARRAY EM-R", () => {
    expect(GEELY_MODELS.map((m) => m.name)).toEqual(["EX2", "EX5", "STARRAY EM-R"]);
  });

  it("starting price is the cheapest trim", () => {
    const ex5 = GEELY_MODELS.find((m) => m.slug === "ex5")!;
    expect(geelyStartingPrice(ex5)).toBe(799_000);
  });

  it("FAQ answers include the Ratchada address and opening date", () => {
    const faq = geelyFaq();
    expect(faq[0].answer).toContain("161 ถนนรัชดาภิเษก");
    expect(faq[1].answer).toContain("1 ตุลาคม 2569");
  });
});
