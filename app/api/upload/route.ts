import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary-upload";
import { requireStaff } from "@/lib/admin-auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const url = await uploadToCloudinary(file, {
      folder: "ch-erawan",
      allowedTypes: ALLOWED,
      maxBytes: MAX_BYTES,
      resourceType: "image",
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status =
      message === "Invalid file type" || message === "File too large" ? 400 : 500;
    if (status === 500) console.error("Upload error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
