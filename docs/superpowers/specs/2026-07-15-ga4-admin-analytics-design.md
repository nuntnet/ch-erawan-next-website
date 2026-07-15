# GA4 Admin Analytics Design

**Revision note (v2):** after the v1 draft below was reviewed, a real flaw was caught — the original funnels measured "completion" by landing on `/booking`'s URL, not by an actual successful submission. This revision fixes that (funnels now end on a real `generate_lead` event), and adds LINE/phone outbound-click tracking, a top-vehicles (VDP) table, campaign-name tracking, and device-category breakdown, per that review. Corrected against the actual codebase: brand slugs are `mazda`/`ford`/`mitsubishi`/`gwm`/`deepal`/`kia`/`gac`/`lepas` (`lib/brandConfig.ts`), branch IDs are like `deepal-salaya`/`ford-omnoi`/`mitsubishi-nakhonpathom` (`lib/branchData.ts`) — not the generic placeholder names from the review.

## Goal

Extend `/admin/analytics` with real GA4-backed data so staff can see: traffic sources/channels (organic, ads, social, direct, referral, campaign), why users left the site (exit-page + bounce-rate signal), which specific vehicles are getting traction, how many real leads came in split by channel (web form / LINE / phone), and where users get stuck in a handful of key conversion journeys (funnel drop-off, measured by actual submission success — not just page views).

## Background

- GA4 tracking (`gtag.js`) was wired into `app/layout.tsx` this session, gated behind `NEXT_PUBLIC_GA_MEASUREMENT_ID`. **That env var is now set in Vercel production** (added after the v1 draft) — a deploy has gone out, so real traffic will start accumulating in the GA4 property (399827199) over the following hours.
- `lib/ga4.ts` already has `runGa4Report()`, backed by a service account (`GA4_PROPERTY_ID`/`GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY` in `.env.local`, not yet in Vercel), verified working against the real property.
- `/admin/analytics` already exists: business-event cards (car_view/booking/contact/search from the homegrown `analytics_events` Turso table), a daily activity chart, top cars/brands, recent events, and a card linking out to Vercel Analytics for pageview data.
- Explicit user decisions from brainstorming:
  - Journey/stuck-point analysis is scoped to **funnels for 4 specific flows**, not an open-ended path graph (that would need BigQuery export or GA4's own Explore UI — out of scope).
  - GA4 data lives in the **same** `/admin/analytics` page (new sections), not a separate page.
  - Same 7/30/90-day range selector already on the page.
  - (v2) Funnel completion must be measured by a real `generate_lead` event, not a URL visit. LINE/phone clicks are real leads and must be tracked. Top-vehicle popularity, campaign name, and device category are worth adding since they're low-cost (existing GA4 dimensions, no new instrumentation) or high-value (outbound click tracking).

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
export type SourceRow = { source: string; medium: string; campaign: string | null; sessions: number };
export type ExitPageRow = { path: string; exits: number; entrances: number; bounceRate: number };
export type VehicleRow = { slug: string; label: string; views: number; avgEngagementSec: number };
export type DeviceRow = { device: string; sessions: number };
export type LeadCounts = { form: number; line: number; call: number };
export type FunnelStep = { name: string; users: number; completionRate: number };
export type FunnelResult = { key: string; label: string; steps: FunnelStep[] };

export async function getChannels(days: number): Promise<ChannelRow[]>
export async function getTopSources(days: number): Promise<SourceRow[]> // now includes sessionCampaignName
export async function getExitPages(days: number): Promise<ExitPageRow[]>
export async function getTopVehicles(days: number): Promise<VehicleRow[]>
export async function getDeviceBreakdown(days: number): Promise<DeviceRow[]>
export async function getLeadCounts(days: number): Promise<LeadCounts>
export async function runGa4Funnel(steps: FunnelStepDef[], days: number): Promise<FunnelStep[]>
```

- `getChannels`/`getTopSources`/`getExitPages`/`getDeviceBreakdown` build on the existing `runGa4Report()` helper (stable v1beta). `getTopSources` adds the `sessionCampaignName` dimension alongside the existing source/medium, so paid campaigns (e.g. a Facebook "July Motor Show" push) are attributable, not just lumped into "Paid Social."
- `getTopVehicles` queries `runGa4Report()` with `pagePath` dimension filtered to `BEGINS_WITH "/cars/"`, metrics `screenPageViews` + `userEngagementDuration`, then resolves each path's slug against `lib/brandConfig.ts`'s existing car list (already has slug → brand/model mappings — reuse it, don't re-derive names by parsing the slug string) to produce a human-readable `label` (falls back to the raw slug if not found, e.g. a since-removed car).
- `getLeadCounts` runs one `runGa4Report()` call with `eventName` dimension filtered to `generate_lead`/`click_line`/`click_call` (`inListFilter`) and metric `eventCount`, mapped into the three named counts.
- `runGa4Funnel` takes the richer step-definition shape shown in the Funnel definitions section (`field`/`matchType`/`value`, supporting both `pageLocation` and `eventName` fields) — raw REST call to the v1alpha Funnel API as described above. Steps needing multiple OR'd values (e.g. promotions funnel's old "booking OR contact" step — now replaced by `generate_lead`, so this no longer applies, but the capability stays for future funnels) use `orGroup`; AND-of-two-conditions (e.g., `eventName=generate_lead` AND `inquiry_type=test_drive`) is the open parameter-filter question flagged above.
- All GA4 functions return an empty/neutral result (not throw) when `GA4_PROPERTY_ID`/`GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY` aren't configured, matching `runGa4Report()`'s existing null-safe pattern — so a deployment without these env vars (e.g. staging) just shows empty states, never 500s.

### Funnel definitions (hardcoded, not user-configurable — 4 funnels agreed in brainstorming)

**(v2 fix)** Each funnel's *final* step is now the real `generate_lead` event (fired only on an actual successful submission — see Client-Side Event Instrumentation below), not a `/booking` URL visit. Earlier steps stay URL-based (`pageLocation` CONTAINS) since they're genuinely about page-viewing behavior, not conversions.

```ts
const FUNNELS = [
  {
    key: "test_drive",
    label: "หน้ารถ → ดูรถ → จองทดลองขับสำเร็จ",
    steps: [
      { name: "หน้ารายการรถ", field: "pageLocation", matchType: "CONTAINS", value: "/cars" },
      { name: "หน้ารายละเอียดรถ", field: "pageLocation", matchType: "CONTAINS", value: "/cars/" }, // trailing slash excludes the bare listing page
      { name: "จองทดลองขับสำเร็จ", field: "eventName", matchType: "EXACT", value: "generate_lead" },
      // Ideally scoped to inquiry_type=test_drive too — see parameter-filter caveat below.
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
```

**Parameter-filter caveat (to resolve during implementation):** ideally each funnel's final step would also filter on `inquiry_type` (e.g. only count `generate_lead` events where `inquiry_type=test_drive` for the test-drive funnel), so the 4 funnels don't all share the exact same "any lead" final step. This requires `inquiry_type` to be registered as a GA4 custom dimension first (user's manual step, see below; 24–48h propagation) *and* the alpha Funnel API's `fieldName` schema to accept custom-dimension names the same way it accepted `pageLocation` (confirmed) and `eventName` (confirmed) — not yet verified for custom event parameters. Implementation must test this directly; if unsupported, all 4 funnels' final step stays as "any `generate_lead`" and the split-by-`inquiry_type` view lives instead in the separate Lead Counts widget (below), not inside the funnel itself.

## Client-Side Event Instrumentation (new — v2)

Three new GA4 custom events, fired from the browser via `gtag`. A new file, **`lib/ga4-events.ts`** (`"use client"`-safe, distinct from the existing server-side `lib/ga4.ts` reader and `lib/analytics.ts`'s homegrown Turso writer — three separate concerns, three separate files), exports typed wrapper functions so no component calls `window.gtag(...)` directly:

```ts
export type InquiryType = "test_drive" | "service" | "body_paint" | "contact";

export function trackGenerateLead(params: { inquiryType: InquiryType; branch?: string; carModel?: string }): void
export function trackClickLine(params: { path: string; lineUrl: string }): void
export function trackClickCall(params: { path: string; phone: string }): void
```

Each is a no-op if `window.gtag` isn't present (e.g. GA4 not configured, or ad-blocker) — never throws.

**`generate_lead`** — two call sites, both already client components with a clear success branch:
- `app/booking/page.tsx`, `handleSubmit`, right before `setSubmitted(true)` (~line 208, after the `!res.ok` early-return and the `spsSuccess` toast). Params: `inquiryType: selectedType` (reusing the existing `BookingType` union already defined at line 15 — export it instead of redefining), `branch: form.branch`, `carModel: form.carModel`.
- `app/contact/page.tsx`, `handleSubmit`, right before its `setSubmitted`-equivalent (~line 34, after the `!res.ok` throw). Params: `inquiryType: "contact"`, `branch: form.branch`.

Deliberately **not** adding a separate `dealer_brand` parameter: in this codebase, branch names already encode the brand (e.g. "มาสด้า ช.เอราวัณ ศาลายา" starts with the brand name), so a second dimension would be redundant. Brand-level grouping can be done downstream by matching on `branch`.

**`click_line` / `click_call`** — rather than editing the 9+ files that currently render `tel:`/`line.me`/`lin.ee` links directly (`Navbar.tsx`, `Footer.tsx`, `LineOAFloat.tsx`, `CallToAction.tsx`, `HomeClient.tsx`, `career`/`feedback`/`insurance` pages, per-brand `promotions` pages — several of which are Server Components, so adding an `onClick` to each isn't a small change), add **one new client component, `components/OutboundClickTracker.tsx`**, mounted once in `app/layout.tsx` alongside the existing `<Analytics />`/`<SpeedInsights />`. It attaches a single document-level click listener (event delegation) that:
1. Finds the closest `<a>` ancestor of the clicked element.
2. If its `href` starts with `tel:` → calls `trackClickCall({ path: location.pathname, phone: href })`.
3. If its `href` contains `line.me` or `lin.ee` → calls `trackClickLine({ path: location.pathname, lineUrl: href })`.
4. Never calls `preventDefault()` — purely observational, navigation proceeds normally.

This covers every existing and future LINE/phone link on the site with zero changes to the files that render them. Brand can be derived later from `path` (e.g. `/gwm/...` → GWM) when analyzing the data, same reasoning as `generate_lead` above.

## Manual Setup Required (user action, not automatable)

1. **Add the GA4 Data API service-account credentials to Vercel** (`GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`) — these currently exist only in local `.env.local`. Without them set in Vercel (production, and staging too if staging traffic should be readable), `/admin/analytics`'s `configured` flag will be `false` in the deployed app even after this feature ships, and every GA4 section will show the "not configured" banner instead of real data.
2. Register these as **Event-scoped custom dimensions** in GA4 → Admin → Custom definitions (each takes 24–48h to start appearing in reports after registration):

| Dimension name (UI) | Event parameter | Used by |
|---|---|---|
| Inquiry Type | `inquiry_type` | `generate_lead` — needed for the parameter-filtered funnel steps (if supported) and the Lead Counts breakdown |
| Branch | `branch` | `generate_lead` |

`click_line`/`click_call`'s params (`line_url`, `phone`) are optional to register — the dashboard's lead-count widgets only need `eventName`-level counts (`click_line` vs `click_call`), which don't require custom-dimension registration.

## API Route

**`GET /api/admin/analytics/ga4?days=7|30|90`** (new file, `requireStaff()`-gated like the existing `/api/admin/analytics`):

```ts
type Ga4Response = {
  configured: boolean; // false if env vars missing — page shows a distinct "not configured" state
  channels: ChannelRow[];
  topSources: SourceRow[];
  exitPages: ExitPageRow[];
  topVehicles: VehicleRow[];
  deviceBreakdown: DeviceRow[];
  leadCounts: LeadCounts;
  funnels: FunnelResult[];
};
```

Runs all GA4 queries (channels, sources, exit pages, top vehicles, device breakdown, lead counts, 4× funnel) in parallel via `Promise.all`. If `configured` is false (env vars missing), skips the GA4 calls entirely and returns empty arrays/zeroed counts immediately rather than making doomed API calls.

## UI Changes — `app/admin/analytics/page.tsx`

- Fetch GA4 data alongside the existing business-events fetch (same `days` state, same 7/30/90 selector — one extra `fetch('/api/admin/analytics/ga4?days=...')` call).
- **Replace** the current "Vercel Analytics" external-link gradient card with a **Lead Counts** stat row: three numbers — "จองผ่านฟอร์ม" (form), "ทัก LINE" (line), "โทรศัพท์" (call) — the direct answer to "how many real leads, by channel." (Vercel Analytics link can move into a smaller secondary link if still wanted — default: remove it since GA4 now covers this natively inside the panel.)
- **New "Traffic Sources" section**: a channel-breakdown bar (Recharts, consistent with the rest of the page) plus a ranked list of top source/medium/campaign — so a specific paid campaign (e.g. "July Motor Show" on Facebook) is visible, not just lumped into "Paid Social."
- **New "รถที่มีคนสนใจมากที่สุด" (Top Vehicles)** table: model name (resolved via `brandConfig.ts`, not a raw slug), views, average engagement time — sorted by views descending.
- **New "หน้าที่คนออกจากเว็บมากที่สุด" (Exit Pages)** table: path, entrances, exits, bounce rate, sorted by exits descending, only among pages with a minimum entrance threshold (e.g. ≥10) to avoid noise from one-off paths.
- **New small "Mobile vs Desktop" widget**: simple device-category split (pie or two stat numbers).
- **New "Funnel — เส้นทางสำคัญ"** section: one card per funnel (4 total), each rendering its steps as a simple horizontal step-bar (width proportional to `activeUsers` at that step) with the completion/drop-off % labeled between consecutive steps, final step now backed by real `generate_lead` events. Reuses Recharts or plain divs with computed widths — implementation detail decided during planning, not a hard requirement here.
- **Empty/not-configured states**: if `configured` is `false`, show one unobtrusive banner ("ยังไม่ได้ตั้งค่า GA4 — ดู `specs/env-vars.md`") instead of separate empty sections everywhere. If `configured` is `true` but a given section has zero rows (expected for a while, since prod traffic just started flowing and `generate_lead`/`click_line`/`click_call` are brand-new events with no historical data), each section shows the page's existing "ยังไม่มีข้อมูล" empty-state pattern already used elsewhere on this page.

## Error Handling

- GA4 API calls can fail (quota, transient network, alpha API instability). Each of the four `lib/ga4.ts` functions catches its own errors and returns `[]`/empty result with a `console.error`, matching `runGa4Report()`'s existing null-on-misconfiguration pattern extended to null-on-error — so one failing GA4 call never takes down the whole `/admin/analytics` page or the other (working) sections.

## Testing

- Unit tests for `lib/ga4.ts`'s functions (existing + new: `getTopVehicles`, `getDeviceBreakdown`, `getLeadCounts`) mock the network layer (`fetch` for the funnel calls, the `BetaAnalyticsDataClient` for the report calls) — no test hits the real GA4 API.
- Unit test for the new API route verifies the response shape and the `configured: false` short-circuit path.
- Unit test for `lib/ga4-events.ts`'s three tracking functions verifies they call `window.gtag` with the right event name/params, and are silent no-ops when `window.gtag` is undefined.
- Unit test for `components/OutboundClickTracker.tsx`'s href-matching logic (tel:/line.me/lin.ee detection) in isolation — doesn't need a real DOM click, just the matching function.
- Manual/live verification once deployed: click a LINE link and a phone link on the live site and confirm `click_line`/`click_call` fire (checkable via GA4's DebugView or browser network tab showing a request to `google-analytics.com/g/collect`); submit a real test booking/contact form and confirm `generate_lead` fires the same way. Confirming the numbers show up in `/admin/analytics`'s reports takes longer (GA4 processing lag, typically a few hours) and can't be verified same-day as implementation.

## Out of Scope (explicitly, per brainstorming)

- Full open-ended path/journey visualization (Sankey of all possible page-to-page flows) — would require BigQuery export linkage.
- User-configurable funnel builder — the 4 funnels are hardcoded based on this session's decisions; adding a 5th funnel later means editing the `FUNNELS` array in code, not a UI form.
- Real-time/live visitor view — out of scope, not requested.
- A separate `dealer_brand` event parameter — redundant in this codebase, since branch names already encode brand (see Client-Side Event Instrumentation).
- `download_brochure` event — no brochure-download feature exists on the site today; add later if that feature ships.
- `view_car_model`/`view_promotion` as dedicated custom events — unnecessary; both are already fully answerable from GA4's existing `pagePath` pageview data (Top Vehicles table, and Exit Pages/channels already cover promotion-page traffic), no new instrumentation needed.
