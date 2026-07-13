import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { makeRequest, makeFormRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";

const mocks = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  revalidatePath: vi.fn(),
  cloudinaryUpload: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireStaff: mocks.requireStaff }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload: mocks.cloudinaryUpload },
  },
}));

import { POST as revalidatePOST } from "@/app/api/admin/revalidate/route";
import { POST as uploadPOST } from "@/app/api/upload/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireStaff);
  mocks.revalidatePath.mockClear();
  mocks.cloudinaryUpload.mockResolvedValue({ secure_url: "https://cdn.example/img.jpg" });
  vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "test-cloud");
  vi.stubEnv("CLOUDINARY_API_KEY", "key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/admin/revalidate", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await revalidatePOST(makeRequest("/api/admin/revalidate", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("revalidates all pages by default", async () => {
    const res = await revalidatePOST(
      makeRequest("/api/admin/revalidate", { method: "POST", body: {} })
    );
    expect(res.status).toBe(200);
    const body = await jsonBody<{ revalidated: boolean; type: string }>(res);
    expect(body.revalidated).toBe(true);
    expect(body.type).toBe("all");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("revalidates cars paths when type=cars", async () => {
    const res = await revalidatePOST(
      makeRequest("/api/admin/revalidate", { method: "POST", body: { type: "cars" } })
    );
    expect(res.status).toBe(200);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cars");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("revalidates blog paths when type=blog", async () => {
    await revalidatePOST(
      makeRequest("/api/admin/revalidate", { method: "POST", body: { type: "blog" } })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog");
  });

  it("revalidates stories paths when type=stories", async () => {
    await revalidatePOST(
      makeRequest("/api/admin/revalidate", { method: "POST", body: { type: "stories" } })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/stories");
  });

  it("returns 400 for invalid type", async () => {
    const res = await revalidatePOST(
      makeRequest("/api/admin/revalidate", { method: "POST", body: { type: "invalid" } })
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/upload", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const file = new File(["x"], "a.png", { type: "image/png" });
    const res = await uploadPOST(makeFormRequest("/api/upload", file));
    expect(res.status).toBe(401);
  });

  it("returns 503 when Cloudinary is not configured", async () => {
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    const file = new File(["x"], "a.png", { type: "image/png" });
    const res = await uploadPOST(makeFormRequest("/api/upload", file));
    expect(res.status).toBe(503);
  });

  it("returns 400 when no file is provided", async () => {
    const fd = new FormData();
    fd.append("notafile", "value");
    const req = new NextRequest(new URL("/api/upload", "http://localhost:3000"), {
      method: "POST",
      body: fd,
    });
    const res = await uploadPOST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for disallowed file type", async () => {
    const file = new File(["x"], "a.gif", { type: "image/gif" });
    const res = await uploadPOST(makeFormRequest("/api/upload", file));
    expect(res.status).toBe(400);
  });

  it("returns 400 when file exceeds 5MB", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([big], "big.png", { type: "image/png" });
    const res = await uploadPOST(makeFormRequest("/api/upload", file));
    expect(res.status).toBe(400);
  });

  it("uploads a valid image and returns the CDN url", async () => {
    const file = new File(["img"], "car.png", { type: "image/png" });
    const res = await uploadPOST(makeFormRequest("/api/upload", file));
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ url: "https://cdn.example/img.jpg" });
    expect(mocks.cloudinaryUpload).toHaveBeenCalled();
  });

  it("returns 500 when Cloudinary throws", async () => {
    mocks.cloudinaryUpload.mockRejectedValue(new Error("upload fail"));
    const file = new File(["img"], "car.png", { type: "image/png" });
    const res = await uploadPOST(makeFormRequest("/api/upload", file));
    expect(res.status).toBe(500);
  });
});
