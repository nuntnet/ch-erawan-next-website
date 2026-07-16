// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackGenerateLead, trackClickLine, trackClickCall } from "@/lib/ga4-events";

describe("ga4-events", () => {
  beforeEach(() => {
    (window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag = vi.fn();
  });
  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it("trackGenerateLead fires the generate_lead event with params", () => {
    trackGenerateLead({ inquiryType: "test_drive", branch: "มาสด้า ช.เอราวัณ ศาลายา", carModel: "CX-5" });
    expect(window.gtag).toHaveBeenCalledWith("event", "generate_lead", {
      inquiry_type: "test_drive",
      branch: "มาสด้า ช.เอราวัณ ศาลายา",
      car_model: "CX-5",
    });
  });

  it("trackClickLine fires click_line without brand for an unrecognized URL", () => {
    trackClickLine({ path: "/gwm", lineUrl: "https://lin.ee/abc" });
    expect(window.gtag).toHaveBeenCalledWith("event", "click_line", { path: "/gwm", line_url: "https://lin.ee/abc" });
  });

  it("trackClickLine includes the resolved brand for a known LINE URL", () => {
    trackClickLine({ path: "/", lineUrl: "https://lin.ee/NLeKZy6" });
    expect(window.gtag).toHaveBeenCalledWith("event", "click_line", { path: "/", line_url: "https://lin.ee/NLeKZy6", brand: "Mazda" });
  });

  it("trackClickCall fires click_call", () => {
    trackClickCall({ path: "/contact", phone: "tel:034305500" });
    expect(window.gtag).toHaveBeenCalledWith("event", "click_call", { path: "/contact", phone: "tel:034305500" });
  });

  it("is a silent no-op when window.gtag is missing", () => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(() => trackGenerateLead({ inquiryType: "contact" })).not.toThrow();
  });
});
