import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, jsonBody } from "../helpers/integration-utils";

const notionMock = vi.hoisted(() => ({
  pages: { create: vi.fn(async () => ({ id: "new-page" })) },
}));

const emailMock = vi.hoisted(() => ({
  sendAppointmentNotification: vi.fn(async () => ({ sent: false, channel: "none" as const })),
  resolveBrandFromBranch: vi.fn(() => undefined),
}));

const bolaMock = vi.hoisted(() => ({
  sendServiceCheckinNotification: vi.fn(async () => ({ sent: false })),
}));

const spsLogMock = vi.hoisted(() => ({
  logSpsCall: vi.fn(async () => undefined),
}));

vi.mock("@notionhq/client", () => ({
  Client: vi.fn(function () {
    return notionMock;
  }),
}));

vi.mock("@/lib/email", () => ({
  sendAppointmentNotification: emailMock.sendAppointmentNotification,
  resolveBrandFromBranch: emailMock.resolveBrandFromBranch,
}));

vi.mock("@/lib/bola", () => ({
  sendServiceCheckinNotification: bolaMock.sendServiceCheckinNotification,
}));

vi.mock("@/lib/sps-log", () => ({
  logSpsCall: spsLogMock.logSpsCall,
}));

import { POST as serviceBookingPOST } from "@/app/api/submit/service-booking/route";

const validServiceBookingBody = {
  customerName: "Somchai",
  customerPhone: "0812345678",
  customerEmail: "",
  branch: "GWM ช.เอราวัณ นครปฐม",
  preferredDate: "2026-07-20", // a Monday
  preferredTime: "08:00-10:00",
};

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("NOTION_API_KEY", "secret");
  vi.stubEnv("NOTION_APPOINTMENTS_DB_ID", "appt-db");
  notionMock.pages.create.mockReset();
  notionMock.pages.create.mockResolvedValue({ id: "new-page" });
  emailMock.sendAppointmentNotification.mockReset();
  emailMock.sendAppointmentNotification.mockResolvedValue({ sent: false, channel: "none" });
  bolaMock.sendServiceCheckinNotification.mockReset();
  bolaMock.sendServiceCheckinNotification.mockResolvedValue({ sent: false });
  spsLogMock.logSpsCall.mockReset();
  globalThis.fetch = vi.fn().mockResolvedValue({
    status: 200,
    text: () => Promise.resolve("ขอขอบคุณสำหรับการนัดหมาย"),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  globalThis.fetch = originalFetch;
});

describe("POST /api/submit/service-booking", () => {
  it("creates the Notion appointment and fires both the email and Bola notifications", async () => {
    const res = await serviceBookingPOST(
      makeRequest("/api/submit/service-booking", { method: "POST", body: validServiceBookingBody })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true, spsSuccess: true });

    expect(notionMock.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: { database_id: "appt-db" },
        properties: expect.objectContaining({
          Type: { select: { name: "service" } },
          Status: { select: { name: "pending" } },
        }),
      })
    );
    expect(emailMock.sendAppointmentNotification).toHaveBeenCalledWith(
      expect.objectContaining({ customerName: "Somchai", type: "service" })
    );
    expect(bolaMock.sendServiceCheckinNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "Somchai",
        customerPhone: "0812345678",
        branch: "GWM ช.เอราวัณ นครปฐม",
        preferredDate: "2026-07-20",
        preferredTime: "08:00-10:00",
      })
    );
  });

  it("still fires the Bola notification even when SPS itself fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 500,
      text: () => Promise.resolve("<html>error</html>"),
    });

    const res = await serviceBookingPOST(
      makeRequest("/api/submit/service-booking", { method: "POST", body: validServiceBookingBody })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual(
      expect.objectContaining({ success: true, spsSuccess: false })
    );
    expect(bolaMock.sendServiceCheckinNotification).toHaveBeenCalled();
  });

  it("returns 400 for Sunday bookings without calling any notification", async () => {
    const res = await serviceBookingPOST(
      makeRequest("/api/submit/service-booking", {
        method: "POST",
        body: { ...validServiceBookingBody, preferredDate: "2026-07-19" }, // a Sunday
      })
    );
    expect(res.status).toBe(400);
    expect(bolaMock.sendServiceCheckinNotification).not.toHaveBeenCalled();
    expect(emailMock.sendAppointmentNotification).not.toHaveBeenCalled();
  });

  it("returns 400 for an unsupported branch", async () => {
    const res = await serviceBookingPOST(
      makeRequest("/api/submit/service-booking", {
        method: "POST",
        body: { ...validServiceBookingBody, branch: "ไม่มีสาขานี้" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await serviceBookingPOST(
      makeRequest("/api/submit/service-booking", {
        method: "POST",
        body: { customerName: "", customerPhone: "" },
      })
    );
    expect(res.status).toBe(400);
  });
});
