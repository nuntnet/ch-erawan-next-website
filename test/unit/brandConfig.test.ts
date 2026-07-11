import { describe, it, expect } from "vitest";
import {
  matchCarToGwmLine,
  matchCarToLine,
  legacyBrandQueryToPath,
  isBrandSlug,
  isGwmLineSlug,
  BRAND_BY_SLUG,
} from "@/lib/brandConfig";
import type { Car } from "@/lib/notion-types";

const gwmCar = (model: string): Car =>
  ({
    id: "1",
    brand: "GWM",
    model,
    name: model,
    year: 2024,
    type: "suv",
    condition: "new",
    priceMin: 0,
    priceMax: 0,
    engineSize: "",
    transmission: "auto",
    fuelType: "hybrid",
    description: "",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 0,
    navFeatured: false,
    navNew: false,
    slug: "test",
  }) as Car;

describe("brandConfig", () => {
  it("recognizes valid brand slugs", () => {
    expect(isBrandSlug("mazda")).toBe(true);
    expect(isBrandSlug("about")).toBe(false);
  });

  it("recognizes GWM line slugs", () => {
    expect(isGwmLineSlug("haval")).toBe(true);
    expect(isGwmLineSlug("HAVAL")).toBe(false);
  });

  it("maps legacy query brand values to hub paths", () => {
    expect(legacyBrandQueryToPath("Mazda")).toBe("/mazda");
    expect(legacyBrandQueryToPath("HAVAL")).toBe("/gwm/haval");
    expect(legacyBrandQueryToPath("haval")).toBe("/gwm/haval");
    expect(legacyBrandQueryToPath("Unknown")).toBeNull();
  });

  it("matches GWM cars by model prefix", () => {
    expect(matchCarToGwmLine(gwmCar("HAVAL H6 HEV"), "haval")).toBe(true);
    expect(matchCarToGwmLine(gwmCar("ORA Good Cat"), "ora")).toBe(true);
    expect(matchCarToGwmLine(gwmCar("TANK 300"), "tank")).toBe(true);
    expect(matchCarToGwmLine(gwmCar("HAVAL H6"), "ora")).toBe(false);
  });

  it("exposes hub paths for all eight brands", () => {
    expect(Object.keys(BRAND_BY_SLUG)).toHaveLength(8);
    expect(BRAND_BY_SLUG.mazda.hubPath).toBe("/mazda");
    expect(BRAND_BY_SLUG.gwm.subLines).toHaveLength(4);
  });

  it("uses correct Thai spelling for Deepal", () => {
    expect(BRAND_BY_SLUG.deepal.displayNameTh).toBe("ดีพอล");
    expect(BRAND_BY_SLUG.deepal.heroBgImage).toBeTruthy();
    expect(BRAND_BY_SLUG.deepal.logoLightPath).toBe("/brands/deepal-light.svg");
  });

  it("keeps static featuredModels as nav fallback with valid slugs", () => {
    for (const brand of Object.values(BRAND_BY_SLUG)) {
      expect(brand.featuredModels?.length).toBeGreaterThanOrEqual(2);
      for (const model of brand.featuredModels ?? []) {
        expect(model.slug).toMatch(/^[\w-]+$/);
        expect(model.name.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("matchCarToLine (generic)", () => {
  it("matches GWM cars via the generic matcher identically to matchCarToGwmLine", () => {
    const car = gwmCar("HAVAL H6 HEV");
    const gwm = BRAND_BY_SLUG.gwm;
    const havalLine = gwm.subLines!.find((l) => l.slug === "haval")!;
    expect(matchCarToLine(car, gwm, havalLine)).toBe(true);
  });

  it("rejects a car from a different brand even if model prefix matches", () => {
    const car = gwmCar("HAVAL H6 HEV");
    const notGwm = { ...BRAND_BY_SLUG.mazda };
    const havalLine = BRAND_BY_SLUG.gwm.subLines!.find((l) => l.slug === "haval")!;
    expect(matchCarToLine(car, notGwm, havalLine)).toBe(false);
  });
});

describe("GAC and Lepas brand entries", () => {
  it("registers GAC with three sub-lines", () => {
    const gac = BRAND_BY_SLUG.gac;
    expect(gac.notionBrand).toBe("GAC");
    expect(gac.hubPath).toBe("/gac");
    expect(gac.subLines?.map((l) => l.slug).sort()).toEqual(["aion", "hyptec", "motor"]);
  });

  it("registers Lepas with no sub-lines", () => {
    const lepas = BRAND_BY_SLUG.lepas;
    expect(lepas.notionBrand).toBe("Lepas");
    expect(lepas.hubPath).toBe("/lepas");
    expect(lepas.subLines).toBeUndefined();
  });

  it("matches GAC cars to the correct sub-line by model prefix", () => {
    const aionCar = { ...gwmCar("AION Y Plus"), brand: "GAC" } as Car;
    const gac = BRAND_BY_SLUG.gac;
    const aionLine = gac.subLines!.find((l) => l.slug === "aion")!;
    const hyptecLine = gac.subLines!.find((l) => l.slug === "hyptec")!;
    expect(matchCarToLine(aionCar, gac, aionLine)).toBe(true);
    expect(matchCarToLine(aionCar, gac, hyptecLine)).toBe(false);
  });
});
