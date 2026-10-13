/**
 * Google Consent Mode v2 helpers. Default is "denied" for everything (PDPA opt-in);
 * the visitor's choice is stored in localStorage and pushed to gtag as a consent update.
 */
export const CONSENT_STORAGE_KEY = "ch-consent-v1";
export const OPEN_CONSENT_EVENT = "open-cookie-settings";

export interface ConsentChoice {
  /** GA4 / measurement cookies → analytics_storage */
  analytics: boolean;
  /** Advertising cookies → ad_storage, ad_user_data, ad_personalization */
  marketing: boolean;
}

type Granted = "granted" | "denied";

export function toConsentModeV2(choice: ConsentChoice): Record<string, Granted> {
  const a: Granted = choice.analytics ? "granted" : "denied";
  const m: Granted = choice.marketing ? "granted" : "denied";
  return {
    analytics_storage: a,
    ad_storage: m,
    ad_user_data: m,
    ad_personalization: m,
  };
}

export function parseStoredConsent(raw: string | null): ConsentChoice | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ConsentChoice>;
    if (typeof v.analytics === "boolean" && typeof v.marketing === "boolean") {
      return { analytics: v.analytics, marketing: v.marketing };
    }
  } catch {
    /* corrupted value → ask again */
  }
  return null;
}

export function readConsent(): ConsentChoice | null {
  try {
    return parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Persist the choice and tell Google tags about it. */
export function saveConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
  } catch {
    /* private mode: the choice just won't persist */
  }
  window.gtag?.("consent", "update", toConsentModeV2(choice));
}

/** Inline script for <head>/body: default = denied, then replay a stored choice before gtag('config'). */
export function consentBootstrapScript(): string {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
      wait_for_update: 500
    });
    try {
      var c = JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}') || 'null');
      if (c && typeof c.analytics === 'boolean' && typeof c.marketing === 'boolean') {
        var a = c.analytics ? 'granted' : 'denied', m = c.marketing ? 'granted' : 'denied';
        gtag('consent', 'update', { analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m });
      }
    } catch (e) {}
  `;
}
