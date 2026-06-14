import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAllInsurancePartnersAdmin: vi.fn(),
  createInsurancePartner: vi.fn(),
  updateInsurancePartner: vi.fn(),
  archiveInsurancePartner: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/notion", () => ({
  getAllInsurancePartnersAdmin: mocks.getAllInsurancePartnersAdmin,
  createInsurancePartner: mocks.createInsurancePartner,
  updateInsurancePartner: mocks.updateInsurancePartner,
  archiveInsurancePartner: mocks.archiveInsurancePartner,
}));

import { GET, POST, PATCH, DELETE } from "@/app/api/admin/insurance-partners/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireAdmin);
  mocks.getAllInsurancePartnersAdmin.mockResolvedValue([{ id: "ip1", name: "วิริยะ", brand: "ทุกแบรนด์" }]);
  mocks.createInsurancePartner.mockResolvedValue({ id: "ip2", name: "วิริยะ", brand: "ทุกแบรนด์" });
  mocks.updateInsurancePartner.mockResolvedValue(undefined);
  mocks.archiveInsurancePartner.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/insurance-partners", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    denyAdmin(mocks.requireAdmin, 403, "Forbidden");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns insurance partners list on success", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "ip1", name: "วิริยะ", brand: "ทุกแบรนด์" }]);
  });

  it("returns 500 on Notion error", async () => {
    mocks.getAllInsurancePartnersAdmin.mockRejectedValue(new Error("fail"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/insurance-partners", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await POST(
      makeRequest("/api/admin/insurance-partners", { method: "POST", body: { name: "วิริยะ", brand: "ทุกแบรนด์" } })
    );
    expect(res.status).toBe(401);
  });

  it("creates insurance partner on happy path", async () => {
    const res = await POST(
      makeRequest("/api/admin/insurance-partners", { method: "POST", body: { name: "วิริยะ", brand: "ทุกแบรนด์" } })
    );
    expect(res.status).toBe(200);
    expect(mocks.createInsurancePartner).toHaveBeenCalledWith("วิริยะ", "ทุกแบรนด์");
  });

  it("returns 400 when name is empty", async () => {
    const res = await POST(
      makeRequest("/api/admin/insurance-partners", { method: "POST", body: { name: "", brand: "ทุกแบรนด์" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid brand", async () => {
    const res = await POST(
      makeRequest("/api/admin/insurance-partners", { method: "POST", body: { name: "วิริยะ", brand: "Invalid" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Notion throws", async () => {
    mocks.createInsurancePartner.mockRejectedValue(new Error("notion down"));
    const res = await POST(
      makeRequest("/api/admin/insurance-partners", { method: "POST", body: { name: "วิริยะ", brand: "ทุกแบรนด์" } })
    );
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/insurance-partners", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await PATCH(
      makeRequest("/api/admin/insurance-partners", { method: "PATCH", body: { id: "ip1", name: "updated", isActive: false } })
    );
    expect(res.status).toBe(401);
  });

  it("updates insurance partner successfully", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/insurance-partners", { method: "PATCH", body: { id: "ip1", name: "updated", isActive: false } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.updateInsurancePartner).toHaveBeenCalledWith("ip1", { name: "updated", isActive: false });
  });

  it("returns 400 when id is missing", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/insurance-partners", { method: "PATCH", body: { id: "", name: "test" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateInsurancePartner.mockRejectedValue(new Error("fail"));
    const res = await PATCH(
      makeRequest("/api/admin/insurance-partners", { method: "PATCH", body: { id: "ip1", name: "updated" } })
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/admin/insurance-partners", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await DELETE(
      makeRequest("/api/admin/insurance-partners", { method: "DELETE", searchParams: { id: "ip1" } })
    );
    expect(res.status).toBe(401);
  });

  it("archives insurance partner successfully", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/insurance-partners", { method: "DELETE", searchParams: { id: "ip1" } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.archiveInsurancePartner).toHaveBeenCalledWith("ip1");
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/insurance-partners", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when archive throws", async () => {
    mocks.archiveInsurancePartner.mockRejectedValue(new Error("fail"));
    const res = await DELETE(
      makeRequest("/api/admin/insurance-partners", { method: "DELETE", searchParams: { id: "ip1" } })
    );
    expect(res.status).toBe(500);
  });
});
