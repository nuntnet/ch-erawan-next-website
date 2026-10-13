/**
 * Verify that GA4 receives the expected events — read-only (GA4 Data API).
 *
 *   bun run scripts/verify-ga4-events.ts                     # realtime (last 30 min) + 28-day event names
 *   bun run scripts/verify-ga4-events.ts --expect view_item,select_item,scroll_depth,generate_lead
 *
 * Exit code 1 if any --expect event is missing from the realtime report (use right after browsing the site).
 * Realtime shows event names only (not parameters); parameters need Custom Dimensions registered in GA4.
 * Requires .env.local: GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY (service account with Viewer access).
 */
import { config } from "dotenv";
import { GoogleAuth } from "google-auth-library";

config({ path: ".env.local" });

const expectArg = process.argv.find((a) => a === "--expect");
const expected = expectArg ? (process.argv[process.argv.indexOf("--expect") + 1] ?? "").split(",").filter(Boolean) : [];

const propertyId = process.env.GA4_PROPERTY_ID;
const clientEmail = process.env.GA4_CLIENT_EMAIL;
const privateKey = (process.env.GA4_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
if (!propertyId || !clientEmail || !privateKey) {
  console.error("Missing GA4_PROPERTY_ID / GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY in .env.local");
  process.exit(2);
}

async function main() {
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const { token } = await (await auth.getClient()).getAccessToken();

  async function call(method: string, body: unknown) {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:${method}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json() as Promise<{ rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] }>;
  }
  const toMap = (rows: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] = []) =>
    Object.fromEntries(rows.map((r) => [r.dimensionValues[0].value, Number(r.metricValues[0].value)]));

  const realtime = toMap(
    (await call("runRealtimeReport", { dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }] })).rows
  );
  const history = toMap(
    (
      await call("runReport", {
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 50,
      })
    ).rows
  );

  console.log("Realtime (last 30 min):", realtime);
  console.log("Last 28 days:", history);

  const missing = expected.filter((e) => !(e in realtime));
  if (expected.length) {
    console.log(missing.length ? `MISSING in realtime: ${missing.join(", ")}` : "All expected events present in realtime.");
  }
  process.exit(missing.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
