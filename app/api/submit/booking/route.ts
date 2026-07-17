import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Client } from "@notionhq/client";
import { sendAppointmentNotification, resolveBrandFromBranch } from "@/lib/email";
import { sendServiceCheckinNotification } from "@/lib/bola";
import { trackEvent } from "@/lib/analytics";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const schema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  type: z.enum(["test_drive", "service", "body_paint", "insurance_quote"]),
  carModel: z.string().optional(),
  branch: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
  damageDescription: z.string().optional(),
  insuranceCompany: z.string().optional(),
  vehicleRegistration: z.string().optional(),
  coverageType: z.string().optional(),
  damagePhotoUrls: z.array(z.string().url()).optional(),
  insuranceDocUrls: z.array(z.string().url()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Fold uploaded file URLs into Notes (the appointments DB has no dedicated
    // URL columns; writing non-existent properties previously caused a 500).
    const notesText = [
      data.notes,
      data.damagePhotoUrls?.length ? `รูปความเสียหาย:\n${data.damagePhotoUrls.join("\n")}` : "",
      data.insuranceDocUrls?.length ? `เอกสารแนบ/ประกัน:\n${data.insuranceDocUrls.join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_APPOINTMENTS_DB_ID! },
      properties: {
        "Customer Name": { title: [{ text: { content: data.customerName } }] },
        Type: { select: { name: data.type } },
        Status: { select: { name: "pending" } },
        "Customer Phone": { phone_number: data.customerPhone },
        ...(data.customerEmail ? { "Customer Email": { email: data.customerEmail } } : {}),
        ...(data.carModel ? { "Car Model": { rich_text: [{ text: { content: data.carModel } }] } } : {}),
        ...(data.branch ? { Branch: { rich_text: [{ text: { content: data.branch } }] } } : {}),
        ...(data.preferredDate ? { "Preferred Date": { date: { start: data.preferredDate } } } : {}),
        ...(data.preferredTime ? { "Preferred Time": { rich_text: [{ text: { content: data.preferredTime } }] } } : {}),
        ...(notesText ? { Notes: { rich_text: [{ text: { content: notesText } }] } } : {}),
        ...(data.damageDescription ? { "Damage Description": { rich_text: [{ text: { content: data.damageDescription } }] } } : {}),
        ...(data.insuranceCompany ? { "Insurance Company": { rich_text: [{ text: { content: data.insuranceCompany } }] } } : {}),
        ...(data.vehicleRegistration ? { "Vehicle Registration": { rich_text: [{ text: { content: data.vehicleRegistration } }] } } : {}),
        ...(data.coverageType ? { "Coverage Type": { rich_text: [{ text: { content: data.coverageType } }] } } : {}),
        "Submitted At": { date: { start: new Date().toISOString() } },
      },
    });

    const emailResult = await sendAppointmentNotification({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      type: data.type,
      carModel: data.carModel,
      branch: data.branch,
      brandSlug: resolveBrandFromBranch(data.branch),
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      notes: data.notes,
      damagePhotoUrls: data.damagePhotoUrls,
      insuranceDocUrls: data.insuranceDocUrls,
    });
    console.log("[booking] Email result:", JSON.stringify(emailResult));

    if (data.type === "service") {
      const bolaResult = await sendServiceCheckinNotification({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        carModel: data.carModel,
        branch: data.branch,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        notes: data.notes,
      });
      console.log("[booking] Bola LINE notification result:", JSON.stringify(bolaResult));
    }

    void trackEvent("booking", { model: data.carModel, path: "/booking" });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Booking submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
