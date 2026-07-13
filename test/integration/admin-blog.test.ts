import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  makeRequest,
  allowAdmin,
  denyAdmin,
  jsonBody,
} from "../helpers/integration-utils";
import { validBlogCreateBody, mockBlogPost } from "../helpers/api-fixtures";

const mocks = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  revalidatePath: vi.fn(),
  getAllBlogPostsAdmin: vi.fn(),
  getBlogPostForEdit: vi.fn(),
  createBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  setBlogPublished: vi.fn(),
  archiveBlogPost: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireStaff: mocks.requireStaff }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/notion", () => ({
  getAllBlogPostsAdmin: mocks.getAllBlogPostsAdmin,
  getBlogPostForEdit: mocks.getBlogPostForEdit,
  createBlogPost: mocks.createBlogPost,
  updateBlogPost: mocks.updateBlogPost,
  setBlogPublished: mocks.setBlogPublished,
  archiveBlogPost: mocks.archiveBlogPost,
}));

import { GET, POST, PATCH, DELETE } from "@/app/api/admin/blog/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireStaff);
  mocks.getAllBlogPostsAdmin.mockResolvedValue([mockBlogPost]);
  mocks.getBlogPostForEdit.mockResolvedValue({ ...mockBlogPost, markdown: "# Hi" });
  mocks.createBlogPost.mockResolvedValue(mockBlogPost);
  mocks.updateBlogPost.mockResolvedValue(mockBlogPost);
  mocks.setBlogPublished.mockResolvedValue(undefined);
  mocks.archiveBlogPost.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/blog", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await GET(makeRequest("/api/admin/blog"));
    expect(res.status).toBe(401);
  });

  it("lists all posts", async () => {
    const res = await GET(makeRequest("/api/admin/blog"));
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([mockBlogPost]);
  });

  it("returns a single post when ?id= is set", async () => {
    const res = await GET(
      makeRequest("/api/admin/blog", { searchParams: { id: "blog-1" } })
    );
    expect(res.status).toBe(200);
    expect(mocks.getBlogPostForEdit).toHaveBeenCalledWith("blog-1");
  });

  it("returns 404 when post not found", async () => {
    mocks.getBlogPostForEdit.mockResolvedValue(null);
    const res = await GET(
      makeRequest("/api/admin/blog", { searchParams: { id: "missing" } })
    );
    expect(res.status).toBe(404);
  });

  it("returns 500 on fetch error", async () => {
    mocks.getAllBlogPostsAdmin.mockRejectedValue(new Error("fail"));
    const res = await GET(makeRequest("/api/admin/blog"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/blog", () => {
  it("creates a post and revalidates", async () => {
    const res = await POST(
      makeRequest("/api/admin/blog", { method: "POST", body: validBlogCreateBody })
    );
    expect(res.status).toBe(200);
    expect(mocks.createBlogPost).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog");
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      makeRequest("/api/admin/blog", { method: "POST", body: { meta: { title: "" } } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when create throws", async () => {
    mocks.createBlogPost.mockRejectedValue(new Error("fail"));
    const res = await POST(
      makeRequest("/api/admin/blog", { method: "POST", body: validBlogCreateBody })
    );
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/blog", () => {
  it("toggles publish when publish flag is sent alone", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/blog", {
        method: "PATCH",
        body: { id: "blog-1", publish: true },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.setBlogPublished).toHaveBeenCalledWith("blog-1", true);
  });

  it("updates post meta/markdown", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/blog", {
        method: "PATCH",
        body: { id: "blog-1", meta: { title: "Updated" }, markdown: "# New" },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.updateBlogPost).toHaveBeenCalled();
  });

  it("returns 400 for invalid patch", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/blog", { method: "PATCH", body: { id: "" } })
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/admin/blog", () => {
  it("archives post by id", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/blog", { method: "DELETE", searchParams: { id: "blog-1" } })
    );
    expect(res.status).toBe(200);
    expect(mocks.archiveBlogPost).toHaveBeenCalledWith("blog-1");
  });

  it("returns 400 without id", async () => {
    const res = await DELETE(makeRequest("/api/admin/blog", { method: "DELETE" }));
    expect(res.status).toBe(400);
  });
});
