import { NextRequest, NextResponse } from "next/server";
import { legacyBrandQueryToPath } from "@/lib/brandConfig";
import { checkAuthRateLimit } from "@/lib/ratelimit";

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

const STAFF_ROLES = new Set(["admin", "editor"]);

// User management + audit log stay admin-only — everything else under
// /admin and /api/admin is open to any staff role (admin or editor).
const ADMIN_ONLY_PREFIXES = ["/admin/users", "/admin/audit", "/api/admin/users", "/api/admin/audit"];

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
}

async function fetchStaffSession(req: NextRequest) {
  const sessionRes = await fetch(`${req.nextUrl.origin}/api/auth/get-session`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  }).catch(() => null);

  if (!sessionRes?.ok) return null;
  const session = await sessionRes.json().catch(() => null);
  return session?.user ? session : null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy /cars?brand=Mazda → /mazda (strip query; next.config redirects preserve it)
  if (pathname === "/cars") {
    const brand = req.nextUrl.searchParams.get("brand");
    if (brand) {
      const dest = legacyBrandQueryToPath(brand);
      if (dest) {
        return NextResponse.redirect(new URL(dest, req.url), 301);
      }
    }
  }

  // ── Rate limit auth endpoints (sign-in / sign-up / password reset request) ──
  if (pathname.startsWith("/api/auth")) {
    if (
      req.method === "POST" &&
      (pathname.includes("sign-in") || pathname.includes("sign-up") || pathname.includes("request-password-reset"))
    ) {
      const { success } = await checkAuthRateLimit(getClientIp(req));
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }
    return NextResponse.next();
  }

  // ── Protect /api/admin/* (defense-in-depth; handlers also call requireStaff/requireAdmin) ─
  if (pathname.startsWith("/api/admin")) {
    const sessionCookie =
      req.cookies.get("better-auth.session_token") ??
      req.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await fetchStaffSession(req);
    const requiredRoles = isAdminOnlyPath(pathname) ? new Set(["admin"]) : STAFF_ROLES;
    if (!session || !requiredRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ── Protect /admin UI routes ───────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const sessionCookie =
      req.cookies.get("better-auth.session_token") ??
      req.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await fetchStaffSession(req);
    if (!session) {
      return NextResponse.redirect(new URL("/login?error=session_expired", req.url));
    }
    if (!STAFF_ROLES.has(session.user.role)) {
      return NextResponse.redirect(new URL("/login?error=no_access", req.url));
    }

    // Authenticated staff, but this specific admin-only section (user
    // management / audit log) requires the "admin" role — bounce to the
    // dashboard rather than /login (they ARE logged in, just not permitted here).
    if (isAdminOnlyPath(pathname) && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cars", "/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"],
};
