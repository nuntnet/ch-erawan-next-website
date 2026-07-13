import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";

const mocks = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  getAllSocialLinksAdmin: vi.fn(),
  createSocialLink: vi.fn(),
  updateSocialLink: vi.fn(),
  archiveSocialLink: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireStaff: mocks.requireStaff }));
vi.mock("@/lib/notion", () => ({
  getAllSocialLinksAdmin: mocks.getAllSocialLinksAdmin,
  createSocialLink: mocks.createSocialLink,
  updateSocialLink: mocks.updateSocialLink,
  archiveSocialLink: mocks.archiveSocialLink,
}));

import { GET, POST, PATCH, DELETE } from "@/app/api/admin/social-links/route";

const validBody = {
  brand: "GWM" as const,
  platform: "Facebook" as const,
  url: "https://facebook.com/gwm",
  isActive: true,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireStaff);
  mocks.getAllSocialLinksAdmin.mockResolvedValue([{ id: "sl1", brand: "GWM", platform: "Facebook" }]);
  mocks.createSocialLink.mockResolvedValue({ id: "sl2", ...validBody, label: "GWM Facebook" });
  mocks.updateSocialLink.mockResolvedValue(undefined);
  mocks.archiveSocialLink.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/social-links", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    denyAdmin(mocks.requireStaff, 403, "Forbidden");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns social links list on success", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "sl1", brand: "GWM", platform: "Facebook" }]);
  });

  it("returns 500 on Notion error", async () => {
    mocks.getAllSocialLinksAdmin.mockRejectedValue(new Error("fail"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/social-links", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await POST(makeRequest("/api/admin/social-links", { method: "POST", body: validBody }));
    expect(res.status).toBe(401);
  });

  it("creates social link on happy path", async () => {
    const res = await POST(makeRequest("/api/admin/social-links", { method: "POST", body: validBody }));
    expect(res.status).toBe(200);
    expect(mocks.createSocialLink).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: "GWM",
        platform: "Facebook",
        url: validBody.url,
        label: "GWM Facebook",
      })
    );
  });

  it("returns 400 for invalid platform", async () => {
    const res = await POST(
      makeRequest("/api/admin/social-links", { method: "POST", body: { ...validBody, platform: "Twitter" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid url", async () => {
    const res = await POST(
      makeRequest("/api/admin/social-links", { method: "POST", body: { ...validBody, url: "not-a-url" } })
    );
    expect(res.status).toBe(400);
  });

  it("allows empty string url", async () => {
    const res = await POST(
      makeRequest("/api/admin/social-links", { method: "POST", body: { ...validBody, url: "" } })
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 when Notion throws", async () => {
    mocks.createSocialLink.mockRejectedValue(new Error("notion down"));
    const res = await POST(makeRequest("/api/admin/social-links", { method: "POST", body: validBody }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/social-links", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await PATCH(
      makeRequest("/api/admin/social-links", { method: "PATCH", body: { id: "sl1", isActive: false } })
    );
    expect(res.status).toBe(401);
  });

  it("updates social link successfully", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/social-links", { method: "PATCH", body: { id: "sl1", isActive: false } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.updateSocialLink).toHaveBeenCalledWith("sl1", { isActive: false });
  });

  it("returns 400 when id is missing", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/social-links", { method: "PATCH", body: { id: "", platform: "TikTok" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateSocialLink.mockRejectedValue(new Error("fail"));
    const res = await PATCH(
      makeRequest("/api/admin/social-links", { method: "PATCH", body: { id: "sl1", isActive: false } })
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/admin/social-links", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await DELETE(
      makeRequest("/api/admin/social-links", { method: "DELETE", searchParams: { id: "sl1" } })
    );
    expect(res.status).toBe(401);
  });

  it("archives social link successfully", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/social-links", { method: "DELETE", searchParams: { id: "sl1" } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.archiveSocialLink).toHaveBeenCalledWith("sl1");
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/social-links", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when archive throws", async () => {
    mocks.archiveSocialLink.mockRejectedValue(new Error("fail"));
    const res = await DELETE(
      makeRequest("/api/admin/social-links", { method: "DELETE", searchParams: { id: "sl1" } })
    );
    expect(res.status).toBe(500);
  });
});
