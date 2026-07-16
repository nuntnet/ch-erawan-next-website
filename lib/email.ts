import nodemailer from "nodemailer";
import { BRANDS, type BrandSlug } from "@/lib/brandConfig";
import { getNotifyEmailForBrand as getNotifyEmailFromNotion } from "@/lib/notion";

const TYPE_LABELS: Record<string, string> = {
  test_drive: "ทดลองขับ",
  service: "เข้าศูนย์บริการ",
  body_paint: "แจ้งซ่อมตัวถัง/สี",
  insurance_quote: "ขอใบเสนอราคาประกัน",
};

const BRANCH_BRAND_MAP: Record<string, BrandSlug> = {
  "มาสด้า ช.เอราวัณ นครปฐม": "mazda",
  "มาสด้า ช.เอราวัณ ศาลายา": "mazda",
  "Deepal ช.เอราวัณ ศาลายา": "deepal",
  "ฟอร์ด ช.เอราวัณ อ้อมใหญ่": "ford",
  "ฟอร์ด ช.เอราวัณ นครปฐม": "ford",
  "มิตซูบิชิ ช.เอราวัณ นครปฐม": "mitsubishi",
  "GWM ช.เอราวัณ นครปฐม": "gwm",
  "Kia ช.เอราวัณ นครปฐม": "kia",
};

async function resolveNotifyEmail(brandSlug?: BrandSlug): Promise<string | undefined> {
  if (brandSlug) {
    const notionEmail = await getNotifyEmailFromNotion(brandSlug);
    if (notionEmail) return notionEmail;
  }
  return process.env.APPOINTMENT_NOTIFY_EMAIL;
}

export function resolveBrandFromBranch(branch?: string): BrandSlug | undefined {
  if (!branch) return undefined;
  return BRANCH_BRAND_MAP[branch];
}

export interface AppointmentEmailPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  type: string;
  carModel?: string;
  branch?: string;
  brandSlug?: BrandSlug;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  damagePhotoUrls?: string[];
  insuranceDocUrls?: string[];
}

function buildPlainTextBody(data: AppointmentEmailPayload): string {
  const lines = [
    "มีการนัดหมายใหม่จากเว็บไซต์ ช.เอราวัณ กรุ๊ป",
    "",
    `ประเภท: ${TYPE_LABELS[data.type] ?? data.type}`,
    `ชื่อลูกค้า: ${data.customerName}`,
    `เบอร์โทร: ${data.customerPhone}`,
  ];
  if (data.customerEmail) lines.push(`อีเมล: ${data.customerEmail}`);
  if (data.carModel) lines.push(`รุ่นรถ: ${data.carModel}`);
  if (data.branch) lines.push(`สาขา: ${data.branch}`);
  if (data.preferredDate) lines.push(`วันที่ต้องการ: ${data.preferredDate}`);
  if (data.preferredTime) lines.push(`เวลา: ${data.preferredTime}`);
  if (data.notes) lines.push(`หมายเหตุ: ${data.notes}`);
  if (data.damagePhotoUrls?.length) lines.push("", "รูปความเสียหาย:", ...data.damagePhotoUrls);
  if (data.insuranceDocUrls?.length) lines.push("", "เอกสารแนบ/ประกัน:", ...data.insuranceDocUrls);
  lines.push("", "กรุณาติดต่อลูกค้าภายใน 24 ชั่วโมง");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** HTML version with inline photo thumbnails — only built when there's something to attach,
 * so a normal test_drive/service booking email stays plain text. */
function buildAppointmentHtmlBody(data: AppointmentEmailPayload): string | undefined {
  if (!data.damagePhotoUrls?.length && !data.insuranceDocUrls?.length) return undefined;

  const rows: string[] = [
    `<p>มีการนัดหมายใหม่จากเว็บไซต์ ช.เอราวัณ กรุ๊ป</p>`,
    `<p><b>ประเภท:</b> ${escapeHtml(TYPE_LABELS[data.type] ?? data.type)}<br/>`,
    `<b>ชื่อลูกค้า:</b> ${escapeHtml(data.customerName)}<br/>`,
    `<b>เบอร์โทร:</b> ${escapeHtml(data.customerPhone)}` +
      (data.customerEmail ? `<br/><b>อีเมล:</b> ${escapeHtml(data.customerEmail)}` : "") +
      (data.carModel ? `<br/><b>รุ่นรถ:</b> ${escapeHtml(data.carModel)}` : "") +
      (data.branch ? `<br/><b>สาขา:</b> ${escapeHtml(data.branch)}` : "") +
      (data.preferredDate ? `<br/><b>วันที่ต้องการ:</b> ${escapeHtml(data.preferredDate)}` : "") +
      (data.preferredTime ? `<br/><b>เวลา:</b> ${escapeHtml(data.preferredTime)}` : "") +
      `</p>`,
  ];
  if (data.notes) rows.push(`<p><b>หมายเหตุ:</b><br/>${escapeHtml(data.notes).replace(/\n/g, "<br/>")}</p>`);

  if (data.damagePhotoUrls?.length) {
    rows.push(`<p><b>รูปความเสียหาย (${data.damagePhotoUrls.length}):</b></p>`);
    rows.push(
      `<div>${data.damagePhotoUrls
        .map((url) => `<a href="${url}"><img src="${url}" width="160" style="border-radius:8px;margin:0 8px 8px 0" /></a>`)
        .join("")}</div>`
    );
  }
  if (data.insuranceDocUrls?.length) {
    rows.push(`<p><b>เอกสารแนบ/ประกัน (${data.insuranceDocUrls.length}):</b></p>`);
    rows.push(
      `<p>${data.insuranceDocUrls.map((url, i) => `<a href="${url}">เอกสาร ${i + 1}</a>`).join(" · ")}</p>`
    );
  }
  rows.push(`<p>กรุณาติดต่อลูกค้าภายใน 24 ชั่วโมง</p>`);
  return rows.join("\n");
}

async function sendViaResend(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, ...(html ? { html } : {}) }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Resend failed:", res.status, err);
    return false;
  }
  return true;
}

async function sendViaSmtp(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
  return true;
}

export interface FormNotificationPayload {
  formType: "contact" | "feedback" | "story";
  name: string;
  phone?: string;
  email?: string;
  brandSlug?: BrandSlug;
  fields: Record<string, string>;
}

const FORM_LABELS: Record<string, string> = {
  contact: "ข้อความติดต่อ",
  feedback: "แนะนำ-ติชม",
  story: "รีวิวลูกค้า",
};

function buildFormNotificationBody(data: FormNotificationPayload): string {
  const lines = [
    `มี${FORM_LABELS[data.formType]}ใหม่จากเว็บไซต์ ช.เอราวัณ กรุ๊ป`,
    "",
    `ประเภท: ${FORM_LABELS[data.formType]}`,
    `ชื่อ: ${data.name}`,
  ];
  if (data.phone) lines.push(`เบอร์โทร: ${data.phone}`);
  if (data.email) lines.push(`อีเมล: ${data.email}`);
  for (const [key, value] of Object.entries(data.fields)) {
    if (value) lines.push(`${key}: ${value}`);
  }
  lines.push("", "กรุณาตรวจสอบใน Admin Panel");
  return lines.join("\n");
}

/** Send a password reset link to an admin user. */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ sent: boolean; channel?: "resend" | "smtp" | "none" }> {
  const subject = "รีเซ็ตรหัสผ่าน — ช.เอราวัณ กรุ๊ป Admin Panel";
  const text = [
    "มีการขอรีเซ็ตรหัสผ่านสำหรับบัญชี Admin Panel ของคุณ",
    "",
    "กดลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง):",
    resetUrl,
    "",
    "หากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้",
  ].join("\n");

  try {
    if (await sendViaResend(to, subject, text)) return { sent: true, channel: "resend" };
    if (await sendViaSmtp(to, subject, text)) return { sent: true, channel: "smtp" };
    console.warn("[email] No provider configured — password reset link logged only");
    console.info("[email] Password reset URL for", to, ":", resetUrl);
    return { sent: false, channel: "none" };
  } catch (err) {
    console.error("[email] Failed to send password reset email:", err);
    return { sent: false, channel: "none" };
  }
}

/** Notify admin of a new form submission (contact, feedback, story). */
export async function sendFormNotification(
  data: FormNotificationPayload
): Promise<{ sent: boolean; channel?: "resend" | "smtp" | "none" }> {
  const to = await resolveNotifyEmail(data.brandSlug);
  if (!to) {
    console.warn(`[email] No notify email — skipping ${data.formType} notification`);
    return { sent: false, channel: "none" };
  }

  const subject = `[${FORM_LABELS[data.formType]}] ${data.name}`;
  const text = buildFormNotificationBody(data);

  try {
    if (await sendViaResend(to, subject, text)) return { sent: true, channel: "resend" };
    if (await sendViaSmtp(to, subject, text)) return { sent: true, channel: "smtp" };
    console.warn(`[email] No provider — ${data.formType} notification logged only`);
    return { sent: false, channel: "none" };
  } catch (err) {
    console.error(`[email] Failed to send ${data.formType} notification:`, err);
    return { sent: false, channel: "none" };
  }
}

/** Notify dealer of a new appointment. Routes to brand-specific email when available. */
export async function sendAppointmentNotification(
  data: AppointmentEmailPayload
): Promise<{ sent: boolean; channel?: "resend" | "smtp" | "none" }> {
  const brandSlug = data.brandSlug ?? resolveBrandFromBranch(data.branch);
  const to = await resolveNotifyEmail(brandSlug);
  if (!to) {
    console.warn("[email] No notify email configured — skipping notification");
    return { sent: false, channel: "none" };
  }

  const brandLabel = brandSlug ? BRANDS.find((b) => b.slug === brandSlug)?.displayName : undefined;
  const subject = `[นัดหมายใหม่]${brandLabel ? ` ${brandLabel} —` : ""} ${TYPE_LABELS[data.type] ?? data.type} — ${data.customerName}`;
  const text = buildPlainTextBody(data);
  const html = buildAppointmentHtmlBody(data);

  try {
    if (await sendViaResend(to, subject, text, html)) {
      return { sent: true, channel: "resend" };
    }
    if (await sendViaSmtp(to, subject, text, html)) {
      return { sent: true, channel: "smtp" };
    }
    console.warn("[email] No email provider configured — notification logged only");
    console.info("[email] Would notify:", subject);
    return { sent: false, channel: "none" };
  } catch (err) {
    console.error("[email] Failed to send appointment notification:", err);
    return { sent: false, channel: "none" };
  }
}
