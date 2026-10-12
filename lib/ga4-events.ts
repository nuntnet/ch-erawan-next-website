import { brandFromLineUrl } from "@/lib/lineAccounts";

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
    // mstack GA4 taxonomy (website-cro / ga4-event-schema-architect)
    value: 0, // lead value is unknown at submit time; required by the taxonomy
    currency: "THB",
    lead_type: params.inquiryType,
    ...(params.branch ? { showroom_branch: params.branch } : {}),
    ...(params.carModel ? { model_interest: params.carModel } : {}),
  });
}

/** Fired by OutboundClickTracker for any line.me/lin.ee link click. */
export function trackClickLine(params: { path: string; lineUrl: string }): void {
  // Geely Ratchada shares the Mitsubishi LINE OA for now, so the URL alone would be
  // attributed to Mitsubishi — fall back to the page the click came from.
  const brand = params.path.startsWith("/geely") ? "Geely" : brandFromLineUrl(params.lineUrl);
  fire("click_line", {
    path: params.path,
    line_url: params.lineUrl,
    // brand of the LINE OA clicked — lets GA4 break clicks down per brand
    // (requires "brand" registered as a custom dimension). Omitted when the
    // URL isn't a recognized per-brand account.
    ...(brand ? { brand } : {}),
  });
}

/** Fired by OutboundClickTracker for any tel: link click. */
export function trackClickCall(params: { path: string; phone: string }): void {
  fire("click_call", { path: params.path, phone: params.phone });
}

export interface Ga4Item {
  itemId: string;
  itemName: string;
  itemBrand?: string;
  itemCategory?: string;
  price?: number;
}

const toItem = (i: Ga4Item) => ({
  item_id: i.itemId,
  item_name: i.itemName,
  ...(i.itemBrand ? { item_brand: i.itemBrand } : {}),
  ...(i.itemCategory ? { item_category: i.itemCategory } : {}),
  ...(i.price != null ? { price: i.price } : {}),
});

/** A car/model detail page was opened (funnel step 1). */
export function trackViewItem(item: Ga4Item): void {
  // items[] is the GA4 standard; the flat params mirror it for the mstack taxonomy (custom reports).
  fire("view_item", {
    currency: "THB",
    ...(item.price != null ? { value: item.price } : {}),
    ...toItem(item),
    items: [toItem(item)],
  });
}

/** A model card/link was clicked (engagement). ctaLocation e.g. "model_card", "model_name". */
export function trackSelectItem(params: { itemName: string; ctaLocation?: string }): void {
  fire("select_item", {
    item_name: params.itemName,
    ...(params.ctaLocation ? { cta_location: params.ctaLocation } : {}),
    items: [{ item_name: params.itemName }],
  });
}

/** Fired once per threshold (50/75/90) as the visitor scrolls a page. */
export function trackScrollDepth(params: { percent: 50 | 75 | 90; pageType: string }): void {
  fire("scroll_depth", { percent_scrolled: params.percent, page_type: params.pageType });
}
