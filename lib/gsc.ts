import { GoogleAuth } from "google-auth-library";

// Google Search Console — organic search keyword data per page. This is the
// ONLY source of search-query terms; GA4 reports organic search as
// "(not provided)". Reuses the same service account as lib/ga4.ts
// (GA4_CLIENT_EMAIL/GA4_PRIVATE_KEY) — it just needs Search Console access
// granted on the property in addition to GA4.
//
// The property is a GSC *domain* property, addressed as "sc-domain:ch-erawan.com"
// (covers every subdomain + http/https). Not secret — it's the public domain.
const SITE_URL = "sc-domain:ch-erawan.com";
const SC_ENDPOINT = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;

export type SearchKeywordRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0-100 (%)
  position: number; // average position (1 = top)
};
export type PageKeywords = {
  page: string;
  clicks: number;
  impressions: number;
  keywords: SearchKeywordRow[];
};

function getCredentials(): { client_email: string; private_key: string } | null {
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  return { client_email: clientEmail, private_key: privateKey };
}

/** True when the shared Google service-account credentials are present. */
export function isGscConfigured(): boolean {
  return getCredentials() !== null;
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

type GscApiRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };

/**
 * Raw Search Analytics query. Returns [] on missing config or any error —
 * never throws, matching the GA4 helpers' degrade-gracefully pattern.
 */
async function runGscQuery(dimensions: string[], days: number, rowLimit: number): Promise<GscApiRow[]> {
  const credentials = getCredentials();
  if (!credentials) return [];
  try {
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const { token } = await (await auth.getClient()).getAccessToken();
    const res = await fetch(SC_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // GSC data lags ~2-3 days; endDate is "today" but recent days are simply empty.
        startDate: isoDaysAgo(days),
        endDate: isoDaysAgo(0),
        dimensions,
        rowLimit,
      }),
    });
    if (!res.ok) {
      console.error("[gsc] searchAnalytics non-ok", res.status, (await res.text()).slice(0, 300));
      return [];
    }
    const json = await res.json();
    return json.rows ?? [];
  } catch (err) {
    console.error("[gsc] runGscQuery error", err);
    return [];
  }
}

/** Top organic keywords across the whole site. */
export async function getTopKeywords(days: number, limit = 25): Promise<SearchKeywordRow[]> {
  const rows = await runGscQuery(["query"], days, limit);
  return rows.map((r) => ({
    query: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: Math.round((r.ctr ?? 0) * 1000) / 10, // fraction → % with 1 decimal
    position: Math.round((r.position ?? 0) * 10) / 10,
  }));
}

/**
 * Keywords grouped by landing page — the "which page came from which keyword"
 * view. Queries the [page, query] pair, then buckets by page and keeps each
 * page's top keywords by clicks (falling back to impressions when clicks tie
 * at 0, which is common for new sites that have impressions but no clicks yet).
 */
export async function getKeywordsByPage(days: number, keywordsPerPage = 8): Promise<PageKeywords[]> {
  const rows = await runGscQuery(["page", "query"], days, 5000);
  const byPage = new Map<string, PageKeywords>();
  for (const r of rows) {
    const page = r.keys?.[0] ?? "";
    const query = r.keys?.[1] ?? "";
    if (!page) continue;
    let entry = byPage.get(page);
    if (!entry) {
      entry = { page, clicks: 0, impressions: 0, keywords: [] };
      byPage.set(page, entry);
    }
    entry.clicks += r.clicks ?? 0;
    entry.impressions += r.impressions ?? 0;
    entry.keywords.push({
      query,
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: Math.round((r.ctr ?? 0) * 1000) / 10,
      position: Math.round((r.position ?? 0) * 10) / 10,
    });
  }
  const pages = [...byPage.values()];
  for (const p of pages) {
    p.keywords.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    p.keywords = p.keywords.slice(0, keywordsPerPage);
  }
  pages.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  return pages;
}
