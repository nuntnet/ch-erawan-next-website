import { describe, it, expect } from "vitest";
import { GEELY_MODELS, geelyStartingPrice, geelyFaq } from "@/lib/geelyModels";

describe("geelyModels", () => {
  it("lists EX2, EX5 and STARRAY EM-R", () => {
    expect(GEELY_MODELS.map((m) => m.name)).toEqual(["EX2", "EX5", "STARRAY EM-R"]);
  });

  it("starting price is the cheapest trim", () => {
    const ex5 = GEELY_MODELS.find((m) => m.slug === "ex5")!;
    expect(geelyStartingPrice(ex5)).toBe(799_000);
    expect(ex5.trims.map((t) => t.msrp)).toEqual([799_000, 899_000, 929_000, 939_000]);
  });

  it("FAQ answers include the Ratchada address and opening date", () => {
    const faq = geelyFaq();
    expect(faq[0].answer).toContain("161 ถนนรัชดาภิเษก");
    expect(faq[1].answer).toContain("1 ตุลาคม 2569");
  });
});

import { carToGeelyModel, modelSlugFromCarSlug, parseTrims } from "@/lib/geelyModels";
import type { Car } from "@/lib/notion-types";

const car = (over: Partial<Car>): Car => ({
  id: "page-1", name: "GEELY EX5", brand: "Geely", model: "EX5", year: 2026, type: "suv", condition: "new",
  priceMin: 799000, priceMax: 929000, engineSize: "Electric", transmission: "auto", fuelType: "electric",
  description: "SUV ไฟฟ้า\nบรรทัดสอง", specs: {}, imageUrls: [], videoUrl: null, isActive: true, isBestSeller: false,
  sortOrder: 0, navFeatured: false, navNew: false, slug: "geely-ex5-2026", ...over,
});

describe("Notion → Geely model mapping", () => {
  it("shortens car slugs for URLs", () => {
    expect(modelSlugFromCarSlug("geely-ex5-2026")).toBe("ex5");
    expect(modelSlugFromCarSlug("geely-starray-em-r-2026")).toBe("starray-em-r");
    expect(modelSlugFromCarSlug("ex2")).toBe("ex2");
  });

  it("parses trims from Specs in both formats", () => {
    expect(parseTrims({ trims: ["PRO|429990", "MAX: 459,990"] })).toEqual([
      { name: "PRO", msrp: 429990 },
      { name: "MAX", msrp: 459990 },
    ]);
    expect(parseTrims({})).toEqual([]);
    expect(parseTrims({ trims: ["broken"] })).toEqual([]);
  });

  it("maps a Notion car: trims from specs, else a single price from Price Min", () => {
    const withTrims = carToGeelyModel(car({ specs: { trims: ["PRO|799000", "MAX|899000"] } }));
    expect(withTrims.slug).toBe("ex5");
    expect(withTrims.name).toBe("EX5");
    expect(withTrims.summary).toBe("SUV ไฟฟ้า");
    expect(withTrims.trims).toHaveLength(2);

    const priceOnly = carToGeelyModel(car({ model: "", name: "GEELY EX2", slug: "geely-ex2-2026" }));
    expect(priceOnly.name).toBe("EX2");
    expect(priceOnly.trims).toEqual([{ name: "ราคาเริ่มต้น", msrp: 799000 }]);
  });

  it("uses the first Notion image; png/webp are treated as renders", () => {
    expect(carToGeelyModel(car({ imageUrls: ["https://x.test/a.webp"] })).image.kind).toBe("render");
    expect(carToGeelyModel(car({ imageUrls: ["https://x.test/a.jpg"] })).image.kind).toBe("photo");
  });

  it("has no price UI data when neither trims nor Price Min exist", () => {
    const m = carToGeelyModel(car({ priceMin: 0 }));
    expect(m.trims).toEqual([]);
    expect(geelyStartingPrice(m)).toBe(0);
  });
});
