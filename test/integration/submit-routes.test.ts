import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeRequest, jsonBody } from "../helpers/integration-utils";
import {
  validBookingBody,
  validContactBody,
  validStoryBody,
} from "../helpers/api-fixtures";

const notionMock = vi.hoisted(() => ({
  pages: { create: vi.fn(async () => ({ id: "new-page" })) },
}));

const emailMock = vi.hoisted(() => ({
  sendAppointmentNotification: vi.fn(async () => ({ sent: false, channel: "none" as const })),
  sendFormNotification: vi.fn(async () => ({ sent: false, channel: "none" as const })),
  resolveBrandFromBranch: vi.fn(() => undefined),
}));

const bolaMock = vi.hoisted(() => ({
  sendServiceCheckinNotification: vi.fn(async () => ({ sent: false })),
}));

vi.mock("@notionhq/client", () => ({
  Client: vi.fn(function () {
    return notionMock;
  }),
}));

vi.mock("@/lib/email", () => ({
  sendAppointmentNotification: emailMock.sendAppointmentNotification,
  sendFormNotification: emailMock.sendFormNotification,
  resolveBrandFromBranch: emailMock.resolveBrandFromBranch,
}));

vi.mock("@/lib/bola", () => ({
  sendServiceCheckinNotification: bolaMock.sendServiceCheckinNotification,
}));

import { POST as bookingPOST } from "@/app/api/submit/booking/route";
import { POST as contactPOST } from "@/app/api/submit/contact/route";
import { POST as storyPOST } from "@/app/api/submit/story/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("NOTION_API_KEY", "secret");
  vi.stubEnv("NOTION_APPOINTMENTS_DB_ID", "appt-db");
  vi.stubEnv("NOTION_CONTACTS_DB_ID", "contact-db");
  vi.stubEnv("NOTION_STORIES_DB_ID", "story-db");
  notionMock.pages.create.mockReset();
  notionMock.pages.create.mockResolvedValue({ id: "new-page" });
  emailMock.sendAppointmentNotification.mockReset();
  emailMock.sendAppointmentNotification.mockResolvedValue({ sent: false, channel: "none" });
  emailMock.sendFormNotification.mockReset();
  emailMock.sendFormNotification.mockResolvedValue({ sent: false, channel: "none" });
  bolaMock.sendServiceCheckinNotification.mockReset();
  bolaMock.sendServiceCheckinNotification.mockResolvedValue({ sent: false });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/submit/booking", () => {
  it("creates an appointment in Notion", async () => {
    const res = await bookingPOST(
      makeRequest("/api/submit/booking", { method: "POST", body: validBookingBody })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(notionMock.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: { database_id: "appt-db" },
        properties: expect.objectContaining({
          "Customer Name": expect.any(Object),
          Type: { select: { name: "test_drive" } },
          Status: { select: { name: "pending" } },
        }),
      })
    );
    expect(emailMock.sendAppointmentNotification).toHaveBeenCalled();
  });

  it("stores uploaded file URLs for body_paint bookings", async () => {
    const res = await bookingPOST(
      makeRequest("/api/submit/booking", {
        method: "POST",
        body: {
          ...validBookingBody,
          type: "body_paint",
          damagePhotoUrls: ["https://cdn.example/damage.jpg"],
          insuranceDocUrls: ["https://cdn.example/policy.pdf"],
        },
      })
    );
    expect(res.status).toBe(200);
    expect(notionMock.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          "Damage Photo URLs": {
            rich_text: [{ text: { content: "https://cdn.example/damage.jpg" } }],
          },
          "Insurance Doc URLs": {
            rich_text: [{ text: { content: "https://cdn.example/policy.pdf" } }],
          },
        }),
      })
    );
  });

  it("returns 400 for missing required fields", async () => {
    const res = await bookingPOST(
      makeRequest("/api/submit/booking", {
        method: "POST",
        body: { customerName: "", customerPhone: "" },
      })
    );
    expect(res.status).toBe(400);
    const body = await jsonBody<{ error: string; issues: unknown[] }>(res);
    expect(body.error).toBe("Invalid data");
  });

  it("returns 400 for invalid email", async () => {
    const res = await bookingPOST(
      makeRequest("/api/submit/booking", {
        method: "POST",
        body: { ...validBookingBody, customerEmail: "not-an-email" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Notion throws", async () => {
    notionMock.pages.create.mockRejectedValue(new Error("notion down"));
    const res = await bookingPOST(
      makeRequest("/api/submit/booking", { method: "POST", body: validBookingBody })
    );
    expect(res.status).toBe(500);
  });

  it("fires the Bola LINE check-in webhook with the full appointment payload for service bookings", async () => {
    const res = await bookingPOST(
      makeRequest("/api/submit/booking", {
        method: "POST",
        body: { ...validBookingBody, type: "service" },
      })
    );
    expect(res.status).toBe(200);
    expect(bolaMock.sendServiceCheckinNotification).toHaveBeenCalledWith({
      customerName: validBookingBody.customerName,
      customerPhone: validBookingBody.customerPhone,
      customerEmail: undefined,
      carModel: validBookingBody.carModel,
      branch: validBookingBody.branch,
      preferredDate: undefined,
      preferredTime: undefined,
      notes: undefined,
    });
  });

  it("does not fire the Bola webhook for non-service booking types", async () => {
    const res = await bookingPOST(
      makeRequest("/api/submit/booking", { method: "POST", body: validBookingBody })
    );
    expect(res.status).toBe(200);
    expect(bolaMock.sendServiceCheckinNotification).not.toHaveBeenCalled();
  });
});

describe("POST /api/submit/contact", () => {
  it("creates a contact submission in Notion", async () => {
    const res = await contactPOST(
      makeRequest("/api/submit/contact", { method: "POST", body: validContactBody })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(notionMock.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: { database_id: "contact-db" },
        properties: expect.objectContaining({
          Name: expect.any(Object),
          Message: expect.any(Object),
        }),
      })
    );
  });

  it("returns 400 when message is empty", async () => {
    const res = await contactPOST(
      makeRequest("/api/submit/contact", {
        method: "POST",
        body: { name: "A", message: "" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Notion throws", async () => {
    notionMock.pages.create.mockRejectedValue(new Error("fail"));
    const res = await contactPOST(
      makeRequest("/api/submit/contact", { method: "POST", body: validContactBody })
    );
    expect(res.status).toBe(500);
  });
});

describe("POST /api/submit/story", () => {
  it("creates a story in Notion with pending status", async () => {
    const res = await storyPOST(
      makeRequest("/api/submit/story", { method: "POST", body: validStoryBody })
    );
    expect(res.status).toBe(200);
    expect(notionMock.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: { database_id: "story-db" },
        properties: expect.objectContaining({
          Status: { select: { name: "pending" } },
          "Is Public": { checkbox: false },
          Rating: { number: 5 },
        }),
      })
    );
  });

  it("returns 400 when rating is out of range", async () => {
    const res = await storyPOST(
      makeRequest("/api/submit/story", {
        method: "POST",
        body: { ...validStoryBody, rating: 10 },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when story text is missing", async () => {
    const res = await storyPOST(
      makeRequest("/api/submit/story", {
        method: "POST",
        body: { ...validStoryBody, story: "" },
      })
    );
    expect(res.status).toBe(400);
  });
});
