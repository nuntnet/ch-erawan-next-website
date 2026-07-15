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
