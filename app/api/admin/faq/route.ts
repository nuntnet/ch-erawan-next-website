import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import { getAllFAQAdmin, createFAQItem, updateFAQItem, archiveFAQItem } from "@/lib/notion";

const PAGES = ["body-repair", "service", "one-stop", "general"] as const;
const BRANDS = ["GWM", "Mazda", "Ford", "Mitsubishi", "Deepal", "Kia", "ทุกแบรนด์"] as const;

const schema = z.object({
  question: z.string().min(1, "กรุณาใส่คำถาม"),
  answer: z.string().min(1, "กรุณาใส่คำตอบ"),
  page: z.enum(PAGES),
  brand: z.enum(BRANDS),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(99),
});

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getAllFAQAdmin());
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const data = schema.parse(await req.json());
    const item = await createFAQItem(data);
    await auditFromSession({ action: "create", resource: "faq", resourceId: item.id, details: { question: data.question } });
    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id, ...data } = z.object({ id: z.string().min(1) }).merge(schema.partial()).parse(await req.json());
    await updateFAQItem(id, data);
    await auditFromSession({ action: "update", resource: "faq", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await archiveFAQItem(id);
    await auditFromSession({ action: "delete", resource: "faq", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
