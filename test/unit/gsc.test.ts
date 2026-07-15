import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetAccessToken } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn(async () => ({ token: "fake-token" })),
}));

vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn(function () {
    return { getClient: vi.fn(async () => ({ getAccessToken: mockGetAccessToken })) };
  }),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  process.env.GA4_CLIENT_EMAIL = "test@example.iam.gserviceaccount.com";
  process.env.GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nFAKE\\n-----END PRIVATE KEY-----\\n";
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
  delete process.env.GA4_CLIENT_EMAIL;
  delete process.env.GA4_PRIVATE_KEY;
});

function mockRows(rows: unknown[]) {
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ rows }) })) as unknown as typeof fetch;
}

describe("isGscConfigured", () => {
  it("true when service-account creds present", async () => {
    const { isGscConfigured } = await import("@/lib/gsc");
    expect(isGscConfigured()).toBe(true);
  });
  it("false when creds missing", async () => {
    delete process.env.GA4_PRIVATE_KEY;
    const { isGscConfigured } = await import("@/lib/gsc");
    expect(isGscConfigured()).toBe(false);
  });
});

describe("getTopKeywords", () => {
  it("maps rows and converts ctr fraction to percent", async () => {
    mockRows([
      { keys: ["มาสด้า นครปฐม"], clicks: 12, impressions: 300, ctr: 0.04, position: 3.2 },
      { keys: ["ford ranger ราคา"], clicks: 5, impressions: 150, ctr: 0.0333, position: 8.15 },
    ]);
    const { getTopKeywords } = await import("@/lib/gsc");
    const result = await getTopKeywords(30);
    expect(result).toEqual([
      { query: "มาสด้า นครปฐม", clicks: 12, impressions: 300, ctr: 4, position: 3.2 },
      { query: "ford ranger ราคา", clicks: 5, impressions: 150, ctr: 3.3, position: 8.2 },
    ]);
  });

  it("returns [] when GSC creds are missing", async () => {
    delete process.env.GA4_CLIENT_EMAIL;
    const { getTopKeywords } = await import("@/lib/gsc");
    expect(await getTopKeywords(30)).toEqual([]);
  });
});

describe("getKeywordsByPage", () => {
  it("groups queries under their page, sorts pages + keywords by clicks", async () => {
    mockRows([
      { keys: ["https://www.ch-erawan.com/stories", "รีวิว มาสด้า"], clicks: 2, impressions: 40, ctr: 0.05, position: 4 },
      { keys: ["https://www.ch-erawan.com/stories", "ลูกค้า ช.เอราวัณ"], clicks: 6, impressions: 80, ctr: 0.075, position: 2 },
      { keys: ["https://www.ch-erawan.com/cars/mazda-cx-5-2025", "cx-5 ราคา"], clicks: 3, impressions: 90, ctr: 0.033, position: 5 },
    ]);
    const { getKeywordsByPage } = await import("@/lib/gsc");
    const result = await getKeywordsByPage(30);
    // /stories has more total clicks (8) than the car page (3) → first
    expect(result[0].page).toBe("https://www.ch-erawan.com/stories");
    expect(result[0].clicks).toBe(8);
    // within /stories, the 6-click keyword sorts before the 2-click one
    expect(result[0].keywords.map((k) => k.query)).toEqual(["ลูกค้า ช.เอราวัณ", "รีวิว มาสด้า"]);
    expect(result[1].page).toBe("https://www.ch-erawan.com/cars/mazda-cx-5-2025");
  });

  it("returns [] when creds missing", async () => {
    delete process.env.GA4_PRIVATE_KEY;
    const { getKeywordsByPage } = await import("@/lib/gsc");
    expect(await getKeywordsByPage(30)).toEqual([]);
  });
});
