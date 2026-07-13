import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import {
  getAllInsurancePartnersAdmin, createInsurancePartner,
  updateInsurancePartner, archiveInsurancePartner,
} from "@/lib/notion";

const BRANDS = ["ทุกแบรนด์", "Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia", "GAC", "Lepas"] as const;

export async function GET() {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    return NextResponse.json(await getAllInsurancePartnersAdmin());
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    const { name, brand } = z.object({ name: z.string().min(1), brand: z.enum(BRANDS) }).parse(await req.json());
    const item = await createInsurancePartner(name, brand);
    await auditFromSession({ action: "create", resource: "insurance_partner", resourceId: item.id, details: { name } });
    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    const { id, ...data } = z.object({
      id: z.string().min(1),
      name: z.string().min(1).optional(),
      brand: z.enum(BRANDS).optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }).parse(await req.json());
    await updateInsurancePartner(id, data);
    await auditFromSession({ action: "update", resource: "insurance_partner", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await archiveInsurancePartner(id);
    await auditFromSession({ action: "delete", resource: "insurance_partner", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
