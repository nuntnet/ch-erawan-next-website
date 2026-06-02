import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllVideoReviewsAdmin, createVideoReview, updateVideoReview, archiveVideoReview } from "@/lib/notion";
import { revalidatePath } from "next/cache";

const PLATFORMS = ["YouTube", "TikTok"] as const;
const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"] as const;

const SOURCES = ["own", "external"] as const;

const schema = z.object({
  title: z.string().min(1),
  brand: z.enum(BRANDS),
  platform: z.enum(PLATFORMS),
  source: z.enum(SOURCES).default("external"),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().nullable().optional(),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

function revalidateReviews(brand: string) {
  const slugMap: Record<string, string> = {
    Mazda: "mazda", Ford: "ford", Mitsubishi: "mitsubishi",
    GWM: "gwm", Deepal: "deepal", Kia: "kia",
  };
  const slug = slugMap[brand];
  if (slug) revalidatePath(`/${slug}/reviews`);
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getAllVideoReviewsAdmin());
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
    const item = await createVideoReview({
      ...data,
      thumbnailUrl: data.thumbnailUrl ?? null,
      description: data.description ?? "",
    });
    revalidateReviews(data.brand);
    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id, ...data } = z.object({ id: z.string().min(1) }).merge(schema.partial()).parse(await req.json());
    await updateVideoReview(id, data);
    if (data.brand) revalidateReviews(data.brand);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await archiveVideoReview(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
