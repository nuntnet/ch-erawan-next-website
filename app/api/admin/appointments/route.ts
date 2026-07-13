import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllAppointments, updateAppointmentStatus } from "@/lib/notion";
import { requireStaff } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";

// GET /api/admin/appointments — list all appointments
export async function GET() {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    const appointments = await getAllAppointments();
    return NextResponse.json(appointments);
  } catch (err) {
    console.error("Admin appointments GET error:", err);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

// PATCH /api/admin/appointments — update appointment status
const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

export async function PATCH(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { id, status } = patchSchema.parse(body);
    await updateAppointmentStatus(id, status);
    await auditFromSession({ action: "update", resource: "appointment", resourceId: id, details: { status } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Admin appointments PATCH error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
