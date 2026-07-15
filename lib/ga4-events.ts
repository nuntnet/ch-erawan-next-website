export type InquiryType = "test_drive" | "service" | "body_paint" | "contact";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function fire(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

/** Fired once, client-side, right after a booking/contact submission succeeds. */
export function trackGenerateLead(params: { inquiryType: InquiryType; branch?: string; carModel?: string }): void {
  fire("generate_lead", {
    inquiry_type: params.inquiryType,
    ...(params.branch ? { branch: params.branch } : {}),
    ...(params.carModel ? { car_model: params.carModel } : {}),
  });
}

/** Fired by OutboundClickTracker for any line.me/lin.ee link click. */
export function trackClickLine(params: { path: string; lineUrl: string }): void {
  fire("click_line", { path: params.path, line_url: params.lineUrl });
}

/** Fired by OutboundClickTracker for any tel: link click. */
export function trackClickCall(params: { path: string; phone: string }): void {
  fire("click_call", { path: params.path, phone: params.phone });
}
