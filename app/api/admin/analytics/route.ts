import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
import { getEventCounts, getTopCars, getTopBrands, getDailyEvents, getRecentEvents } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);

  const [counts, topCars, topBrands, daily, recent] = await Promise.all([
    getEventCounts(days),
    getTopCars(days),
    getTopBrands(days),
    getDailyEvents(Math.min(days, 14)),
    getRecentEvents(20),
  ]);

  return NextResponse.json({ counts, topCars, topBrands, daily, recent });
}
