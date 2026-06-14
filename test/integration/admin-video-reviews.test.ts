import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAllVideoReviewsAdmin: vi.fn(),
  createVideoReview: vi.fn(),
  updateVideoReview: vi.fn(),
  archiveVideoReview: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/notion", () => ({
  getAllVideoReviewsAdmin: mocks.getAllVideoReviewsAdmin,
  createVideoReview: mocks.createVideoReview,
  updateVideoReview: mocks.updateVideoReview,
  archiveVideoReview: mocks.archiveVideoReview,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { GET, POST, PATCH, DELETE } from "@/app/api/admin/video-reviews/route";

const validBody = {
  title: "Review GWM Tank 500",
  brand: "GWM" as const,
  platform: "YouTube" as const,
  videoUrl: "https://youtube.com/watch?v=abc",
  source: "external" as const,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireAdmin);
  mocks.getAllVideoReviewsAdmin.mockResolvedValue([{ id: "vr1", title: "Review 1" }]);
  mocks.createVideoReview.mockResolvedValue({ id: "vr2", ...validBody });
  mocks.updateVideoReview.mockResolvedValue(undefined);
  mocks.archiveVideoReview.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/video-reviews", () => {
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

  it("returns video reviews list on success", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "vr1", title: "Review 1" }]);
  });

  it("returns 500 on Notion error", async () => {
    mocks.getAllVideoReviewsAdmin.mockRejectedValue(new Error("fail"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/video-reviews", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await POST(makeRequest("/api/admin/video-reviews", { method: "POST", body: validBody }));
    expect(res.status).toBe(401);
  });

  it("creates video review on happy path", async () => {
    const res = await POST(makeRequest("/api/admin/video-reviews", { method: "POST", body: validBody }));
    expect(res.status).toBe(200);
    expect(mocks.createVideoReview).toHaveBeenCalledWith(
      expect.objectContaining({
        title: validBody.title,
        brand: "GWM",
        platform: "YouTube",
        videoUrl: validBody.videoUrl,
      })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/gwm/reviews");
  });

  it("returns 400 when title is empty", async () => {
    const res = await POST(
      makeRequest("/api/admin/video-reviews", { method: "POST", body: { ...validBody, title: "" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid videoUrl", async () => {
    const res = await POST(
      makeRequest("/api/admin/video-reviews", { method: "POST", body: { ...validBody, videoUrl: "not-a-url" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid platform", async () => {
    const res = await POST(
      makeRequest("/api/admin/video-reviews", { method: "POST", body: { ...validBody, platform: "Vimeo" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Notion throws", async () => {
    mocks.createVideoReview.mockRejectedValue(new Error("notion down"));
    const res = await POST(makeRequest("/api/admin/video-reviews", { method: "POST", body: validBody }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/video-reviews", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await PATCH(
      makeRequest("/api/admin/video-reviews", { method: "PATCH", body: { id: "vr1", title: "Updated" } })
    );
    expect(res.status).toBe(401);
  });

  it("updates video review successfully", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/video-reviews", { method: "PATCH", body: { id: "vr1", title: "Updated" } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.updateVideoReview).toHaveBeenCalledWith("vr1", { title: "Updated" });
  });

  it("returns 400 when id is missing", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/video-reviews", { method: "PATCH", body: { id: "", title: "test" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateVideoReview.mockRejectedValue(new Error("fail"));
    const res = await PATCH(
      makeRequest("/api/admin/video-reviews", { method: "PATCH", body: { id: "vr1", title: "Updated" } })
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/admin/video-reviews", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await DELETE(
      makeRequest("/api/admin/video-reviews", { method: "DELETE", searchParams: { id: "vr1" } })
    );
    expect(res.status).toBe(401);
  });

  it("archives video review successfully", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/video-reviews", { method: "DELETE", searchParams: { id: "vr1" } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.archiveVideoReview).toHaveBeenCalledWith("vr1");
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/video-reviews", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when archive throws", async () => {
    mocks.archiveVideoReview.mockRejectedValue(new Error("fail"));
    const res = await DELETE(
      makeRequest("/api/admin/video-reviews", { method: "DELETE", searchParams: { id: "vr1" } })
    );
    expect(res.status).toBe(500);
  });
});
