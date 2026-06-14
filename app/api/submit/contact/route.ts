import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Client } from "@notionhq/client";
import { trackEvent } from "@/lib/analytics";
import { sendFormNotification } from "@/lib/email";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  message: z.string().min(1),
  branch: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_CONTACTS_DB_ID! },
      properties: {
        Name: { title: [{ text: { content: data.name } }] },
        Message: { rich_text: [{ text: { content: data.message } }] },
        ...(data.email ? { Email: { email: data.email } } : {}),
        ...(data.phone ? { Phone: { phone_number: data.phone } } : {}),
        ...(data.branch ? { Branch: { rich_text: [{ text: { content: data.branch } }] } } : {}),
        "Submitted At": { date: { start: new Date().toISOString() } },
      },
    });

    void trackEvent("contact", { path: "/contact" });
    void sendFormNotification({
      formType: "contact",
      name: data.name,
      phone: data.phone,
      email: data.email,
      fields: {
        สาขา: data.branch ?? "",
        ข้อความ: data.message.slice(0, 200),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Contact submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
