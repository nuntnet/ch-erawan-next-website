import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import {
  getChannels,
  getTopSources,
  getExitPages,
  getTopVehicles,
  getDeviceBreakdown,
  getLeadCounts,
  getFunnels,
} from "@/lib/ga4";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 30);
  const configured = Boolean(process.env.GA4_PROPERTY_ID);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      channels: [],
      topSources: [],
      exitPages: [],
      topVehicles: [],
      deviceBreakdown: [],
      leadCounts: { form: 0, line: 0, call: 0 },
      funnels: [],
    });
  }

  const [channels, topSources, exitPages, topVehicles, deviceBreakdown, leadCounts, funnels] = await Promise.all([
    getChannels(days),
    getTopSources(days),
    getExitPages(days),
    getTopVehicles(days),
    getDeviceBreakdown(days),
    getLeadCounts(days),
    getFunnels(days),
  ]);

  return NextResponse.json({ configured: true, channels, topSources, exitPages, topVehicles, deviceBreakdown, leadCounts, funnels });
}
