import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import { getAllFeedbackAdmin, updateFeedbackStatus } from "@/lib/notion";
import type { CustomerFeedback } from "@/lib/notion-types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await getAllFeedbackAdmin();
    return NextResponse.json(items);
  } catch (err) {
    console.error("Admin feedback GET error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ใหม่", "กำลังดำเนินการ", "แก้ไขแล้ว"]),
});

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id, status } = patchSchema.parse(await req.json());
    await updateFeedbackStatus(id, status as CustomerFeedback["status"]);
    await auditFromSession({ action: "update", resource: "feedback", resourceId: id, details: { status } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Admin feedback PATCH error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
