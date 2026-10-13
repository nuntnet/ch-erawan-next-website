import { describe, it, expect } from "vitest";
import { organizationGraph } from "@/lib/seo/organization";
import { localBusinessGraph } from "@/lib/seo/local-business";
import { getSiteFaq } from "@/lib/brandFaq";
import { branches } from "@/lib/branchData";
import { BRANDS } from "@/lib/brandConfig";

describe("site-wide SEO data", () => {
  it("Organization and AutoDealer carry the HQ street address", () => {
    const graph = organizationGraph();
    const nodes = (graph["@graph"] ?? []) as { address?: { streetAddress?: string; postalCode?: string } }[];
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    for (const n of nodes) {
      expect(n.address?.streetAddress).toContain("75/2");
      expect(n.address?.postalCode).toBe("73000");
    }
  });

  it("branch JSON-LD uses the public name (Changan Deepal) while the internal name is untouched", () => {
    const deepal = branches.find((b) => b.id === "deepal-salaya")!;
    expect(deepal.name).toBe("Deepal ช.เอราวัณ ศาลายา"); // key for booking/SPS/email routing
    const names = (localBusinessGraph()["@graph"] as { name: string }[]).map((n) => n.name);
    expect(names).toContain("Changan Deepal ช.เอราวัณ ศาลายา");
    expect(names).not.toContain("Deepal ช.เอราวัณ ศาลายา");
  });

  it("home FAQ counts come from data", () => {
    const faq = getSiteFaq();
    expect(faq[0].answer).toContain(`${BRANDS.length} แบรนด์`);
    expect(faq[1].answer).toContain(`${branches.length} สาขา`);
    expect(faq[1].answer).toContain("GEELY ช.เอราวัณ รัชดา");
  });
});
