import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackClickLine, trackGenerateLead } from "@/lib/ga4-events";

describe("ga4-events — Geely", () => {
  const gtag = vi.fn();
  beforeEach(() => {
    gtag.mockClear();
    vi.stubGlobal("window", { gtag });
  });

  it("attributes LINE clicks on /geely to Geely even though the OA is shared with Mitsubishi", () => {
    trackClickLine({ path: "/geely", lineUrl: "https://lin.ee/N7UjCTE" });
    expect(gtag).toHaveBeenCalledWith("event", "click_line", expect.objectContaining({ brand: "Geely" }));
  });

  it("keeps Mitsubishi attribution for the same OA elsewhere", () => {
    trackClickLine({ path: "/mitsubishi", lineUrl: "https://lin.ee/N7UjCTE" });
    expect(gtag).toHaveBeenCalledWith("event", "click_line", expect.objectContaining({ brand: "Mitsubishi" }));
  });

  it("sends mstack lead taxonomy params on generate_lead", () => {
    trackGenerateLead({ inquiryType: "test_drive", branch: "GEELY ช.เอราวัณ รัชดา", carModel: "EX5" });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "generate_lead",
      expect.objectContaining({ lead_type: "test_drive", showroom_branch: "GEELY ช.เอราวัณ รัชดา", model_interest: "EX5" })
    );
  });
});

import { trackScrollDepth, trackSelectItem, trackViewItem } from "@/lib/ga4-events";

describe("ga4-events — funnel events", () => {
  const gtag = vi.fn();
  beforeEach(() => {
    gtag.mockClear();
    vi.stubGlobal("window", { gtag });
  });

  it("generate_lead carries value and currency", () => {
    trackGenerateLead({ inquiryType: "test_drive", carModel: "EX5" });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", expect.objectContaining({ value: 0, currency: "THB" }));
  });

  it("view_item sends an items array with price", () => {
    trackViewItem({ itemId: "geely-ex5", itemName: "EX5", itemBrand: "Geely", itemCategory: "new_car", price: 799000 });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "view_item",
      expect.objectContaining({
        currency: "THB",
        value: 799000,
        items: [expect.objectContaining({ item_id: "geely-ex5", item_name: "EX5", price: 799000 })],
      })
    );
  });

  it("select_item and scroll_depth use the mstack parameter names", () => {
    trackSelectItem({ itemName: "EX5", ctaLocation: "model_image" });
    expect(gtag).toHaveBeenCalledWith("event", "select_item", expect.objectContaining({ item_name: "EX5", cta_location: "model_image" }));
    trackScrollDepth({ percent: 75, pageType: "brand_hub" });
    expect(gtag).toHaveBeenCalledWith("event", "scroll_depth", { percent_scrolled: 75, page_type: "brand_hub" });
  });
});
