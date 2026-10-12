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
