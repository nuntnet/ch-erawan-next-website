import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAllFAQAdmin: vi.fn(),
  createFAQItem: vi.fn(),
  updateFAQItem: vi.fn(),
  archiveFAQItem: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/notion", () => ({
  getAllFAQAdmin: mocks.getAllFAQAdmin,
  createFAQItem: mocks.createFAQItem,
  updateFAQItem: mocks.updateFAQItem,
  archiveFAQItem: mocks.archiveFAQItem,
}));

import { GET, POST, PATCH, DELETE } from "@/app/api/admin/faq/route";

const validBody = {
  question: "รถ GWM รับประกันกี่ปี?",
  answer: "รับประกัน 5 ปี หรือ 150,000 กม.",
  page: "body-repair" as const,
  brand: "GWM" as const,
  isActive: true,
  sortOrder: 1,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireAdmin);
  mocks.getAllFAQAdmin.mockResolvedValue([{ id: "f1", question: "Q1", answer: "A1" }]);
  mocks.createFAQItem.mockResolvedValue({ id: "f2", ...validBody });
  mocks.updateFAQItem.mockResolvedValue(undefined);
  mocks.archiveFAQItem.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/faq", () => {
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

  it("returns FAQ list on success", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "f1", question: "Q1", answer: "A1" }]);
  });

  it("returns 500 on Notion error", async () => {
    mocks.getAllFAQAdmin.mockRejectedValue(new Error("fail"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/faq", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await POST(makeRequest("/api/admin/faq", { method: "POST", body: validBody }));
    expect(res.status).toBe(401);
  });

  it("creates FAQ item on happy path", async () => {
    const res = await POST(makeRequest("/api/admin/faq", { method: "POST", body: validBody }));
    expect(res.status).toBe(200);
    expect(mocks.createFAQItem).toHaveBeenCalledWith(expect.objectContaining({
      question: validBody.question,
      answer: validBody.answer,
      page: "body-repair",
      brand: "GWM",
    }));
  });

  it("returns 400 when question is empty", async () => {
    const res = await POST(
      makeRequest("/api/admin/faq", { method: "POST", body: { ...validBody, question: "" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when answer is empty", async () => {
    const res = await POST(
      makeRequest("/api/admin/faq", { method: "POST", body: { ...validBody, answer: "" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid page enum", async () => {
    const res = await POST(
      makeRequest("/api/admin/faq", { method: "POST", body: { ...validBody, page: "invalid" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Notion throws", async () => {
    mocks.createFAQItem.mockRejectedValue(new Error("notion down"));
    const res = await POST(makeRequest("/api/admin/faq", { method: "POST", body: validBody }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/faq", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await PATCH(
      makeRequest("/api/admin/faq", { method: "PATCH", body: { id: "f1", question: "updated?" } })
    );
    expect(res.status).toBe(401);
  });

  it("updates FAQ item successfully", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/faq", { method: "PATCH", body: { id: "f1", question: "updated?" } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.updateFAQItem).toHaveBeenCalledWith("f1", { question: "updated?" });
  });

  it("returns 400 when id is missing", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/faq", { method: "PATCH", body: { id: "", question: "test" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateFAQItem.mockRejectedValue(new Error("fail"));
    const res = await PATCH(
      makeRequest("/api/admin/faq", { method: "PATCH", body: { id: "f1", question: "updated?" } })
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/admin/faq", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireAdmin, 401, "Unauthorized");
    const res = await DELETE(
      makeRequest("/api/admin/faq", { method: "DELETE", searchParams: { id: "f1" } })
    );
    expect(res.status).toBe(401);
  });

  it("archives FAQ item successfully", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/faq", { method: "DELETE", searchParams: { id: "f1" } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.archiveFAQItem).toHaveBeenCalledWith("f1");
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/faq", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when archive throws", async () => {
    mocks.archiveFAQItem.mockRejectedValue(new Error("fail"));
    const res = await DELETE(
      makeRequest("/api/admin/faq", { method: "DELETE", searchParams: { id: "f1" } })
    );
    expect(res.status).toBe(500);
  });
});
