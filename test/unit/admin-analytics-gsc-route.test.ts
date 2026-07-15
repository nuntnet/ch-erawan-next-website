import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ requireStaff: vi.fn(async () => null) }));
vi.mock("@/lib/gsc", () => ({
  isGscConfigured: vi.fn(() => process.env.__GSC_OK === "1"),
  getTopKeywords: vi.fn(async () => [{ query: "มาสด้า นครปฐม", clicks: 5, impressions: 100, ctr: 5, position: 3 }]),
  getKeywordsByPage: vi.fn(async () => []),
}));

beforeEach(() => {
  process.env.__GSC_OK = "1";
});

describe("GET /api/admin/analytics/gsc", () => {
  it("returns configured:true with keyword data when set up", async () => {
    const { GET } = await import("@/app/api/admin/analytics/gsc/route");
    const res = await GET(new Request("http://localhost/api/admin/analytics/gsc?days=30") as unknown as import("next/server").NextRequest);
    const json = await res.json();
    expect(json.configured).toBe(true);
    expect(json.topKeywords[0].query).toBe("มาสด้า นครปฐม");
  });

  it("returns configured:false and empty data when GSC not configured", async () => {
    delete process.env.__GSC_OK;
    const { GET } = await import("@/app/api/admin/analytics/gsc/route");
    const res = await GET(new Request("http://localhost/api/admin/analytics/gsc?days=30") as unknown as import("next/server").NextRequest);
    const json = await res.json();
    expect(json.configured).toBe(false);
    expect(json.topKeywords).toEqual([]);
    expect(json.pages).toEqual([]);
  });

  it("returns the requireStaff denial when unauthorized", async () => {
    const { requireStaff } = await import("@/lib/admin-auth");
    (requireStaff as ReturnType<typeof vi.fn>).mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { GET } = await import("@/app/api/admin/analytics/gsc/route");
    const res = await GET(new Request("http://localhost/api/admin/analytics/gsc?days=30") as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(401);
  });
});
