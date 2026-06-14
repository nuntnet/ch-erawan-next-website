import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAllServiceSectionsAdmin: vi.fn(),
  createServiceSection: vi.fn(),
  updateServiceSection: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/notion", () => ({
  getAllServiceSectionsAdmin: mocks.getAllServiceSectionsAdmin,
  createServiceSection: mocks.createServiceSection,
  updateServiceSection: mocks.updateServiceSection,
}));

import { GET, POST, PATCH } from "@/app/api/admin/service-content/route";

const validBody = {
  title: "Section 1",
  page: "body-repair" as const,
  brand: "GWM" as const,
  sectionKey: "hero",
  sortOrder: 1,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireAdmin);
  mocks.getAllServiceSectionsAdmin.mockResolvedValue([{ id: "sc1", title: "Hero", page: "body-repair" }]);
  mocks.createServiceSection.mockResolvedValue({ id: "sc2", ...validBody });
  mocks.updateServiceSection.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/service-content", () => {
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

  it("returns service sections list on success", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "sc1", title: "Hero", page: "body-repair" }]);
  });

  it("returns 500 on Notion error", async () => {
    mocks.getAllServiceSectionsAdmin.mockRejectedValue(new Error("fail"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/service-content", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await POST(makeRequest("/api/admin/service-content", { method: "POST", body: validBody }));
    expect(res.status).toBe(401);
  });

  it("creates service section on happy path", async () => {
    const res = await POST(makeRequest("/api/admin/service-content", { method: "POST", body: validBody }));
    expect(res.status).toBe(200);
    expect(mocks.createServiceSection).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Section 1",
        page: "body-repair",
        brand: "GWM",
        sectionKey: "hero",
      })
    );
  });

  it("returns 400 when title is empty", async () => {
    const res = await POST(
      makeRequest("/api/admin/service-content", { method: "POST", body: { ...validBody, title: "" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid page", async () => {
    const res = await POST(
      makeRequest("/api/admin/service-content", { method: "POST", body: { ...validBody, page: "invalid" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid brand", async () => {
    const res = await POST(
      makeRequest("/api/admin/service-content", { method: "POST", body: { ...validBody, brand: "Invalid" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Notion throws", async () => {
    mocks.createServiceSection.mockRejectedValue(new Error("notion down"));
    const res = await POST(makeRequest("/api/admin/service-content", { method: "POST", body: validBody }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/service-content", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await PATCH(
      makeRequest("/api/admin/service-content", { method: "PATCH", body: { id: "sc1", title: "Updated" } })
    );
    expect(res.status).toBe(401);
  });

  it("updates service section successfully", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/service-content", { method: "PATCH", body: { id: "sc1", title: "Updated", isPublished: true } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.updateServiceSection).toHaveBeenCalledWith("sc1", { title: "Updated", isPublished: true });
  });

  it("returns 400 when id is missing", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/service-content", { method: "PATCH", body: { id: "", title: "test" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateServiceSection.mockRejectedValue(new Error("fail"));
    const res = await PATCH(
      makeRequest("/api/admin/service-content", { method: "PATCH", body: { id: "sc1", title: "Updated" } })
    );
    expect(res.status).toBe(500);
  });
});
