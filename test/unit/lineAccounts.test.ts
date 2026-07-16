import { describe, it, expect } from "vitest";
import { brandFromLineUrl } from "@/lib/lineAccounts";

describe("brandFromLineUrl", () => {
  it("resolves lin.ee short links to their brand", () => {
    expect(brandFromLineUrl("https://lin.ee/NLeKZy6")).toBe("Mazda");
    expect(brandFromLineUrl("https://lin.ee/vK6Z54v")).toBe("Deepal");
    expect(brandFromLineUrl("https://lin.ee/PhIWeTl")).toBe("Ford");
    expect(brandFromLineUrl("https://lin.ee/xKFaZcUG")).toBe("GWM");
    expect(brandFromLineUrl("https://lin.ee/XQiajzI")).toBe("Kia");
  });

  it("resolves line.me/@handle links to their brand", () => {
    expect(brandFromLineUrl("https://line.me/R/ti/p/@mitsuch.erawan")).toBe("Mitsubishi");
    expect(brandFromLineUrl("https://line.me/R/ti/p/@kiach.erawan")).toBe("Kia");
  });

  it("maps the shared Mitsubishi account (also used by GAC/Lepas) to Mitsubishi", () => {
    expect(brandFromLineUrl("https://lin.ee/N7UjCTE")).toBe("Mitsubishi");
  });

  it("returns null for an unrecognized LINE URL", () => {
    expect(brandFromLineUrl("https://lin.ee/qDzqmdn")).toBeNull();
    expect(brandFromLineUrl("https://line.me/R/somethingelse")).toBeNull();
  });
});
