import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import { getAllContacts } from "@/lib/notion";

// GET /api/admin/contacts — list all contact submissions (read-only)
export async function GET() {
  const denied = await requireStaff();
  if (denied) return denied;
  try {
    const contacts = await getAllContacts();
    return NextResponse.json(contacts);
  } catch (err) {
    console.error("Admin contacts GET error:", err);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
