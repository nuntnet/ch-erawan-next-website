import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import { getAllSocialLinksAdmin, createSocialLink, updateSocialLink, archiveSocialLink } from "@/lib/notion";

const PLATFORMS = ["Facebook", "TikTok", "YouTube", "LINE", "Instagram"] as const;
const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"] as const;

const schema = z.object({
  brand: z.enum(BRANDS),
  platform: z.enum(PLATFORMS),
  url: z.string().url().or(z.literal("")),
  isActive: z.boolean().default(true),
  label: z.string().optional(),
});

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getAllSocialLinksAdmin());
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
    const item = await createSocialLink({
      ...data,
      label: data.label || `${data.brand} ${data.platform}`,
      platform: data.platform,
    });
    await auditFromSession({ action: "create", resource: "social_link", resourceId: item.id });
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
    await updateSocialLink(id, data);
    await auditFromSession({ action: "update", resource: "social_link", resourceId: id });
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
    await archiveSocialLink(id);
    await auditFromSession({ action: "delete", resource: "social_link", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
