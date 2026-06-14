import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Client } from "@notionhq/client";
import { sendFormNotification } from "@/lib/email";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const schema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  story: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  carModel: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_STORIES_DB_ID! },
      properties: {
        Name: { title: [{ text: { content: data.customerName } }] },
        "Customer Name": { rich_text: [{ text: { content: data.customerName } }] },
        Story: { rich_text: [{ text: { content: data.story } }] },
        Rating: { number: data.rating },
        ...(data.carModel ? { "Car Model": { rich_text: [{ text: { content: data.carModel } }] } } : {}),
        ...(data.customerEmail ? { Email: { email: data.customerEmail } } : {}),
        ...(data.customerPhone ? { Phone: { phone_number: data.customerPhone } } : {}),
        Status: { select: { name: "pending" } },
        "Is Public": { checkbox: false },
      },
    });

    void sendFormNotification({
      formType: "story",
      name: data.customerName,
      phone: data.customerPhone,
      email: data.customerEmail,
      fields: {
        คะแนน: `${data.rating}/5`,
        รุ่นรถ: data.carModel ?? "",
        เรื่องราว: data.story.slice(0, 200),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Story submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
