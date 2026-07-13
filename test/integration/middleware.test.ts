import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  checkAuthRateLimit: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkAuthRateLimit: mocks.checkAuthRateLimit,
}));

import { middleware } from "@/middleware";

function adminSession() {
  return { user: { id: "u1", role: "admin", email: "admin@test.com" } };
}

function makeMwRequest(
  pathname: string,
  init?: { method?: string; cookies?: Record<string, string>; headers?: Record<string, string> }
) {
  const url = new URL(pathname, "http://localhost:3000");
  const headers = new Headers(init?.headers);
  if (init?.cookies) {
    headers.set(
      "cookie",
      Object.entries(init.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")
    );
  }
  return new NextRequest(url, { method: init?.method ?? "GET", headers });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.checkAuthRateLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 });
  mocks.fetch.mockResolvedValue({
    ok: true,
    json: async () => adminSession(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("middleware — /admin UI", () => {
  it("redirects unauthenticated users to /login with callbackUrl", async () => {
    const res = await middleware(makeMwRequest("/admin/cars"));
    expect(res.status).toBe(307);
    const loc = res.headers.get("location")!;
    expect(loc).toContain("/login");
    expect(loc).toContain("callbackUrl=%2Fadmin%2Fcars");
  });

  it("redirects sessions with no staff role to /login?error=no_access", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: "u1", role: "user" } }),
    });
    const res = await middleware(
      makeMwRequest("/admin", {
        cookies: { "better-auth.session_token": "tok" },
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=no_access");
  });

  it("redirects an invalid/expired session to /login?error=session_expired", async () => {
    mocks.fetch.mockResolvedValue({ ok: false });
    const res = await middleware(
      makeMwRequest("/admin", {
        cookies: { "better-auth.session_token": "tok" },
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=session_expired");
  });

  it("allows editor sessions into general /admin pages (no redirect)", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: "u1", role: "editor" } }),
    });
    const res = await middleware(
      makeMwRequest("/admin/cars", {
        cookies: { "better-auth.session_token": "tok" },
      })
    );
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("bounces editor sessions away from /admin/users to /admin", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: "u1", role: "editor" } }),
    });
    const res = await middleware(
      makeMwRequest("/admin/users", {
        cookies: { "better-auth.session_token": "tok" },
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin");
    expect(res.headers.get("location")).not.toContain("/login");
  });

  it("allows admin sessions through (no redirect)", async () => {
    const res = await middleware(
      makeMwRequest("/admin", {
        cookies: { "better-auth.session_token": "tok" },
      })
    );
    // NextResponse.next() has status 200 with x-middleware-next header
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("middleware — /api/admin", () => {
  it("returns 401 without session cookie", async () => {
    const res = await middleware(makeMwRequest("/api/admin/cars"));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when session is not admin", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { role: "user" } }),
    });
    const res = await middleware(
      makeMwRequest("/api/admin/cars", {
        cookies: { "better-auth.session_token": "tok" },
      })
    );
    expect(res.status).toBe(403);
  });

  it("passes through for admin API requests", async () => {
    const res = await middleware(
      makeMwRequest("/api/admin/cars", {
        cookies: { "better-auth.session_token": "tok" },
      })
    );
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("middleware — /api/auth rate limit", () => {
  it("returns 429 when rate limit is exceeded on sign-in", async () => {
    mocks.checkAuthRateLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 999,
    });
    const res = await middleware(
      makeMwRequest("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      })
    );
    expect(res.status).toBe(429);
    expect(mocks.checkAuthRateLimit).toHaveBeenCalledWith("1.2.3.4");
  });

  it("passes through auth GET requests without rate limiting", async () => {
    const res = await middleware(makeMwRequest("/api/auth/get-session"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(mocks.checkAuthRateLimit).not.toHaveBeenCalled();
  });
});

describe("middleware — public routes", () => {
  it("does not intercept non-matched paths", async () => {
    const res = await middleware(makeMwRequest("/cars"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
