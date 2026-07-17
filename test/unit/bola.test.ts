import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendServiceCheckinNotification } from "@/lib/bola";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

const fullData = {
  customerName: "Somchai",
  customerPhone: "0812345678",
  customerEmail: "somchai@example.com",
  carModel: "CX-5",
  branch: "นครปฐม",
  preferredDate: "2026-07-20",
  preferredTime: "14:00",
  notes: "นัดเช็คระยะ 20,000 กม.",
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  delete process.env.BOLA_SERVICE_WEBHOOK_URL;
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

describe("sendServiceCheckinNotification", () => {
  it("returns sent:false and skips the request when no webhook URL is configured", async () => {
    const result = await sendServiceCheckinNotification({ customerName: "Somchai" });
    expect(result).toEqual({ sent: false });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("posts every appointment field to the configured webhook and returns sent:true on success", async () => {
    process.env.BOLA_SERVICE_WEBHOOK_URL = "https://bola-api.staging-th.bearyweb.com/webhook/apm/test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const result = await sendServiceCheckinNotification(fullData);
    expect(result).toEqual({ sent: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://bola-api.staging-th.bearyweb.com/webhook/apm/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: "Somchai",
          customer_phone: "0812345678",
          customer_email: "somchai@example.com",
          car_model: "CX-5",
          branch: "นครปฐม",
          preferred_date: "2026-07-20",
          preferred_time: "14:00",
          notes: "นัดเช็คระยะ 20,000 กม.",
        }),
      })
    );
  });

  it("defaults optional fields to empty strings when omitted", async () => {
    process.env.BOLA_SERVICE_WEBHOOK_URL = "https://bola-api.staging-th.bearyweb.com/webhook/apm/test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    await sendServiceCheckinNotification({ customerName: "Somchai" });
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toEqual({
      customer_name: "Somchai",
      customer_phone: "",
      customer_email: "",
      car_model: "",
      branch: "",
      preferred_date: "",
      preferred_time: "",
      notes: "",
    });
  });

  it("returns sent:false when the webhook responds with a non-ok status", async () => {
    process.env.BOLA_SERVICE_WEBHOOK_URL = "https://bola-api.staging-th.bearyweb.com/webhook/apm/test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("error"),
    });

    const result = await sendServiceCheckinNotification(fullData);
    expect(result).toEqual({ sent: false });
  });

  it("returns sent:false when the request throws", async () => {
    process.env.BOLA_SERVICE_WEBHOOK_URL = "https://bola-api.staging-th.bearyweb.com/webhook/apm/test";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));

    const result = await sendServiceCheckinNotification(fullData);
    expect(result).toEqual({ sent: false });
  });
});
