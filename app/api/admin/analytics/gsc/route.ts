import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import { getTopKeywords, getKeywordsByPage, isGscConfigured } from "@/lib/gsc";

export const dynamic = "force-dynamic";

const ALLOWED_DAYS = new Set([7, 30, 90]);

export async function GET(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  const rawDays = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const days = ALLOWED_DAYS.has(rawDays) ? rawDays : 30;

  if (!isGscConfigured()) {
    return NextResponse.json({ configured: false, topKeywords: [], pages: [] });
  }

  const [topKeywords, pages] = await Promise.all([
    getTopKeywords(days),
    getKeywordsByPage(days),
  ]);

  return NextResponse.json({ configured: true, topKeywords, pages });
}
