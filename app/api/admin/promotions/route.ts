import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import {
  getAllPromotionsAdmin,
  createPromotion,
  updatePromotion,
  archivePromotion,
} from "@/lib/notion";

const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"] as const;

const promoSchema = z.object({
  title: z.string().min(1),
  brand: z.enum(BRANDS),
  coverImageUrl: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean(),
});

function revalidatePromos(brand?: string) {
  revalidatePath("/");
  if (brand) revalidatePath(`/${brand.toLowerCase()}/promotions`);
  revalidatePath("/gwm/promotions");
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const brand = req.nextUrl.searchParams.get("brand") as typeof BRANDS[number] | null;
    const promos = await getAllPromotionsAdmin();
    const filtered = brand ? promos.filter((p) => p.brand === brand) : promos;
    return NextResponse.json(filtered);
  } catch (err) {
    console.error("Admin promotions GET error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const data = promoSchema.parse(await req.json());
    const promo = await createPromotion({
      ...data,
      coverImageUrl: data.coverImageUrl ?? null,
      linkUrl: data.linkUrl || null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    });
    revalidatePromos(data.brand);
    await auditFromSession({ action: "create", resource: "promotion", resourceId: promo.id, details: { title: data.title } });
    return NextResponse.json(promo);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Admin promotions POST error:", err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { id, ...rest } = z.object({ id: z.string().min(1) }).merge(promoSchema.partial()).parse(body);
    await updatePromotion(id, {
      ...rest,
      coverImageUrl: rest.coverImageUrl ?? undefined,
      linkUrl: rest.linkUrl || null,
    });
    revalidatePromos(rest.brand);
    await auditFromSession({ action: "update", resource: "promotion", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Admin promotions PATCH error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await archivePromotion(id);
    revalidatePromos();
    await auditFromSession({ action: "delete", resource: "promotion", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin promotions DELETE error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
