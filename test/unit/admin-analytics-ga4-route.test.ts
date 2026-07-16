import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ requireStaff: vi.fn(async () => null) }));
vi.mock("@/lib/ga4", () => ({
  // Mirror the real "needs env" behavior against GA4_PROPERTY_ID so the
  // configured:true / configured:false cases below still exercise the route's
  // branch. (The full 3-var logic of the real isGa4Configured is unit-tested
  // in test/unit/ga4.test.ts.)
  isGa4Configured: vi.fn(() => Boolean(process.env.GA4_PROPERTY_ID)),
  getChannels: vi.fn(async () => [{ channel: "Direct", sessions: 5, users: 5 }]),
  getTopSources: vi.fn(async () => []),
  getExitPages: vi.fn(async () => []),
  getTopVehicles: vi.fn(async () => []),
  getDeviceBreakdown: vi.fn(async () => []),
  getLeadCounts: vi.fn(async () => ({ form: 0, line: 0, call: 0 })),
  getLineClicksByBrand: vi.fn(async () => [{ brand: "Mazda", clicks: 3 }]),
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
    expect(json.lineByBrand).toEqual([{ brand: "Mazda", clicks: 3 }]);
  });

  it("returns configured:false and empty data when GA4_PROPERTY_ID is missing", async () => {
    delete process.env.GA4_PROPERTY_ID;
    const { GET } = await import("@/app/api/admin/analytics/ga4/route");
    const req = new Request("http://localhost/api/admin/analytics/ga4?days=30");
    const res = await GET(req as unknown as import("next/server").NextRequest);
    const json = await res.json();
    expect(json.configured).toBe(false);
    expect(json.channels).toEqual([]);
    expect(json.lineByBrand).toEqual([]);
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
