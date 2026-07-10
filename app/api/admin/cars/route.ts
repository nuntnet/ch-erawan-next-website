import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import {
  getAllCarsAdmin,
  getCarById,
  createCar,
  updateCar,
  setCarFlags,
  archiveCar,
  bulkSetCarSortOrder,
} from "@/lib/notion";
import type { CarInput } from "@/lib/notion-types";

const carSchema = z.object({
  name: z.string().min(1),
  brand: z.enum(["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"]),
  model: z.string().min(1),
  year: z.number().int(),
  type: z.enum(["sedan", "suv", "pickup", "hatchback", "mpv", "ev", "other"]),
  condition: z.enum(["new", "used"]),
  priceMin: z.number().nonnegative(),
  priceMax: z.number().nonnegative(),
  engineSize: z.string(),
  transmission: z.enum(["auto", "manual"]),
  fuelType: z.enum(["petrol", "diesel", "hybrid", "electric", "phev"]),
  description: z.string(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])),
  imageUrls: z.array(z.string()),
  videoUrl: z.string().url().nullable().or(z.literal("")),
  isActive: z.boolean(),
  isBestSeller: z.boolean(),
  navFeatured: z.boolean().optional().default(false),
  navNew: z.boolean().optional().default(false),
  slug: z.string(),
});

function revalidateCars(slug?: string) {
  revalidatePath("/cars");
  revalidatePath("/");
  if (slug) revalidatePath(`/cars/${slug}`);
}

async function revalidateCarsByNotionId(notionId: string) {
  revalidatePath("/cars");
  revalidatePath("/");
  const car = await getCarById(notionId);
  if (car?.slug) revalidatePath(`/cars/${car.slug}`);
}

// GET — list all cars (admin, includes inactive)
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const cars = await getAllCarsAdmin();
    return NextResponse.json(cars);
  } catch (err) {
    console.error("Admin cars GET error:", err);
    return NextResponse.json({ error: "Failed to fetch cars" }, { status: 500 });
  }
}

// POST — create a car
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const data = carSchema.parse(body);
    const car = await createCar({
      ...data,
      videoUrl: data.videoUrl || null,
    } as CarInput);
    revalidateCars(car.slug);
    await auditFromSession({ action: "create", resource: "car", resourceId: car.id, details: { name: car.name } });
    return NextResponse.json(car);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Admin cars POST error:", err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

// PATCH — full update OR flag toggle
const patchSchema = z.object({
  id: z.string().min(1),
  data: carSchema.partial().optional(),
  flags: z
    .object({
      isActive: z.boolean().optional(),
      isBestSeller: z.boolean().optional(),
      navFeatured: z.boolean().optional(),
      navNew: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { id, data, flags } = patchSchema.parse(body);

    if (flags && !data) {
      await setCarFlags(id, flags);
      await revalidateCarsByNotionId(id);
      await auditFromSession({ action: "update", resource: "car", resourceId: id, details: { flags } });
      return NextResponse.json({ success: true });
    }

    if (data) {
      const payload: Partial<CarInput> = {
        ...data,
        ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl || null } : {}),
      };
      const car = await updateCar(id, payload);
      revalidateCars(car.slug);
      await auditFromSession({ action: "update", resource: "car", resourceId: id, details: { name: car.name } });
      return NextResponse.json(car);
    }

    return NextResponse.json({ error: "No data or flags provided" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Admin cars PATCH error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE — archive (soft delete via Is Active=false)
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await archiveCar(id);
    await revalidateCarsByNotionId(id);
    await auditFromSession({ action: "delete", resource: "car", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin cars DELETE error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// PUT — bulk update sort order after drag-and-drop
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { items } = z.object({
      items: z.array(z.object({ id: z.string(), sortOrder: z.number() })),
    }).parse(await req.json());
    await bulkSetCarSortOrder(items);
    revalidatePath("/cars");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Admin cars PUT error:", err);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}
