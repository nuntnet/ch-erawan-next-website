import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import { getLatestSpsLogsByNotionPageIds } from "@/lib/sps-log";

// GET /api/admin/appointments/sps-status?ids=a,b,c
// Returns the latest SPS call outcome per appointment (Notion page) id, for
// the failed-delivery badge + retry shortcut on /admin/appointments.
export async function GET(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  const idsParam = req.nextUrl.searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : [];
  const latest = await getLatestSpsLogsByNotionPageIds(ids);

  const result = Object.fromEntries(
    Object.entries(latest).map(([id, log]) => [
      id,
      { id: log.id, success: log.success, createdAt: log.createdAt },
    ])
  );
  return NextResponse.json(result);
}
