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
          { name: "funnelStepAbandonments", type: "TYPE_INTEGER" },
          { name: "funnelStepAbandonmentRate", type: "TYPE_INTEGER" },
          { name: "activeUsers", type: "TYPE_INTEGER" },
          { name: "funnelStepCompletionRate", type: "TYPE_INTEGER" },
        ],
        rows: [
          { dimensionValues: [{ value: "step1" }], metricValues: [{ value: "0" }, { value: "0" }, { value: "100" }, { value: "100" }] },
          { dimensionValues: [{ value: "step2" }], metricValues: [{ value: "60" }, { value: "60" }, { value: "40" }, { value: "40" }] },
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

describe("getExitPages / getTopVehicles / getLeadCounts", () => {
  it("getExitPages maps page rows sorted by exits", async () => {
    mockRunReport.mockResolvedValueOnce([{
      rows: [
        { dimensionValues: [{ value: "/cars" }], metricValues: [{ value: "40" }, { value: "60" }, { value: "0.455" }] },
        { dimensionValues: [{ value: "/booking" }], metricValues: [{ value: "25" }, { value: "30" }, { value: "0.5" }] },
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

describe("runGa4Report error handling", () => {
  it("getChannels resolves to [] when the underlying runReport call rejects", async () => {
    mockRunReport.mockRejectedValueOnce(new Error("GA4 down"));
    const { getChannels } = await import("@/lib/ga4");
    const result = await getChannels(30);
    expect(result).toEqual([]);
  });
});

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
