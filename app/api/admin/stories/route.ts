import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAllStories, updateStoryStatus } from "@/lib/notion";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/admin/stories — list all stories (admin view, all statuses)
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const status = req.nextUrl.searchParams.get("status") as "pending" | "approved" | "rejected" | null;
    const stories = await getAllStories(status ?? undefined);
    return NextResponse.json(stories);
  } catch (err) {
    console.error("Admin stories GET error:", err);
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}

// PATCH /api/admin/stories — moderate (approve/reject)
const patchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { id, action } = patchSchema.parse(body);
    const status = action === "approve" ? "approved" : "rejected";
    await updateStoryStatus(id, status, action === "approve");
    // Approved stories appear on /stories (and the home page) — refresh their ISR cache.
    revalidatePath("/stories");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Admin stories PATCH error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
