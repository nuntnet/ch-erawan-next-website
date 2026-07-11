import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { logAudit } from "@/lib/audit";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return drizzle(client);
}

async function getCurrentUser() {
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  return session?.user ?? null;
}

// GET — list all users
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  const users = await db.select({
    id: userTable.id,
    name: userTable.name,
    email: userTable.email,
    role: userTable.role,
    banned: userTable.banned,
    createdAt: userTable.createdAt,
  }).from(userTable);
  return NextResponse.json(users);
}

// POST — create/invite user
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!auth) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const currentUser = await getCurrentUser();
  try {
    const { name, email, password, role } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    const created = await auth.api.signUpEmail({
      body: { name: name || email.split("@")[0], email, password },
    });
    // Set role if specified
    if (role && created?.user?.id) {
      const db = getDb();
      if (db) {
        await db.update(userTable).set({ role }).where(eq(userTable.id, created.user.id));
      }
    }
    void logAudit({
      userId: currentUser?.id ?? "system",
      userName: currentUser?.name ?? "system",
      action: "invite",
      resource: "user",
      resourceId: created?.user?.id,
      details: { email, role: role || "user" },
    });
    return NextResponse.json({ success: true, userId: created?.user?.id });
  } catch (err) {
    if (err instanceof APIError) {
      const message = err.body?.message ?? "Failed to create user";
      return NextResponse.json({ error: message }, { status: err.statusCode });
    }
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// PATCH — update role or ban
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const currentUser = await getCurrentUser();
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  try {
    const { id, role, banned, name } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    const updates: Record<string, unknown> = {};
    if (role !== undefined) updates.role = role;
    if (banned !== undefined) updates.banned = banned ? 1 : 0;
    if (name !== undefined) updates.name = name;
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    await db.update(userTable).set(updates).where(eq(userTable.id, id));
    void logAudit({
      userId: currentUser?.id ?? "system",
      userName: currentUser?.name ?? "system",
      action: role !== undefined ? "role_change" : banned !== undefined ? "ban" : "update",
      resource: "user",
      resourceId: id,
      details: updates,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE — remove user
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const currentUser = await getCurrentUser();
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (id === currentUser?.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  try {
    await db.delete(userTable).where(eq(userTable.id, id));
    void logAudit({
      userId: currentUser?.id ?? "system",
      userName: currentUser?.name ?? "system",
      action: "delete",
      resource: "user",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
