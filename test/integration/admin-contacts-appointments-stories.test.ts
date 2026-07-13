import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, allowAdmin, denyAdmin, jsonBody } from "../helpers/integration-utils";

const mocks = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  getAllContacts: vi.fn(),
  getAllAppointments: vi.fn(),
  updateAppointmentStatus: vi.fn(),
  getAllStories: vi.fn(),
  updateStoryStatus: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireStaff: mocks.requireStaff }));
vi.mock("@/lib/notion", () => ({
  getAllContacts: mocks.getAllContacts,
  getAllAppointments: mocks.getAllAppointments,
  updateAppointmentStatus: mocks.updateAppointmentStatus,
  getAllStories: mocks.getAllStories,
  updateStoryStatus: mocks.updateStoryStatus,
}));

import { GET as contactsGET } from "@/app/api/admin/contacts/route";
import { GET as appointmentsGET, PATCH as appointmentsPATCH } from "@/app/api/admin/appointments/route";
import { GET as storiesGET, PATCH as storiesPATCH } from "@/app/api/admin/stories/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireStaff);
  mocks.getAllContacts.mockResolvedValue([{ id: "c1", name: "A" }]);
  mocks.getAllAppointments.mockResolvedValue([{ id: "a1", status: "pending" }]);
  mocks.updateAppointmentStatus.mockResolvedValue(undefined);
  mocks.getAllStories.mockResolvedValue([{ id: "s1", status: "pending" }]);
  mocks.updateStoryStatus.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/contacts", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await contactsGET();
    expect(res.status).toBe(401);
  });

  it("returns contacts on success", async () => {
    const res = await contactsGET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "c1", name: "A" }]);
  });

  it("returns 500 on error", async () => {
    mocks.getAllContacts.mockRejectedValue(new Error("fail"));
    const res = await contactsGET();
    expect(res.status).toBe(500);
  });
});

describe("GET /api/admin/appointments", () => {
  it("returns 403 for non-admin", async () => {
    denyAdmin(mocks.requireStaff, 403, "Forbidden");
    const res = await appointmentsGET();
    expect(res.status).toBe(403);
  });

  it("returns appointments on success", async () => {
    const res = await appointmentsGET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([{ id: "a1", status: "pending" }]);
  });
});

describe("PATCH /api/admin/appointments", () => {
  it("updates status", async () => {
    const res = await appointmentsPATCH(
      makeRequest("/api/admin/appointments", {
        method: "PATCH",
        body: { id: "a1", status: "confirmed" },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.updateAppointmentStatus).toHaveBeenCalledWith("a1", "confirmed");
  });

  it("returns 400 for invalid status", async () => {
    const res = await appointmentsPATCH(
      makeRequest("/api/admin/appointments", {
        method: "PATCH",
        body: { id: "a1", status: "invalid" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateAppointmentStatus.mockRejectedValue(new Error("fail"));
    const res = await appointmentsPATCH(
      makeRequest("/api/admin/appointments", {
        method: "PATCH",
        body: { id: "a1", status: "completed" },
      })
    );
    expect(res.status).toBe(500);
  });
});

describe("GET /api/admin/stories", () => {
  it("passes optional status filter", async () => {
    const res = await storiesGET(
      makeRequest("/api/admin/stories", { searchParams: { status: "pending" } })
    );
    expect(res.status).toBe(200);
    expect(mocks.getAllStories).toHaveBeenCalledWith("pending");
  });

  it("returns 500 on error", async () => {
    mocks.getAllStories.mockRejectedValue(new Error("fail"));
    const res = await storiesGET(makeRequest("/api/admin/stories"));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/stories", () => {
  it("approves a story", async () => {
    const res = await storiesPATCH(
      makeRequest("/api/admin/stories", {
        method: "PATCH",
        body: { id: "s1", action: "approve" },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.updateStoryStatus).toHaveBeenCalledWith("s1", "approved", true);
  });

  it("rejects a story", async () => {
    const res = await storiesPATCH(
      makeRequest("/api/admin/stories", {
        method: "PATCH",
        body: { id: "s1", action: "reject" },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.updateStoryStatus).toHaveBeenCalledWith("s1", "rejected", false);
  });

  it("returns 400 for invalid action", async () => {
    const res = await storiesPATCH(
      makeRequest("/api/admin/stories", {
        method: "PATCH",
        body: { id: "s1", action: "maybe" },
      })
    );
    expect(res.status).toBe(400);
  });
});
