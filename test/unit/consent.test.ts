import { describe, it, expect } from "vitest";
import { consentBootstrapScript, parseStoredConsent, toConsentModeV2 } from "@/lib/consent";

describe("consent mode v2", () => {
  it("maps analytics and marketing to the four Google consent signals", () => {
    expect(toConsentModeV2({ analytics: true, marketing: false })).toEqual({
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(toConsentModeV2({ analytics: true, marketing: true }).ad_personalization).toBe("granted");
  });

  it("parses only well-formed stored choices", () => {
    expect(parseStoredConsent('{"analytics":false,"marketing":true}')).toEqual({ analytics: false, marketing: true });
    expect(parseStoredConsent("nope")).toBeNull();
    expect(parseStoredConsent('{"analytics":"yes"}')).toBeNull();
    expect(parseStoredConsent(null)).toBeNull();
  });

  it("bootstrap script sets default=denied before anything else", () => {
    const s = consentBootstrapScript();
    expect(s.indexOf("'default'")).toBeGreaterThan(-1);
    expect(s).toContain("analytics_storage: 'denied'");
    expect(s).toContain("wait_for_update");
  });
});
