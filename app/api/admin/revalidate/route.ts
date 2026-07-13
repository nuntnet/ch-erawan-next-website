import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/admin-auth";

// POST /api/admin/revalidate — admin-triggered ISR refresh (session-guarded,
// no shared secret needed since requireAdmin validates the admin session).
const schema = z.object({
  type: z.enum(["all", "cars", "blog", "stories"]).optional(),
});

export async function POST(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({}));
    const { type = "all" } = schema.parse(body);

    if (type === "cars") {
      revalidatePath("/cars");
      revalidatePath("/");
    } else if (type === "blog") {
      revalidatePath("/blog");
      revalidatePath("/");
    } else if (type === "stories") {
      revalidatePath("/stories");
      revalidatePath("/");
    } else {
      // Refresh the whole site (all pages under the root layout)
      revalidatePath("/", "layout");
    }

    return NextResponse.json({ revalidated: true, type, at: new Date().toISOString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Admin revalidate error:", err);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
