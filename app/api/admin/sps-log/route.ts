import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSpsLogs } from "@/lib/sps-log";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const branch = req.nextUrl.searchParams.get("branch") ?? undefined;
  const successParam = req.nextUrl.searchParams.get("success");
  const success = successParam === "true" ? true : successParam === "false" ? false : undefined;
  const logs = await getSpsLogs({ days, branch, success, limit: 200 });
  return NextResponse.json(logs);
}
