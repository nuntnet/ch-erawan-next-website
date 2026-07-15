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

/** Runs a GA4 Data API report against this site's property. Returns null if GA4 isn't configured. */
export async function runGa4Report(request: Omit<RunReportRequest, "property">) {
  const ga4Client = getClient();
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!ga4Client || !propertyId) return null;
  const [response] = await ga4Client.runReport({
    property: `properties/${propertyId}`,
    ...request,
  });
  return response;
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
