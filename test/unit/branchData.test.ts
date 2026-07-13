import { describe, it, expect } from "vitest";
import { getBranchById } from "@/lib/branchData";

describe("branchData — GAC/Lepas", () => {
  it("adds GAC Nakhon Pathom co-located with Mitsubishi, not yet open", () => {
    const gac = getBranchById("gac-nakhonpathom");
    const mitsu = getBranchById("mitsubishi-nakhonpathom");
    expect(gac).toBeDefined();
    expect(gac!.brand).toBe("GAC");
    expect(gac!.companyName).toBe("บริษัท ช.เอราวัณ เนกซ์ จำกัด");
    expect(gac!.phone).toBe("034-300-333");
    expect(gac!.openingDate).toBe("ตุลาคม 2569");
    expect(gac!.lat).toBe(mitsu!.lat);
    expect(gac!.lng).toBe(mitsu!.lng);
    expect(gac!.address).toBe(mitsu!.address);
  });

  it("adds Lepas Nakhon Pathom co-located with Mitsubishi, not yet open", () => {
    const lepas = getBranchById("lepas-nakhonpathom");
    const mitsu = getBranchById("mitsubishi-nakhonpathom");
    expect(lepas).toBeDefined();
    expect(lepas!.brand).toBe("Lepas");
    expect(lepas!.companyName).toBe("บริษัท ช.เอราวัณ เนกซ์ จำกัด");
    expect(lepas!.phone).toBe("034-300-333");
    expect(lepas!.openingDate).toBe("ตุลาคม 2569");
    expect(lepas!.lat).toBe(mitsu!.lat);
    expect(lepas!.lng).toBe(mitsu!.lng);
  });

  it("existing branches have no openingDate (still-open stores)", () => {
    const mazda = getBranchById("mazda-nakhonpathom");
    expect(mazda!.openingDate).toBeUndefined();
  });
});
