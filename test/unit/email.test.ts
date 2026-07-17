import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getNotifyEmailForBrand: vi.fn(),
  createTransport: vi.fn(),
}));

vi.mock("@/lib/notion", () => ({
  getNotifyEmailForBrand: mocks.getNotifyEmailForBrand,
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));

import { sendFormNotification, sendAppointmentNotification, resolveBrandFromBranch } from "@/lib/email";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  mocks.getNotifyEmailForBrand.mockResolvedValue(undefined);
  // Clear email-related env vars
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_SECURE;
  delete process.env.SMTP_FROM;
  delete process.env.APPOINTMENT_NOTIFY_EMAIL;
  delete process.env.NON_SALES_APPOINTMENT_NOTIFY_EMAIL;
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

describe("resolveBrandFromBranch", () => {
  it("returns mazda for มาสด้า ช.เอราวัณ นครปฐม", () => {
    expect(resolveBrandFromBranch("มาสด้า ช.เอราวัณ นครปฐม")).toBe("mazda");
  });

  it("returns ford for ฟอร์ด ช.เอราวัณ อ้อมใหญ่", () => {
    expect(resolveBrandFromBranch("ฟอร์ด ช.เอราวัณ อ้อมใหญ่")).toBe("ford");
  });

  it("returns gwm for GWM ช.เอราวัณ นครปฐม", () => {
    expect(resolveBrandFromBranch("GWM ช.เอราวัณ นครปฐม")).toBe("gwm");
  });

  it("returns deepal for Deepal ช.เอราวัณ ศาลายา", () => {
    expect(resolveBrandFromBranch("Deepal ช.เอราวัณ ศาลายา")).toBe("deepal");
  });

  it("returns kia for Kia ช.เอราวัณ นครปฐม", () => {
    expect(resolveBrandFromBranch("Kia ช.เอราวัณ นครปฐม")).toBe("kia");
  });

  it("returns mitsubishi for มิตซูบิชิ ช.เอราวัณ นครปฐม", () => {
    expect(resolveBrandFromBranch("มิตซูบิชิ ช.เอราวัณ นครปฐม")).toBe("mitsubishi");
  });

  it("returns undefined for unknown branch", () => {
    expect(resolveBrandFromBranch("Unknown Branch")).toBeUndefined();
  });

  it("returns undefined when branch is undefined", () => {
    expect(resolveBrandFromBranch(undefined)).toBeUndefined();
  });
});

describe("sendFormNotification", () => {
  const formData = {
    formType: "feedback" as const,
    name: "Somchai",
    phone: "0812345678",
    brandSlug: "gwm" as const,
    fields: { message: "Great service" },
  };

  it("returns sent:false channel:none when no notify email at all", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue(undefined);
    const result = await sendFormNotification(formData);
    expect(result).toEqual({ sent: false, channel: "none" });
  });

  it("returns sent:false channel:none when no RESEND_API_KEY and no SMTP", async () => {
    process.env.APPOINTMENT_NOTIFY_EMAIL = "admin@example.com";
    mocks.getNotifyEmailForBrand.mockResolvedValue(undefined);
    const result = await sendFormNotification(formData);
    expect(result).toEqual({ sent: false, channel: "none" });
  });

  it("uses Notion email when available", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue("gwm@dealer.com");
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const result = await sendFormNotification(formData);
    expect(result).toEqual({ sent: true, channel: "resend" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("falls back to APPOINTMENT_NOTIFY_EMAIL when Notion returns nothing", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue(undefined);
    process.env.APPOINTMENT_NOTIFY_EMAIL = "fallback@dealer.com";
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const result = await sendFormNotification(formData);
    expect(result).toEqual({ sent: true, channel: "resend" });
  });

  it("falls back to SMTP when Resend fails", async () => {
    process.env.APPOINTMENT_NOTIFY_EMAIL = "admin@example.com";
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("error") });

    const sendMailMock = vi.fn().mockResolvedValue(undefined);
    mocks.createTransport.mockReturnValue({ sendMail: sendMailMock });
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";

    const result = await sendFormNotification(formData);
    expect(result).toEqual({ sent: true, channel: "smtp" });
    expect(sendMailMock).toHaveBeenCalled();
  });
});

describe("sendAppointmentNotification", () => {
  const appointmentData = {
    customerName: "Somchai",
    customerPhone: "0812345678",
    type: "test_drive",
    branch: "GWM ช.เอราวัณ นครปฐม",
  };

  it("returns sent:false channel:none when no notify email", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue(undefined);
    const result = await sendAppointmentNotification(appointmentData);
    expect(result).toEqual({ sent: false, channel: "none" });
  });

  it("resolves brand from branch and sends via Resend", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue("gwm@dealer.com");
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const result = await sendAppointmentNotification(appointmentData);
    expect(result).toEqual({ sent: true, channel: "resend" });
    expect(mocks.getNotifyEmailForBrand).toHaveBeenCalledWith("gwm");
  });

  it("uses explicit brandSlug over branch resolution", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue("mazda@dealer.com");
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const result = await sendAppointmentNotification({
      ...appointmentData,
      brandSlug: "mazda",
    });
    expect(result).toEqual({ sent: true, channel: "resend" });
    expect(mocks.getNotifyEmailForBrand).toHaveBeenCalledWith("mazda");
  });

  it("returns sent:false channel:none when no providers configured", async () => {
    process.env.APPOINTMENT_NOTIFY_EMAIL = "admin@example.com";
    mocks.getNotifyEmailForBrand.mockResolvedValue(undefined);
    const result = await sendAppointmentNotification(appointmentData);
    expect(result).toEqual({ sent: false, channel: "none" });
  });

  it("returns sent:false on send error", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue("gwm@dealer.com");
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));

    const result = await sendAppointmentNotification(appointmentData);
    expect(result).toEqual({ sent: false, channel: "none" });
  });

  it.each(["service", "body_paint", "insurance_quote"] as const)(
    "routes %s bookings to the fixed inbox instead of the brand's Notion email",
    async (type) => {
      // Even though a brand-specific email exists in Notion, only test_drive
      // (sales dept interest) should use it — everything else must not.
      mocks.getNotifyEmailForBrand.mockResolvedValue("gwm@dealer.com");
      process.env.RESEND_API_KEY = "re_test_key";
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      const result = await sendAppointmentNotification({ ...appointmentData, type });
      expect(result).toEqual({ sent: true, channel: "resend" });
      expect(mocks.getNotifyEmailForBrand).not.toHaveBeenCalled();
      const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(body.to).toBe("nuntawit@ch-erawan.com");
    }
  );

  it("resolves test_drive bookings via the brand's Notion email (sales dept)", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue("gwm@dealer.com");
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    await sendAppointmentNotification({ ...appointmentData, type: "test_drive" });
    expect(mocks.getNotifyEmailForBrand).toHaveBeenCalledWith("gwm");
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.to).toBe("gwm@dealer.com");
  });

  it("lets NON_SALES_APPOINTMENT_NOTIFY_EMAIL override the fixed non-sales inbox", async () => {
    process.env.NON_SALES_APPOINTMENT_NOTIFY_EMAIL = "non-sales-team@ch-erawan.com";
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    await sendAppointmentNotification({ ...appointmentData, type: "service" });
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.to).toBe("non-sales-team@ch-erawan.com");
  });

  it("sends no html and no photo lines for a plain booking with no attachments", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue("gwm@dealer.com");
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    await sendAppointmentNotification(appointmentData);
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.html).toBeUndefined();
    expect(body.text).not.toContain("รูปความเสียหาย");
  });

  it("includes an inline HTML gallery and plain-text link fallback when damage photos are attached", async () => {
    mocks.getNotifyEmailForBrand.mockResolvedValue("gwm@dealer.com");
    process.env.RESEND_API_KEY = "re_test_key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    await sendAppointmentNotification({
      ...appointmentData,
      damagePhotoUrls: ["https://res.cloudinary.com/demo/image/upload/damage1.jpg"],
      insuranceDocUrls: ["https://res.cloudinary.com/demo/raw/upload/doc1.pdf"],
    });
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.html).toContain("https://res.cloudinary.com/demo/image/upload/damage1.jpg");
    expect(body.html).toContain("<img");
    expect(body.text).toContain("https://res.cloudinary.com/demo/image/upload/damage1.jpg");
    expect(body.text).toContain("https://res.cloudinary.com/demo/raw/upload/doc1.pdf");
  });
});
