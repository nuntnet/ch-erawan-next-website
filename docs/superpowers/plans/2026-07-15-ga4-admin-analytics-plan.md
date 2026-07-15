# GA4 Admin Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `/admin/analytics` with real GA4 data — traffic channels/sources/campaigns, exit-page bounce analysis, top-vehicle popularity, device split, a lead-count widget (form/LINE/phone), and 4 conversion funnels whose final step is a real `generate_lead` event (not a page visit).

**Architecture:** A server-side read layer (`lib/ga4.ts`, extended) wraps the GA4 Data API (stable `runReport`) and the GA4 Funnel API (`v1alpha`, raw REST since the installed client library doesn't expose it) behind small typed functions. A new client-side write layer (`lib/ga4-events.ts` + one global click-delegation component) fires three new custom events (`generate_lead`, `click_line`, `click_call`) that the read layer's funnels/lead-counts consume. One new API route (`/api/admin/analytics/ga4`) aggregates all reads; the existing `/admin/analytics` page fetches it alongside its current business-events fetch and renders new sections.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@google-analytics/data` (already installed, v6.1.0), `google-auth-library` (currently only a transitive dependency — this plan adds it as a direct one), Recharts (already used on the target page), Vitest + Testing Library (existing test setup).

## Global Constraints

- Spec source of truth: `docs/superpowers/specs/2026-07-15-ga4-admin-analytics-design.md` — read it if any task here seems to contradict it (it shouldn't; this plan implements it exactly, with two documented deviations noted inline where marked **(plan deviation)**).
- Every new `lib/ga4.ts` function must return an empty/neutral value (never throw) when `GA4_PROPERTY_ID`/`GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY` aren't configured, matching the existing `runGa4Report()`'s null-safe pattern.
- The 4 funnels are hardcoded (not user-configurable) — see spec's "Out of Scope."
- `/api/admin/analytics/ga4` is gated with `requireStaff()` (same as the existing `/api/admin/analytics`), not `requireAdmin()`.
- Test environment: default `node`; component tests need a `// @vitest-environment jsdom` docblock as the first line (see `test/unit/ImageUploader.test.tsx` for the existing pattern). Run tests with `bun run test`, typecheck with `bunx tsc --noEmit` (filter out any pre-existing `ch-erawanwebsite/` stray-directory noise if present), build with `bun run build`.
- **Two known open technical unknowns, deliberately not resolved by guessing:**
  1. Whether the GA4 Funnel API's `fieldName` accepts a *custom event parameter* (e.g. `inquiry_type`) the same way it accepts `pageLocation`/`eventName` — untested (requires the custom dimension to be registered first, a manual step outside this plan). Task 4 implements the simple case (funnel steps filter only on `eventName`/`pageLocation`); do not attempt parameter-level funnel filtering as part of this plan.
  2. The exact `funnelTable.rows` shape when a funnel actually has matching data — every live test run during planning returned zero rows (GA4 property has no data yet, confirmed even with a 365-day range and a trivially-matching filter). Task 1 writes the parser defensively (looks up each metric by name in `metricHeaders`, not by fixed position) and is unit-tested against a hand-built fixture matching the *confirmed* header shape (`dimensionHeaders: [{name: "funnelStepName"}]`, `metricHeaders` containing `activeUsers`/`funnelStepCompletionRate`/`funnelStepAbandonments`/`funnelStepAbandonmentRate` entries). Re-verify against real rows once production traffic exists (outside this plan — see spec's Testing section).

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/ga4.ts` (extend) | Server-side GA4 reads: `runGa4Report` (exists), new `runGa4Funnel`, `getChannels`, `getTopSources`, `getDeviceBreakdown`, `getExitPages`, `getTopVehicles`, `getLeadCounts`, `getFunnels` |
| `lib/ga4-events.ts` (new) | Client-side GA4 writes: `trackGenerateLead`, `trackClickLine`, `trackClickCall` |
| `components/OutboundClickTracker.tsx` (new) | One global click-delegation component, fires `click_line`/`click_call` for any `tel:`/`line.me`/`lin.ee` link anywhere on the site |
| `app/api/admin/analytics/ga4/route.ts` (new) | `GET` — aggregates all `lib/ga4.ts` reads into one JSON response |
| `app/booking/page.tsx` (modify) | Export `BookingType`; call `trackGenerateLead` on successful submit |
| `app/contact/page.tsx` (modify) | Call `trackGenerateLead` on successful submit |
| `app/layout.tsx` (modify) | Mount `<OutboundClickTracker />` |
| `app/admin/analytics/page.tsx` (modify) | Fetch the new route; render Lead Counts, Traffic Sources, Top Vehicles, Exit Pages, Device split, Funnels sections; remove the Vercel Analytics link card |
| `package.json` / `bun.lock` (modify) | Add `google-auth-library` as a direct dependency |

---

### Task 1: Funnel API helper (`runGa4Funnel`) + dependency

**Files:**
- Modify: `package.json`, `bun.lock` (via `bun add`)
- Modify: `lib/ga4.ts`
- Test: `test/unit/ga4.test.ts` (new)

**Interfaces:**
- Produces: `export type FunnelStepDef = { name: string; field: "pageLocation" | "eventName"; matchType: "CONTAINS" | "EXACT"; value: string }`, `export type FunnelStepResult = { name: string; users: number; completionRate: number }`, `export async function runGa4Funnel(steps: FunnelStepDef[], days: number): Promise<FunnelStepResult[]>`
- Consumes: `process.env.GA4_PROPERTY_ID` / `GA4_CLIENT_EMAIL` / `GA4_PRIVATE_KEY` (already read by the existing `getClient()`/`runGa4Report` in this file — reuse the same env vars, add a small credentials helper shared by both the report client and the funnel REST call).

- [ ] **Step 1: Add `google-auth-library` as a direct dependency**

Run: `bun add google-auth-library@10.5.0`

(This pins to the version already resolved as a transitive dependency of `@google-analytics/data` — see `bun.lock`'s `google-gax` entry — so this is a no-op version-wise, just makes the dependency explicit and not at the mercy of a future transitive bump.)

- [ ] **Step 2: Write the failing test for `runGa4Funnel`**

Create `test/unit/ga4.test.ts`:

This file establishes the FULL shared mock scaffold up front (both `@google-analytics/data` and `google-auth-library`, plus the env-var `beforeEach`/`afterEach`), even though Task 1's own tests only exercise the `google-auth-library`+`fetch` half — Tasks 2-4 append `describe` blocks to this same file and reuse `mockRunReport` without touching this header again. Mocking the whole `@google-analytics/data` module (rather than patching `BetaAnalyticsDataClient.prototype.runReport` on a real instance) matches this codebase's existing convention for mocking SDK clients — see `test/unit/notion-promotions.test.ts`'s `vi.mock("@notionhq/client", ...)` — and avoids ever constructing the real gRPC-based client with fake credentials.

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockRunReport, mockGetAccessToken } = vi.hoisted(() => ({
  mockRunReport: vi.fn(),
  mockGetAccessToken: vi.fn(async () => ({ token: "fake-token" })),
}));

vi.mock("@google-analytics/data", () => ({
  BetaAnalyticsDataClient: vi.fn(function () {
    return { runReport: mockRunReport };
  }),
}));

vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn(function () {
    return { getClient: vi.fn(async () => ({ getAccessToken: mockGetAccessToken })) };
  }),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  process.env.GA4_PROPERTY_ID = "123456";
  process.env.GA4_CLIENT_EMAIL = "test@example.iam.gserviceaccount.com";
  process.env.GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nFAKE\\n-----END PRIVATE KEY-----\\n";
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
  delete process.env.GA4_PROPERTY_ID;
  delete process.env.GA4_CLIENT_EMAIL;
  delete process.env.GA4_PRIVATE_KEY;
});

describe("runGa4Funnel", () => {
  it("parses a funnel response into step results", async () => {
    const fakeResponse = {
      funnelTable: {
        dimensionHeaders: [{ name: "funnelStepName" }],
        metricHeaders: [
          { name: "activeUsers", type: "TYPE_INTEGER" },
          { name: "funnelStepCompletionRate", type: "TYPE_INTEGER" },
          { name: "funnelStepAbandonments", type: "TYPE_INTEGER" },
          { name: "funnelStepAbandonmentRate", type: "TYPE_INTEGER" },
        ],
        rows: [
          { dimensionValues: [{ value: "step1" }], metricValues: [{ value: "100" }, { value: "100" }, { value: "0" }, { value: "0" }] },
          { dimensionValues: [{ value: "step2" }], metricValues: [{ value: "40" }, { value: "40" }, { value: "60" }, { value: "60" }] },
        ],
      },
    };
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => fakeResponse,
    })) as unknown as typeof fetch;

    const { runGa4Funnel } = await import("@/lib/ga4");
    const result = await runGa4Funnel(
      [
        { name: "step1", field: "pageLocation", matchType: "CONTAINS", value: "/cars" },
        { name: "step2", field: "eventName", matchType: "EXACT", value: "generate_lead" },
      ],
      30
    );

    expect(result).toEqual([
      { name: "step1", users: 100, completionRate: 100 },
      { name: "step2", users: 40, completionRate: 40 },
    ]);
  });

  it("returns [] when GA4 env vars are missing", async () => {
    delete process.env.GA4_PROPERTY_ID;
    const { runGa4Funnel } = await import("@/lib/ga4");
    const result = await runGa4Funnel([{ name: "s", field: "pageLocation", matchType: "CONTAINS", value: "/x" }], 30);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `bun run test test/unit/ga4.test.ts`
Expected: FAIL — `runGa4Funnel is not exported` (or module not found, since it doesn't exist yet)

- [ ] **Step 4: Implement `runGa4Funnel` in `lib/ga4.ts`**

Replace the full contents of `lib/ga4.ts` with:

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `bun run test test/unit/ga4.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no new errors

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock lib/ga4.ts test/unit/ga4.test.ts
git commit -m "feat(analytics): add runGa4Funnel — GA4 v1alpha Funnel API via raw REST"
```

---

### Task 2: Traffic reporting functions (channels, sources+campaign, device)

**Files:**
- Modify: `lib/ga4.ts`
- Modify: `test/unit/ga4.test.ts`

**Interfaces:**
- Consumes: `runGa4Report()` (Task 1/existing)
- Produces: `export type ChannelRow = { channel: string; sessions: number; users: number }`, `export type SourceRow = { source: string; medium: string; campaign: string | null; sessions: number }`, `export type DeviceRow = { device: string; sessions: number }`, `export async function getChannels(days: number): Promise<ChannelRow[]>`, `export async function getTopSources(days: number): Promise<SourceRow[]>`, `export async function getDeviceBreakdown(days: number): Promise<DeviceRow[]>`

- [ ] **Step 1: Write the failing tests**

Append to `test/unit/ga4.test.ts` (same file, add a new `describe` block; keep the existing `beforeEach`/`afterEach` — they already set/clear the env vars needed here):

```ts
describe("getChannels / getTopSources / getDeviceBreakdown", () => {
  it("getChannels maps channel group rows", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [
        { dimensionValues: [{ value: "Organic Search" }], metricValues: [{ value: "50" }, { value: "40" }] },
        { dimensionValues: [{ value: "Direct" }], metricValues: [{ value: "20" }, { value: "18" }] },
      ],
    }]);
    const { getChannels } = await import("@/lib/ga4");
    const result = await getChannels(30);
    expect(result).toEqual([
      { channel: "Organic Search", sessions: 50, users: 40 },
      { channel: "Direct", sessions: 20, users: 18 },
    ]);
  });

  it("getTopSources includes campaign, null when (not set)", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [
        { dimensionValues: [{ value: "facebook" }, { value: "cpc" }, { value: "july_motor_show" }], metricValues: [{ value: "12" }] },
        { dimensionValues: [{ value: "google" }, { value: "organic" }, { value: "(not set)" }], metricValues: [{ value: "30" }] },
      ],
    }]);
    const { getTopSources } = await import("@/lib/ga4");
    const result = await getTopSources(30);
    expect(result).toEqual([
      { source: "facebook", medium: "cpc", campaign: "july_motor_show", sessions: 12 },
      { source: "google", medium: "organic", campaign: null, sessions: 30 },
    ]);
  });

  it("getDeviceBreakdown maps device rows", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [
        { dimensionValues: [{ value: "mobile" }], metricValues: [{ value: "80" }] },
        { dimensionValues: [{ value: "desktop" }], metricValues: [{ value: "20" }] },
      ],
    }]);
    const { getDeviceBreakdown } = await import("@/lib/ga4");
    const result = await getDeviceBreakdown(30);
    expect(result).toEqual([
      { device: "mobile", sessions: 80 },
      { device: "desktop", sessions: 20 },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test test/unit/ga4.test.ts`
Expected: FAIL — `getChannels`/`getTopSources`/`getDeviceBreakdown` not exported

- [ ] **Step 3: Implement in `lib/ga4.ts`** — append below `runGa4Funnel`:

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test test/unit/ga4.test.ts`
Expected: PASS (5 tests total)

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add lib/ga4.ts test/unit/ga4.test.ts
git commit -m "feat(analytics): add getChannels/getTopSources/getDeviceBreakdown"
```

---

### Task 3: Exit pages, top vehicles, lead counts

**Files:**
- Modify: `lib/ga4.ts`
- Modify: `test/unit/ga4.test.ts`

**Interfaces:**
- Consumes: `runGa4Report()` (Task 1/existing)
- Produces: `export type ExitPageRow = { path: string; exits: number; entrances: number; bounceRate: number }`, `export type VehicleRow = { slug: string; label: string; views: number }`, `export type LeadCounts = { form: number; line: number; call: number }`, `export async function getExitPages(days: number): Promise<ExitPageRow[]>`, `export async function getTopVehicles(days: number): Promise<VehicleRow[]>`, `export async function getLeadCounts(days: number): Promise<LeadCounts>`

**Plan deviation from spec:** the spec suggested resolving vehicle labels by joining against `lib/brandConfig.ts`. That file's car list (`FeaturedModel`, inside each brand's config) is a curated marketing highlight list — not the full ~44-car catalog (that lives in Notion, fetched per-slug via `getCarBySlug`). Joining against Notion per row would mean extra API calls on every admin-page load; joining against `brandConfig.ts` would silently omit any non-featured car. Instead, `getTopVehicles` derives a readable label directly from the URL slug (split on `-`, title-case each word) — zero extra dependencies, always in sync, good enough for a ranked list. No `avgEngagementSec` field for v1 (dropped from the spec's `VehicleRow` — `userEngagementDuration` is a session-scoped metric in GA4, not cleanly divisible by page views without misleading averaging; not worth the complexity for an admin ranking table. Can be added later if actually needed.)

- [ ] **Step 1: Write the failing tests** — append to `test/unit/ga4.test.ts`:

```ts
describe("getExitPages / getTopVehicles / getLeadCounts", () => {
  it("getExitPages maps page rows sorted by exits", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [
        { dimensionValues: [{ value: "/cars" }], metricValues: [{ value: "40" }, { value: "60" }, { value: "45.5" }] },
        { dimensionValues: [{ value: "/booking" }], metricValues: [{ value: "25" }, { value: "30" }, { value: "50" }] },
      ],
    }]);
    const { getExitPages } = await import("@/lib/ga4");
    const result = await getExitPages(30);
    expect(result).toEqual([
      { path: "/cars", exits: 40, entrances: 60, bounceRate: 45.5 },
      { path: "/booking", exits: 25, entrances: 30, bounceRate: 50 },
    ]);
  });

  it("getTopVehicles derives a readable label from the slug", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [
        { dimensionValues: [{ value: "/cars/mazda-cx-5-2025" }], metricValues: [{ value: "150" }] },
        { dimensionValues: [{ value: "/cars/ford-ranger-raptor-2026" }], metricValues: [{ value: "90" }] },
      ],
    }]);
    const { getTopVehicles } = await import("@/lib/ga4");
    const result = await getTopVehicles(30);
    expect(result).toEqual([
      { slug: "mazda-cx-5-2025", label: "Mazda Cx 5 2025", views: 150 },
      { slug: "ford-ranger-raptor-2026", label: "Ford Ranger Raptor 2026", views: 90 },
    ]);
  });

  it("getLeadCounts maps the three event names into named counts", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [
        { dimensionValues: [{ value: "generate_lead" }], metricValues: [{ value: "10" }] },
        { dimensionValues: [{ value: "click_line" }], metricValues: [{ value: "25" }] },
        { dimensionValues: [{ value: "click_call" }], metricValues: [{ value: "5" }] },
      ],
    }]);
    const { getLeadCounts } = await import("@/lib/ga4");
    const result = await getLeadCounts(30);
    expect(result).toEqual({ form: 10, line: 25, call: 5 });
  });

  it("getLeadCounts defaults missing events to 0", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [{ dimensionValues: [{ value: "generate_lead" }], metricValues: [{ value: "3" }] }],
    }]);
    const { getLeadCounts } = await import("@/lib/ga4");
    const result = await getLeadCounts(30);
    expect(result).toEqual({ form: 3, line: 0, call: 0 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test test/unit/ga4.test.ts`
Expected: FAIL — new exports missing

- [ ] **Step 3: Implement in `lib/ga4.ts`** — append below `getDeviceBreakdown`:

```ts
export type ExitPageRow = { path: string; exits: number; entrances: number; bounceRate: number };

export async function getExitPages(days: number): Promise<ExitPageRow[]> {
  const response = await runGa4Report({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "exits" }, { name: "entrances" }, { name: "bounceRate" }],
    orderBys: [{ metric: { metricName: "exits" }, desc: true }],
    limit: 15,
  });
  if (!response?.rows) return [];
  return response.rows.map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    exits: Number(row.metricValues?.[0]?.value ?? 0),
    entrances: Number(row.metricValues?.[1]?.value ?? 0),
    bounceRate: Number(row.metricValues?.[2]?.value ?? 0),
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
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test test/unit/ga4.test.ts`
Expected: PASS (9 tests total)

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add lib/ga4.ts test/unit/ga4.test.ts
git commit -m "feat(analytics): add getExitPages/getTopVehicles/getLeadCounts"
```

---

### Task 4: Funnel definitions + aggregator

**Files:**
- Modify: `lib/ga4.ts`
- Modify: `test/unit/ga4.test.ts`

**Interfaces:**
- Consumes: `runGa4Funnel(steps: FunnelStepDef[], days: number)` (Task 1)
- Produces: `export type FunnelResult = { key: string; label: string; steps: FunnelStepResult[] }`, `export async function getFunnels(days: number): Promise<FunnelResult[]>`

- [ ] **Step 1: Write the failing test** — append to `test/unit/ga4.test.ts`:

```ts
describe("getFunnels", () => {
  it("runs all 4 hardcoded funnels and labels each result", async () => {
    // getFunnels calls runGa4Funnel internally (same module) — rather than
    // self-mocking a sibling export of the module under test (fragile in
    // Vitest/ESM), mock the same underlying transport runGa4Funnel uses:
    // fetch (auth is already mocked once, at the top of this file in Task 1
    // — google-auth-library must NOT be re-mocked here, vi.mock is
    // file-scoped and hoisted; a second vi.mock("google-auth-library", ...)
    // call in this describe block would conflict with Task 1's).
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        funnelTable: {
          dimensionHeaders: [{ name: "funnelStepName" }],
          metricHeaders: [
            { name: "activeUsers", type: "TYPE_INTEGER" },
            { name: "funnelStepCompletionRate", type: "TYPE_INTEGER" },
          ],
          rows: [{ dimensionValues: [{ value: "s1" }], metricValues: [{ value: "10" }, { value: "100" }] }],
        },
      }),
    })) as unknown as typeof fetch;

    const { getFunnels } = await import("@/lib/ga4");
    const result = await getFunnels(30);
    expect(result).toHaveLength(4);
    expect(result.map((f) => f.key)).toEqual(["test_drive", "service", "promotions", "blog"]);
    expect(result[0].steps).toEqual([{ name: "s1", users: 10, completionRate: 100 }]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test test/unit/ga4.test.ts`
Expected: FAIL — `getFunnels` not exported

- [ ] **Step 3: Implement in `lib/ga4.ts`** — append at the end of the file:

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test test/unit/ga4.test.ts`
Expected: PASS (10 tests total)

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add lib/ga4.ts test/unit/ga4.test.ts
git commit -m "feat(analytics): add the 4 hardcoded conversion funnels + getFunnels aggregator"
```

---

### Task 5: API route `/api/admin/analytics/ga4`

**Files:**
- Create: `app/api/admin/analytics/ga4/route.ts`
- Test: `test/unit/admin-analytics-ga4-route.test.ts` (new)

**Interfaces:**
- Consumes: every `lib/ga4.ts` export from Tasks 1–4, plus `requireStaff()` from `lib/admin-auth.ts` (existing).
- Produces: `GET` handler returning `{ configured: boolean; channels: ChannelRow[]; topSources: SourceRow[]; exitPages: ExitPageRow[]; topVehicles: VehicleRow[]; deviceBreakdown: DeviceRow[]; leadCounts: LeadCounts; funnels: FunnelResult[] }` — this exact shape is what Task 6's UI work consumes.

- [ ] **Step 1: Write the failing test**

Create `test/unit/admin-analytics-ga4-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ requireStaff: vi.fn(async () => null) }));
vi.mock("@/lib/ga4", () => ({
  getChannels: vi.fn(async () => [{ channel: "Direct", sessions: 5, users: 5 }]),
  getTopSources: vi.fn(async () => []),
  getExitPages: vi.fn(async () => []),
  getTopVehicles: vi.fn(async () => []),
  getDeviceBreakdown: vi.fn(async () => []),
  getLeadCounts: vi.fn(async () => ({ form: 0, line: 0, call: 0 })),
  getFunnels: vi.fn(async () => []),
}));

beforeEach(() => {
  process.env.GA4_PROPERTY_ID = "123456";
});

describe("GET /api/admin/analytics/ga4", () => {
  it("returns configured:true and all sections when GA4 is set up", async () => {
    const { GET } = await import("@/app/api/admin/analytics/ga4/route");
    const req = new Request("http://localhost/api/admin/analytics/ga4?days=30");
    const res = await GET(req as unknown as import("next/server").NextRequest);
    const json = await res.json();
    expect(json.configured).toBe(true);
    expect(json.channels).toEqual([{ channel: "Direct", sessions: 5, users: 5 }]);
    expect(json.leadCounts).toEqual({ form: 0, line: 0, call: 0 });
  });

  it("returns configured:false and empty data when GA4_PROPERTY_ID is missing", async () => {
    delete process.env.GA4_PROPERTY_ID;
    const { GET } = await import("@/app/api/admin/analytics/ga4/route");
    const req = new Request("http://localhost/api/admin/analytics/ga4?days=30");
    const res = await GET(req as unknown as import("next/server").NextRequest);
    const json = await res.json();
    expect(json.configured).toBe(false);
    expect(json.channels).toEqual([]);
    expect(json.funnels).toEqual([]);
  });

  it("returns the denial response from requireStaff when not authorized", async () => {
    const { requireStaff } = await import("@/lib/admin-auth");
    (requireStaff as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    );
    const { GET } = await import("@/app/api/admin/analytics/ga4/route");
    const req = new Request("http://localhost/api/admin/analytics/ga4?days=30");
    const res = await GET(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test test/unit/admin-analytics-ga4-route.test.ts`
Expected: FAIL — module `@/app/api/admin/analytics/ga4/route` not found

- [ ] **Step 3: Implement the route**

Create `app/api/admin/analytics/ga4/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import {
  getChannels,
  getTopSources,
  getExitPages,
  getTopVehicles,
  getDeviceBreakdown,
  getLeadCounts,
  getFunnels,
} from "@/lib/ga4";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const configured = Boolean(process.env.GA4_PROPERTY_ID);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      channels: [],
      topSources: [],
      exitPages: [],
      topVehicles: [],
      deviceBreakdown: [],
      leadCounts: { form: 0, line: 0, call: 0 },
      funnels: [],
    });
  }

  const [channels, topSources, exitPages, topVehicles, deviceBreakdown, leadCounts, funnels] = await Promise.all([
    getChannels(days),
    getTopSources(days),
    getExitPages(days),
    getTopVehicles(days),
    getDeviceBreakdown(days),
    getLeadCounts(days),
    getFunnels(days),
  ]);

  return NextResponse.json({ configured: true, channels, topSources, exitPages, topVehicles, deviceBreakdown, leadCounts, funnels });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test test/unit/admin-analytics-ga4-route.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/analytics/ga4/route.ts test/unit/admin-analytics-ga4-route.test.ts
git commit -m "feat(analytics): add GET /api/admin/analytics/ga4 aggregation route"
```

---

### Task 6: Client-side event tracking (`lib/ga4-events.ts`) + wire into booking/contact

**Files:**
- Create: `lib/ga4-events.ts`
- Modify: `app/booking/page.tsx` (export `BookingType`; call `trackGenerateLead`)
- Modify: `app/contact/page.tsx` (call `trackGenerateLead`)
- Test: `test/unit/ga4-events.test.ts` (new)

**Interfaces:**
- Produces: `export type InquiryType = "test_drive" | "service" | "body_paint" | "contact"`, `export function trackGenerateLead(params: { inquiryType: InquiryType; branch?: string; carModel?: string }): void`, `export function trackClickLine(params: { path: string; lineUrl: string }): void`, `export function trackClickCall(params: { path: string; phone: string }): void`
- Consumes (in the two page edits): `window.gtag` indirectly via these wrappers only — no page calls `window.gtag` directly.

- [ ] **Step 1: Write the failing test**

Create `test/unit/ga4-events.test.ts`:

```ts
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

  it("trackClickLine fires click_line", () => {
    trackClickLine({ path: "/gwm", lineUrl: "https://lin.ee/abc" });
    expect(window.gtag).toHaveBeenCalledWith("event", "click_line", { path: "/gwm", line_url: "https://lin.ee/abc" });
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
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test test/unit/ga4-events.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `lib/ga4-events.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test test/unit/ga4-events.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Export `BookingType` and wire `trackGenerateLead` into `app/booking/page.tsx`**

In `app/booking/page.tsx`, change (around line 15):

```ts
type BookingType = "test_drive" | "service" | "body_paint" | "insurance_quote";
```

to:

```ts
export type BookingType = "test_drive" | "service" | "body_paint" | "insurance_quote";
```

Add the import near the top (alongside the existing `import { getBranchContact } from "@/lib/branchData";`):

```ts
import { trackGenerateLead } from "@/lib/ga4-events";
```

In `handleSubmit`, change (around lines 203–208):

```ts
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "ส่งไม่สำเร็จ"); return; }
      if (selectedType === "service" && result.spsSuccess === false) {
        toast.warning("บันทึกข้อมูลแล้ว แต่ระบบ SPS ยังไม่ได้รับข้อมูล ทีมงานจะติดต่อกลับ");
      }
      setSubmitted(true);
```

to:

```ts
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "ส่งไม่สำเร็จ"); return; }
      if (selectedType === "service" && result.spsSuccess === false) {
        toast.warning("บันทึกข้อมูลแล้ว แต่ระบบ SPS ยังไม่ได้รับข้อมูล ทีมงานจะติดต่อกลับ");
      }
      trackGenerateLead({
        inquiryType: selectedType === "insurance_quote" ? "contact" : selectedType,
        branch: form.branch || undefined,
        carModel: form.carModel || undefined,
      });
      setSubmitted(true);
```

(`insurance_quote` maps to `"contact"` for `inquiry_type` since `InquiryType` doesn't have a distinct `insurance_quote` value — this booking type isn't reachable from the UI's own type-selector today per the existing `bookingTypes` array, but the field exists in the shared union, so this keeps the call exhaustive and correctly typed rather than needing a cast.)

- [ ] **Step 6: Wire `trackGenerateLead` into `app/contact/page.tsx`**

Add the import near the top:

```ts
import { trackGenerateLead } from "@/lib/ga4-events";
```

Change (around lines 33–34):

```ts
      if (!res.ok) throw new Error();
      setSubmitted(true);
```

to:

```ts
      if (!res.ok) throw new Error();
      trackGenerateLead({ inquiryType: "contact", branch: form.branch || undefined });
      setSubmitted(true);
```

- [ ] **Step 7: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no new errors (confirms the `BookingType` export didn't break anything and the `inquiryType` union assignment is exhaustive)

- [ ] **Step 8: Commit**

```bash
git add lib/ga4-events.ts test/unit/ga4-events.test.ts app/booking/page.tsx app/contact/page.tsx
git commit -m "feat(analytics): fire generate_lead on successful booking/contact submission"
```

---

### Task 7: Outbound click tracker (LINE/phone) mounted globally

**Files:**
- Create: `components/OutboundClickTracker.tsx`
- Modify: `app/layout.tsx`
- Test: `test/unit/OutboundClickTracker.test.tsx` (new)

**Interfaces:**
- Consumes: `trackClickLine`, `trackClickCall` from `lib/ga4-events.ts` (Task 6).
- Produces: `export default function OutboundClickTracker(): null` — a client component with no visual output, mounted once in the root layout.

- [ ] **Step 1: Write the failing test**

Create `test/unit/OutboundClickTracker.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

const trackClickLine = vi.fn();
const trackClickCall = vi.fn();
vi.mock("@/lib/ga4-events", () => ({ trackClickLine, trackClickCall }));

import OutboundClickTracker from "@/components/OutboundClickTracker";

function clickLink(href: string) {
  const a = document.createElement("a");
  a.href = href;
  const span = document.createElement("span");
  span.textContent = "click me";
  a.appendChild(span);
  document.body.appendChild(a);
  span.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  document.body.removeChild(a);
}

describe("OutboundClickTracker", () => {
  beforeEach(() => {
    render(<OutboundClickTracker />);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fires trackClickCall for a tel: link, even when the click target is a nested child", () => {
    clickLink("tel:034305500");
    expect(trackClickCall).toHaveBeenCalledWith({ path: window.location.pathname, phone: "tel:034305500" });
  });

  it("fires trackClickLine for a line.me link", () => {
    clickLink("https://line.me/R/ti/p/@mazdach.erawan");
    expect(trackClickLine).toHaveBeenCalledWith({ path: window.location.pathname, lineUrl: "https://line.me/R/ti/p/@mazdach.erawan" });
  });

  it("fires trackClickLine for a lin.ee link", () => {
    clickLink("https://lin.ee/abc123");
    expect(trackClickLine).toHaveBeenCalled();
  });

  it("ignores unrelated links", () => {
    clickLink("/cars/mazda-cx-5-2025");
    expect(trackClickCall).not.toHaveBeenCalled();
    expect(trackClickLine).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun run test test/unit/OutboundClickTracker.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `components/OutboundClickTracker.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { trackClickLine, trackClickCall } from "@/lib/ga4-events";

/**
 * One global click listener instead of instrumenting every tel:/line.me/
 * lin.ee link across the site individually — several of those render inside
 * Server Components, so a per-link onClick isn't a small change. Purely
 * observational: never calls preventDefault, navigation proceeds normally.
 */
export default function OutboundClickTracker(): null {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const path = window.location.pathname;
      if (href.startsWith("tel:")) {
        trackClickCall({ path, phone: href });
      } else if (href.includes("line.me") || href.includes("lin.ee")) {
        trackClickLine({ path, lineUrl: href });
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bun run test test/unit/OutboundClickTracker.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Mount in `app/layout.tsx`**

Add the import near the other component imports:

```ts
import OutboundClickTracker from "@/components/OutboundClickTracker";
```

Add `<OutboundClickTracker />` in the `<body>`, alongside `<Analytics />`/`<SpeedInsights />` (after `<SpeedInsights />`, before the `GA_MEASUREMENT_ID &&` block):

```tsx
        <Analytics />
        <SpeedInsights />
        <OutboundClickTracker />
        {GA_MEASUREMENT_ID && (
```

- [ ] **Step 6: Typecheck and build**

Run: `bunx tsc --noEmit`
Run: `bun run build`
Expected: both clean

- [ ] **Step 7: Commit**

```bash
git add components/OutboundClickTracker.tsx test/unit/OutboundClickTracker.test.tsx app/layout.tsx
git commit -m "feat(analytics): track LINE/phone outbound clicks via one global listener"
```

---

### Task 8: `/admin/analytics` UI — render all new GA4 sections

**Files:**
- Modify: `app/admin/analytics/page.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/analytics/ga4?days=N` (Task 5) — response shape: `{ configured, channels, topSources, exitPages, topVehicles, deviceBreakdown, leadCounts, funnels }` (exact field names/types as defined in Tasks 1–4).

- [ ] **Step 1: Add the GA4 fetch alongside the existing business-events fetch**

In `app/admin/analytics/page.tsx`, add a type for the new response near the top (after the existing `AnalyticsData` type):

```ts
type ChannelRow = { channel: string; sessions: number; users: number };
type SourceRow = { source: string; medium: string; campaign: string | null; sessions: number };
type ExitPageRow = { path: string; exits: number; entrances: number; bounceRate: number };
type VehicleRow = { slug: string; label: string; views: number };
type DeviceRow = { device: string; sessions: number };
type LeadCounts = { form: number; line: number; call: number };
type FunnelStepResult = { name: string; users: number; completionRate: number };
type FunnelResult = { key: string; label: string; steps: FunnelStepResult[] };

type Ga4Data = {
  configured: boolean;
  channels: ChannelRow[];
  topSources: SourceRow[];
  exitPages: ExitPageRow[];
  topVehicles: VehicleRow[];
  deviceBreakdown: DeviceRow[];
  leadCounts: LeadCounts;
  funnels: FunnelResult[];
};
```

Add state and fetch logic inside `AnalyticsPage`, alongside the existing `data`/`load` state:

```ts
  const [ga4, setGa4] = useState<Ga4Data | null>(null);

  async function loadGa4(d: number) {
    try {
      const res = await fetch(`/api/admin/analytics/ga4?days=${d}`);
      setGa4(await res.json());
    } catch {
      setGa4(null);
    }
  }
```

Change the existing `useEffect(() => { load(days); }, [days]);` to also fetch GA4 data:

```ts
  useEffect(() => { load(days); loadGa4(days); }, [days]);
```

- [ ] **Step 2: Replace the Vercel Analytics card with the Lead Counts row**

Replace this block (the `{/* Vercel Analytics link */}` section):

```tsx
      {/* Vercel Analytics link */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1e293b] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-white/60" />
          <div>
            <p className="text-white font-medium text-sm">Vercel Analytics</p>
            <p className="text-white/50 text-xs">Page views, unique visitors, Web Vitals, referrers</p>
          </div>
        </div>
        <a
          href="https://vercel.com/ch-erawan/ch-erawanwebsite/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          เปิด Dashboard →
        </a>
      </div>
```

with:

```tsx
      {/* GA4 not configured banner */}
      {ga4 && !ga4.configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ยังไม่ได้ตั้งค่า GA4 — ดู <code className="font-mono">specs/env-vars.md</code>
        </div>
      )}

      {/* Lead counts */}
      {ga4?.configured && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Leads — {days} วันล่าสุด
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="จองผ่านฟอร์ม" value={ga4.leadCounts.form} icon={Calendar} color="#0F172A" />
            <StatCard label="ทัก LINE" value={ga4.leadCounts.line} icon={MessageSquare} color="#06C755" />
            <StatCard label="โทรศัพท์" value={ga4.leadCounts.call} icon={Phone} color="#3B82F6" />
          </div>
        </div>
      )}
```

This reuses the existing `StatCard` component already defined in this file. Add the two new icon imports to the existing `lucide-react` import line:

```ts
import {
  Car, Calendar, Mail, TrendingUp, Eye, BarChart2, Clock, RefreshCw, MessageSquare, Phone, Smartphone, Monitor,
} from "lucide-react";
```

(`BarChart2` stays imported even though the Vercel Analytics card was removed — it's no longer used elsewhere in this file, so remove it from the import list instead: final import line is `Car, Calendar, Mail, TrendingUp, Eye, Clock, RefreshCw, MessageSquare, Phone, Smartphone, Monitor`.)

- [ ] **Step 2b: Run typecheck to confirm no unused-import or missing-import errors so far**

Run: `bunx tsc --noEmit`

- [ ] **Step 3: Add Traffic Sources, Top Vehicles, Exit Pages, Device split, and Funnels sections**

Insert this block right after the "Recent events" `<div>` block, before the closing `</div>` of the page's root container (i.e., as the last sections on the page):

```tsx
      {ga4?.configured && (
        <>
          {/* Traffic Sources */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Traffic Sources</h2>
              {ga4.channels.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
              <div className="space-y-2">
                {ga4.channels.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#0F172A]">{c.channel}</span>
                    <span className="font-semibold text-gray-700">{c.sessions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Top Sources / Campaigns</h2>
              {ga4.topSources.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
              <div className="space-y-2">
                {ga4.topSources.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#0F172A] truncate">
                      {s.source} / {s.medium}
                      {s.campaign && <span className="text-gray-400"> · {s.campaign}</span>}
                    </span>
                    <span className="font-semibold text-gray-700 shrink-0 ml-2">{s.sessions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Vehicles + Device split */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#0F172A] mb-4">รถที่มีคนสนใจมากที่สุด</h2>
              {ga4.topVehicles.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
              <div className="space-y-2">
                {ga4.topVehicles.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#0F172A] truncate">{v.label}</span>
                    <span className="font-semibold text-gray-700 shrink-0 ml-2">{v.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Mobile vs Desktop</h2>
              {ga4.deviceBreakdown.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
              <div className="space-y-3">
                {ga4.deviceBreakdown.map((d, i) => {
                  const max = ga4.deviceBreakdown[0]?.sessions ?? 1;
                  const pct = Math.round((d.sessions / max) * 100);
                  const Icon = d.device === "mobile" ? Smartphone : Monitor;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="flex items-center gap-1.5 text-[#0F172A]"><Icon className="w-3.5 h-3.5" />{d.device}</span>
                        <span className="text-gray-500">{d.sessions.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0F172A] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Exit Pages */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-4">หน้าที่คนออกจากเว็บมากที่สุด</h2>
            {ga4.exitPages.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">หน้า</th>
                    <th className="pb-2 font-medium text-right">Entrances</th>
                    <th className="pb-2 font-medium text-right">Exits</th>
                    <th className="pb-2 font-medium text-right">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4.exitPages.filter((p) => p.entrances >= 10).map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-[#0F172A] truncate max-w-[240px]">{p.path}</td>
                      <td className="py-2 text-right text-gray-600">{p.entrances.toLocaleString()}</td>
                      <td className="py-2 text-right text-gray-600">{p.exits.toLocaleString()}</td>
                      <td className="py-2 text-right text-gray-600">{p.bounceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Funnels */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Funnel — เส้นทางสำคัญ</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {ga4.funnels.map((f) => {
                const maxUsers = f.steps[0]?.users ?? 1;
                return (
                  <div key={f.key} className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm font-semibold text-[#0F172A] mb-4">{f.label}</p>
                    {f.steps.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
                    ) : (
                      <div className="space-y-3">
                        {f.steps.map((s, i) => {
                          const pct = maxUsers > 0 ? Math.round((s.users / maxUsers) * 100) : 0;
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1 text-xs">
                                <span className="text-[#0F172A]">{s.name}</span>
                                <span className="text-gray-500">{s.users.toLocaleString()} ({s.completionRate}%)</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#DD5259] rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
```

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Build**

Run: `bun run build`
Expected: succeeds, `/admin/analytics` route listed

- [ ] **Step 6: Run the full test suite**

Run: `bun run test`
Expected: same pre-existing `notion-promotions.test.ts` failures as before this plan (unrelated Notion Title/Name property bug — confirmed pre-existing earlier this session), no new failures.

- [ ] **Step 7: Commit**

```bash
git add app/admin/analytics/page.tsx
git commit -m "feat(analytics): render GA4 traffic/vehicles/exit-pages/device/funnels in /admin/analytics"
```

---

## Post-Implementation (manual, not part of this plan)

These are the user's own action items from the spec — not implementation tasks, do not create code for them:

1. Add `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY` to Vercel (production, and staging if staging traffic should be readable) — currently only in local `.env.local`.
2. Register `inquiry_type` and `branch` as Event-scoped custom dimensions in GA4 → Admin → Custom definitions (24–48h propagation).
3. Once real traffic/leads exist, spot-check `/admin/analytics` against GA4's own UI to sanity-check the numbers, and re-inspect a real (non-empty) `runFunnelReport` response to confirm Task 1's defensive parser handles it correctly — adjust if the real row shape differs from the hand-built test fixture.
