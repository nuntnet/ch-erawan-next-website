import { BetaAnalyticsDataClient } from "@google-analytics/data";

type RunReportRequest = Parameters<BetaAnalyticsDataClient["runReport"]>[0];

let client: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient | null {
  if (client) return client;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  client = new BetaAnalyticsDataClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
  });
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
