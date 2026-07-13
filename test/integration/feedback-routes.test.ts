import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";
import { validFeedbackBody } from "../helpers/api-fixtures";

const mocks = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  createFeedback: vi.fn(),
  getAllFeedbackAdmin: vi.fn(),
  updateFeedbackStatus: vi.fn(),
  sendFormNotification: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireStaff: mocks.requireStaff }));
vi.mock("@/lib/notion", () => ({
  createFeedback: mocks.createFeedback,
  getAllFeedbackAdmin: mocks.getAllFeedbackAdmin,
  updateFeedbackStatus: mocks.updateFeedbackStatus,
}));
vi.mock("@/lib/email", () => ({
  sendFormNotification: mocks.sendFormNotification,
}));

import { POST as feedbackPOST } from "@/app/api/submit/feedback/route";
import { GET as adminFeedbackGET, PATCH as adminFeedbackPATCH } from "@/app/api/admin/feedback/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireStaff);
  mocks.createFeedback.mockResolvedValue(undefined);
  mocks.sendFormNotification.mockResolvedValue({ sent: false, channel: "none" });
  mocks.getAllFeedbackAdmin.mockResolvedValue([{ id: "f1", name: "Somchai", status: "ใหม่" }]);
  mocks.updateFeedbackStatus.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/submit/feedback", () => {
  it("creates feedback in Notion on happy path", async () => {
    const res = await feedbackPOST(
      makeRequest("/api/submit/feedback", { method: "POST", body: validFeedbackBody })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.createFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validFeedbackBody.name,
        phone: validFeedbackBody.phone,
        message: validFeedbackBody.message,
      })
    );
  });

  it("returns 400 when name is empty", async () => {
    const res = await feedbackPOST(
      makeRequest("/api/submit/feedback", {
        method: "POST",
        body: { ...validFeedbackBody, name: "" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when phone is too short", async () => {
    const res = await feedbackPOST(
      makeRequest("/api/submit/feedback", {
        method: "POST",
        body: { ...validFeedbackBody, phone: "123" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is too short", async () => {
    const res = await feedbackPOST(
      makeRequest("/api/submit/feedback", {
        method: "POST",
        body: { ...validFeedbackBody, message: "สั้น" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Notion throws", async () => {
    mocks.createFeedback.mockRejectedValue(new Error("notion down"));
    const res = await feedbackPOST(
      makeRequest("/api/submit/feedback", { method: "POST", body: validFeedbackBody })
    );
    expect(res.status).toBe(500);
  });
});

describe("GET /api/admin/feedback", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await adminFeedbackGET();
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    denyAdmin(mocks.requireStaff, 403, "Forbidden");
    const res = await adminFeedbackGET();
    expect(res.status).toBe(403);
  });

  it("returns feedback list on success", async () => {
    const res = await adminFeedbackGET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "f1", name: "Somchai", status: "ใหม่" }]);
  });

  it("returns 500 on Notion error", async () => {
    mocks.getAllFeedbackAdmin.mockRejectedValue(new Error("fail"));
    const res = await adminFeedbackGET();
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/feedback", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await adminFeedbackPATCH(
      makeRequest("/api/admin/feedback", {
        method: "PATCH",
        body: { id: "f1", status: "กำลังดำเนินการ" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("updates feedback status successfully", async () => {
    const res = await adminFeedbackPATCH(
      makeRequest("/api/admin/feedback", {
        method: "PATCH",
        body: { id: "f1", status: "กำลังดำเนินการ" },
      })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.updateFeedbackStatus).toHaveBeenCalledWith("f1", "กำลังดำเนินการ");
  });

  it("updates status to แก้ไขแล้ว", async () => {
    const res = await adminFeedbackPATCH(
      makeRequest("/api/admin/feedback", {
        method: "PATCH",
        body: { id: "f1", status: "แก้ไขแล้ว" },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.updateFeedbackStatus).toHaveBeenCalledWith("f1", "แก้ไขแล้ว");
  });

  it("returns 400 for invalid status enum", async () => {
    const res = await adminFeedbackPATCH(
      makeRequest("/api/admin/feedback", {
        method: "PATCH",
        body: { id: "f1", status: "invalid-status" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when id is missing", async () => {
    const res = await adminFeedbackPATCH(
      makeRequest("/api/admin/feedback", {
        method: "PATCH",
        body: { id: "", status: "ใหม่" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateFeedbackStatus.mockRejectedValue(new Error("fail"));
    const res = await adminFeedbackPATCH(
      makeRequest("/api/admin/feedback", {
        method: "PATCH",
        body: { id: "f1", status: "แก้ไขแล้ว" },
      })
    );
    expect(res.status).toBe(500);
  });
});
