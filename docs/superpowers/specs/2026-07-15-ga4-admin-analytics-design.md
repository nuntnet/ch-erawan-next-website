# GA4 Admin Analytics Design

## Goal

Extend `/admin/analytics` with real GA4-backed data so staff can see: traffic sources/channels (organic, ads, social, direct, referral), why users left the site (exit-page + bounce-rate signal), and where users get stuck in a handful of key conversion journeys (funnel drop-off).

## Background

- GA4 tracking (`gtag.js`) was wired into `app/layout.tsx` this session, gated behind `NEXT_PUBLIC_GA_MEASUREMENT_ID`. **That env var is not yet set in Vercel production**, so the GA4 property (399827199) currently has zero real traffic.
- `lib/ga4.ts` already has `runGa4Report()`, backed by a service account (`GA4_PROPERTY_ID`/`GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY` in `.env.local`, not yet in Vercel), verified working against the real property.
- `/admin/analytics` already exists: business-event cards (car_view/booking/contact/search from the homegrown `analytics_events` Turso table), a daily activity chart, top cars/brands, recent events, and a card linking out to Vercel Analytics for pageview data.
- Explicit user decisions from brainstorming:
  - Journey/stuck-point analysis is scoped to **funnels for 4 specific flows**, not an open-ended path graph (that would need BigQuery export or GA4's own Explore UI — out of scope).
  - GA4 data lives in the **same** `/admin/analytics` page (new sections), not a separate page.
  - Same 7/30/90-day range selector already on the page.

## Technical Discovery (validated live against the real property)

- GA4 Data API (`runReport`, stable v1beta, already used by `runGa4Report()`) supports:
  - `sessionDefaultChannelGroup` dimension → Organic Search / Paid Search / Organic Social / Paid Social / Direct / Referral / Email / etc.
  - `sessionSource` / `sessionSourceMedium` dimensions → top traffic sources.
  - `pagePath` dimension + `exits` / `entrances` / `bounceRate` / `screenPageViews` metrics → exit-page analysis. GA4 has no literal "reason" a user left; exit count + bounce rate on a page is the actionable proxy ("this page is where people bail, and it happens right after landing").
- GA4's **Funnel Reporting API** (`v1alpha`, `:runFunnelReport`) gives true sequential step-by-step drop-off (not just an aggregate proxy). Confirmed working with the existing service account via a raw authenticated REST call:
  - The installed `@google-analytics/data` v6.1.0 package does **not** export an `AlphaAnalyticsDataClient`, so this is called directly via `fetch` against `https://analyticsdata.googleapis.com/v1alpha/properties/{id}:runFunnelReport`, authenticated with an access token obtained via `google-auth-library`'s `GoogleAuth` (already a transitive dependency of `@google-analytics/data`), reusing the same `GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY` credentials.
  - Funnel step filters must use the `pageLocation` dimension (full URL) with `stringFilter: { matchType: "CONTAINS", value: "..." }` — the `pagePath` dimension is explicitly rejected by this API ("not currently supported inside segments & funnel steps"). Verified: `pageLocation`, `unifiedScreenName`, `eventName`, `hostName` are accepted; `pagePath` and `fullPageUrl` are not.
  - Response shape: `funnelTable.dimensionHeaders` (`funnelStepName`), `metricHeaders` (`activeUsers`, `funnelStepCompletionRate` — need to confirm exact metric name casing/precision during implementation by inspecting a real response), rows per step.

## Data Layer

### `lib/ga4.ts` additions

```ts
export type ChannelRow = { channel: string; sessions: number; users: number };
export type SourceRow = { source: string; medium: string; sessions: number };
export type ExitPageRow = { path: string; exits: number; entrances: number; bounceRate: number };
export type FunnelStep = { name: string; users: number; completionRate: number };
export type FunnelResult = { key: string; label: string; steps: FunnelStep[] };

export async function getChannels(days: number): Promise<ChannelRow[]>
export async function getTopSources(days: number): Promise<SourceRow[]>
export async function getExitPages(days: number): Promise<ExitPageRow[]>
export async function runGa4Funnel(steps: { name: string; urlContains: string | string[] }[], days: number): Promise<FunnelStep[]>
```

- `getChannels`/`getTopSources`/`getExitPages` build on the existing `runGa4Report()` helper (stable v1beta).
- `runGa4Funnel` is new — raw REST call to the v1alpha Funnel API as described above. Each step's `urlContains` can be a single string (single CONTAINS filter) or an array (OR'd via `orGroup`, e.g. promotions funnel's "booking OR contact" step). Steps needing an AND of two conditions (e.g. `/booking` AND `type=test_drive`) use `andGroup` — to be validated against a real multi-condition request during implementation; if `andGroup` isn't accepted inside a funnel step filter, fall back to a single CONTAINS on a more specific substring (e.g. `"booking?type=test_drive"` or `"booking%3Ftype%3Dtest_drive"` depending on how GA4 records the query string) and note the caveat in a code comment.
- All GA4 functions return an empty/neutral result (not throw) when `GA4_PROPERTY_ID`/`GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY` aren't configured, matching `runGa4Report()`'s existing null-safe pattern — so a deployment without these env vars (e.g. staging) just shows empty states, never 500s.

### Funnel definitions (hardcoded, not user-configurable — 4 funnels agreed in brainstorming)

```ts
const FUNNELS = [
  {
    key: "test_drive",
    label: "หน้ารถ → ดูรถ → จองทดลองขับ",
    steps: [
      { name: "หน้ารายการรถ", urlContains: "/cars" },
      { name: "หน้ารายละเอียดรถ", urlContains: "/cars/" }, // trailing slash excludes the bare listing page
      { name: "จองทดลองขับ", urlContains: "booking" }, // AND type=test_drive — see caveat above
    ],
  },
  {
    key: "service",
    label: "หน้าแบรนด์บริการ → จองเข้าศูนย์บริการ",
    steps: [
      { name: "หน้าบริการ", urlContains: "/service" },
      { name: "จองเข้าศูนย์บริการ", urlContains: "booking" }, // AND type=service
    ],
  },
  {
    key: "promotions",
    label: "โปรโมชั่น → จองทดลองขับ/ติดต่อ",
    steps: [
      { name: "หน้าโปรโมชั่น", urlContains: "/promotions" },
      { name: "จอง/ติดต่อ", urlContains: ["/booking", "/contact"] },
    ],
  },
  {
    key: "blog",
    label: "บทความ/บล็อก → จองทดลองขับ",
    steps: [
      { name: "หน้าบทความ", urlContains: "/blog/" },
      { name: "จองทดลองขับ", urlContains: "/booking" },
    ],
  },
];
```

## API Route

**`GET /api/admin/analytics/ga4?days=7|30|90`** (new file, `requireStaff()`-gated like the existing `/api/admin/analytics`):

```ts
type Ga4Response = {
  configured: boolean; // false if env vars missing — page shows a distinct "not configured" state
  channels: ChannelRow[];
  topSources: SourceRow[];
  exitPages: ExitPageRow[];
  funnels: FunnelResult[];
};
```

Runs all four GA4 queries (channels, sources, exit pages, 4× funnel) in parallel via `Promise.all`. If `configured` is false (env vars missing), skips the GA4 calls entirely and returns empty arrays immediately rather than making doomed API calls.

## UI Changes — `app/admin/analytics/page.tsx`

- Fetch GA4 data alongside the existing business-events fetch (same `days` state, same 7/30/90 selector — one extra `fetch('/api/admin/analytics/ga4?days=...')` call).
- **Replace** the current "Vercel Analytics" external-link gradient card with a **Traffic Sources** section: a channel-breakdown bar (Recharts, consistent with the rest of the page) plus a small ranked list of top source/medium. (Vercel Analytics link can move into a smaller secondary link if still wanted — default: remove it since GA4 now covers this natively inside the panel.)
- **New "หน้าที่คนออกจากเว็บมากที่สุด" (Exit Pages)** table: path, entrances, exits, bounce rate, sorted by exits descending, only among pages with a minimum entrance threshold (e.g. ≥10) to avoid noise from one-off paths.
- **New "Funnel — เส้นทางสำคัญ"** section: one card per funnel (4 total), each rendering its steps as a simple horizontal step-bar (width proportional to `activeUsers` at that step) with the completion/drop-off % labeled between consecutive steps. Reuses Recharts or plain divs with computed widths — implementation detail decided during planning, not a hard requirement here.
- **Empty/not-configured states**: if `configured` is `false`, show one unobtrusive banner ("ยังไม่ได้ตั้งค่า GA4 — ดู `specs/env-vars.md`") instead of three separate empty sections. If `configured` is `true` but a given section has zero rows (expected right now, since prod traffic hasn't started), each section shows the page's existing "ยังไม่มีข้อมูล" empty-state pattern already used elsewhere on this page.

## Error Handling

- GA4 API calls can fail (quota, transient network, alpha API instability). Each of the four `lib/ga4.ts` functions catches its own errors and returns `[]`/empty result with a `console.error`, matching `runGa4Report()`'s existing null-on-misconfiguration pattern extended to null-on-error — so one failing GA4 call never takes down the whole `/admin/analytics` page or the other (working) sections.

## Testing

- Unit tests for `lib/ga4.ts`'s new functions mock the network layer (`fetch` for the funnel calls, the `BetaAnalyticsDataClient` for the report calls) — no test hits the real GA4 API.
- Unit test for the new API route verifies the response shape and the `configured: false` short-circuit path.
- Manual/live verification: once `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in Vercel prod and real traffic starts flowing (this may take hours/days after deploy), re-check the live page to confirm real numbers render correctly — this can't be verified before real traffic exists, so initial implementation verification will use the 4 funnels' *current* zero-data empty states, not real numbers.

## Out of Scope (explicitly, per brainstorming)

- Full open-ended path/journey visualization (Sankey of all possible page-to-page flows) — would require BigQuery export linkage.
- User-configurable funnel builder — the 4 funnels are hardcoded based on this session's decisions; adding a 5th funnel later means editing the `FUNNELS` array in code, not a UI form.
- Real-time/live visitor view — out of scope, not requested.
