import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "./auth";

async function requireRole(allowedRoles: string[]): Promise<NextResponse | null> {
  if (!auth) {
    // Turso not configured — auth disabled. Fail closed.
    return NextResponse.json(
      { error: "Authentication not configured" },
      { status: 503 }
    );
  }

  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

/**
 * Server-side admin-only guard — for routes only the "admin" role may use
 * (user management, audit log).
 *
 * Returns `null` when the caller is an authenticated admin (proceed),
 * or a `NextResponse` (401/403/503) to return early when not.
 *
 * Usage:
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  return requireRole(["admin"]);
}

/**
 * Server-side staff guard — for general content routes any staff member
 * ("admin" or "editor") may use. Use {@link requireAdmin} instead for
 * routes that must stay admin-only (user management, audit log).
 *
 * Usage:
 *   const denied = await requireStaff();
 *   if (denied) return denied;
 */
export async function requireStaff(): Promise<NextResponse | null> {
  return requireRole(["admin", "editor"]);
}
