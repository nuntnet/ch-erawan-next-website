import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import { getAllServiceSectionsAdmin, createServiceSection, updateServiceSection } from "@/lib/notion";

const pageEnum = z.enum(["body-repair", "service", "one-stop"]);
const BRANDS = ["GWM", "Mazda", "Ford", "Mitsubishi", "Deepal", "Kia"] as const;

export async function GET() {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    return NextResponse.json(await getAllServiceSectionsAdmin());
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    const data = z.object({
      title: z.string().min(1),
      page: pageEnum,
      brand: z.enum(BRANDS),
      sectionKey: z.string(),
      sortOrder: z.number().default(99),
    }).parse(await req.json());
    const section = await createServiceSection(data);
    await auditFromSession({ action: "create", resource: "service_content", resourceId: section.id });
    return NextResponse.json(section);
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
      title: z.string().optional(),
      sectionKey: z.string().optional(),
      sortOrder: z.number().optional(),
      isPublished: z.boolean().optional(),
    }).parse(await req.json());
    await updateServiceSection(id, data);
    await auditFromSession({ action: "update", resource: "service_content", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
