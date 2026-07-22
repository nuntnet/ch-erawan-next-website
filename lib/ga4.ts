import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";

type RunReportRequest = Parameters<BetaAnalyticsDataClient["runReport"]>[0];

let client: BetaAnalyticsDataClient | null = null;

function getCredentials(): { client_email: string; private_key: string } | null {
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  return { client_email: clientEmail, private_key: privateKey };
}

function getClient(): BetaAnalyticsDataClient | null {
  if (client) return client;
  const credentials = getCredentials();
  if (!credentials) return null;
  client = new BetaAnalyticsDataClient({ credentials });
  return client;
}

/**
 * True only when ALL three GA4 env vars are present — property id AND the
 * service-account credentials. A partial config (e.g. only GA4_PROPERTY_ID
 * set in Vercel) would otherwise read as "configured" but return nothing
 * from every query, hiding the not-configured banner with no explanation.
 */
export function isGa4Configured(): boolean {
  return Boolean(process.env.GA4_PROPERTY_ID) && getCredentials() !== null;
}

/** Runs a GA4 Data API report against this site's property. Returns null if GA4 isn't configured. */
export async function runGa4Report(request: Omit<RunReportRequest, "property">) {
  const ga4Client = getClient();
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!ga4Client || !propertyId) return null;
  try {
    const [response] = await ga4Client.runReport({
      property: `properties/${propertyId}`,
      ...request,
    });
    return response;
  } catch (err) {
    console.error("[ga4] runGa4Report error", err);
    return null;
  }
}

export type FunnelStepDef = {
  name: string;
  field: "pageLocation" | "eventName";
  matchType: "CONTAINS" | "EXACT";
  value: string;
};
export type FunnelStepResult = { name: string; users: number; completionRate: number };

/**
 * Runs a GA4 Funnel report (v1alpha — not exposed by the installed
 * @google-analytics/data client, so this calls the REST endpoint directly).
 * Returns [] if GA4 isn't configured or the request fails — never throws.
 */
export async function runGa4Funnel(steps: FunnelStepDef[], days: number): Promise<FunnelStepResult[]> {
  const credentials = getCredentials();
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!credentials || !propertyId) return [];

  try {
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    const authClient = await auth.getClient();
    const { token } = await authClient.getAccessToken();

    const res = await fetch(`https://analyticsdata.googleapis.com/v1alpha/properties/${propertyId}:runFunnelReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        funnel: {
          steps: steps.map((s) => ({
            name: s.name,
            filterExpression: {
              funnelFieldFilter: {
                fieldName: s.field,
                stringFilter: { matchType: s.matchType, value: s.value },
              },
            },
          })),
        },
      }),
    });
    if (!res.ok) {
      console.error("[ga4] runFunnelReport non-ok status", res.status, await res.text());
      return [];
    }
    const json = await res.json();
    const headers: { name: string }[] = json.funnelTable?.metricHeaders ?? [];
    const usersIdx = headers.findIndex((h) => h.name === "activeUsers");
    const rateIdx = headers.findIndex((h) => h.name === "funnelStepCompletionRate");
    const rows: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] = json.funnelTable?.rows ?? [];
    return rows.map((row) => ({
      name: row.dimensionValues[0]?.value ?? "",
      users: usersIdx >= 0 ? Number(row.metricValues[usersIdx]?.value ?? 0) : 0,
      completionRate: rateIdx >= 0 ? Number(row.metricValues[rateIdx]?.value ?? 0) : 0,
    }));
  } catch (err) {
    console.error("[ga4] runGa4Funnel error", err);
    return [];
  }
}

export type ChannelRow = { channel: string; sessions: number; users: number };

export async function getChannels(days: number): Promise<ChannelRow[]> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
  });
  if (!response?.rows) return [];
  return response.rows.map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    users: Number(row.metricValues?.[1]?.value ?? 0),
  }));
}

export type SourceRow = { source: string; medium: string; campaign: string | null; sessions: number };

export async function getTopSources(days: number): Promise<SourceRow[]> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }, { name: "sessionCampaignName" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 20,
  });
  if (!response?.rows) return [];
  return response.rows.map((row) => {
    const campaign = row.dimensionValues?.[2]?.value ?? null;
    return {
      source: row.dimensionValues?.[0]?.value ?? "",
      medium: row.dimensionValues?.[1]?.value ?? "",
      campaign: campaign === "(not set)" ? null : campaign,
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    };
  });
}

export type DeviceRow = { device: string; sessions: number };

export async function getDeviceBreakdown(days: number): Promise<DeviceRow[]> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  if (!response?.rows) return [];
  return response.rows.map((row) => ({
    device: row.dimensionValues?.[0]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}

export type LandingPageRow = { path: string; sessions: number; bounceRate: number };

// GA4's Data API has no "exits"/"entrances" metrics (those are Universal
// Analytics-only concepts) — landingPage + sessions/bounceRate is the closest
// GA4-native equivalent: which pages people land on, and how many bounce.
export async function getLandingPages(days: number): Promise<LandingPageRow[]> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "landingPage" }],
    metrics: [{ name: "sessions" }, { name: "bounceRate" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 15,
  });
  if (!response?.rows) return [];
  return response.rows.map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    bounceRate: Number(row.metricValues?.[1]?.value ?? 0) * 100,
  }));
}

export type VehicleRow = { slug: string; label: string; views: number };

function labelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export async function getTopVehicles(days: number): Promise<VehicleRow[]> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    dimensionFilter: {
      filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/cars/" } },
    },
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 15,
  });
  if (!response?.rows) return [];
  return response.rows.map((row) => {
    const path = row.dimensionValues?.[0]?.value ?? "";
    const slug = path.replace(/^\/cars\//, "").replace(/\/$/, "");
    return {
      slug,
      label: labelFromSlug(slug),
      views: Number(row.metricValues?.[0]?.value ?? 0),
    };
  });
}

export type LeadCounts = { form: number; line: number; call: number };

export async function getLeadCounts(days: number): Promise<LeadCounts> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "eventName" }],
    dimensionFilter: {
      filter: { fieldName: "eventName", inListFilter: { values: ["generate_lead", "click_line", "click_call"] } },
    },
    metrics: [{ name: "eventCount" }],
  });
  const counts: LeadCounts = { form: 0, line: 0, call: 0 };
  if (!response?.rows) return counts;
  for (const row of response.rows) {
    const name = row.dimensionValues?.[0]?.value;
    const count = Number(row.metricValues?.[0]?.value ?? 0);
    if (name === "generate_lead") counts.form = count;
    else if (name === "click_line") counts.line = count;
    else if (name === "click_call") counts.call = count;
  }
  return counts;
}

export type BrandClicks = { brand: string; clicks: number };

/**
 * LINE-click counts broken down by brand — from the `brand` param on
 * click_line events. Requires "brand" registered as an Event-scoped custom
 * dimension in GA4 (dimension name `customEvent:brand`); returns [] until
 * then (or when unconfigured/no data).
 */
export async function getLineClicksByBrand(days: number): Promise<BrandClicks[]> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "customEvent:brand" }],
    dimensionFilter: {
      filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "click_line" } },
    },
    metrics: [{ name: "eventCount" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
  });
  if (!response?.rows) return [];
  return response.rows
    .map((row) => ({
      brand: row.dimensionValues?.[0]?.value ?? "",
      clicks: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    // drop GA4's "(not set)" bucket (clicks before the dimension existed / unmapped URLs)
    .filter((r) => r.brand && r.brand !== "(not set)");
}

const FUNNELS: { key: string; label: string; steps: FunnelStepDef[] }[] = [
  {
    key: "test_drive",
    label: "หน้ารถ → ดูรถ → จองทดลองขับสำเร็จ",
    steps: [
      { name: "หน้ารายการรถ", field: "pageLocation", matchType: "CONTAINS", value: "/cars" },
      { name: "หน้ารายละเอียดรถ", field: "pageLocation", matchType: "CONTAINS", value: "/cars/" },
      { name: "จองทดลองขับสำเร็จ", field: "eventName", matchType: "EXACT", value: "generate_lead" },
    ],
  },
  {
    key: "service",
    label: "หน้าแบรนด์บริการ → จองเข้าศูนย์บริการสำเร็จ",
    steps: [
      { name: "หน้าบริการ", field: "pageLocation", matchType: "CONTAINS", value: "/service" },
      { name: "จองเข้าศูนย์บริการสำเร็จ", field: "eventName", matchType: "EXACT", value: "generate_lead" },
    ],
  },
  {
    key: "promotions",
    label: "โปรโมชั่น → จอง/ติดต่อสำเร็จ",
    steps: [
      { name: "หน้าโปรโมชั่น", field: "pageLocation", matchType: "CONTAINS", value: "/promotions" },
      { name: "จอง/ติดต่อสำเร็จ", field: "eventName", matchType: "EXACT", value: "generate_lead" },
    ],
  },
  {
    key: "blog",
    label: "บทความ/บล็อก → จองทดลองขับสำเร็จ",
    steps: [
      { name: "หน้าบทความ", field: "pageLocation", matchType: "CONTAINS", value: "/blog/" },
      { name: "จองทดลองขับสำเร็จ", field: "eventName", matchType: "EXACT", value: "generate_lead" },
    ],
  },
];

export type FunnelResult = { key: string; label: string; steps: FunnelStepResult[] };

export async function getFunnels(days: number): Promise<FunnelResult[]> {
  const results = await Promise.all(
    FUNNELS.map(async (f) => ({
      key: f.key,
      label: f.label,
      steps: await runGa4Funnel(f.steps, days),
    }))
  );
  return results;
}
