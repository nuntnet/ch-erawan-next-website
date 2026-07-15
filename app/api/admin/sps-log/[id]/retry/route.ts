import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSpsLogById, logSpsCall } from "@/lib/sps-log";

const SPS_ENDPOINT = process.env.SPS_BASE_URL
  ? `${process.env.SPS_BASE_URL}/servicebooking_form.php`
  : "https://system.ch-erawan.com/sps/servicebooking_form.php";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Re-sends a previously-failed booking's exact stored payload to SPS. */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const log = await getSpsLogById(Number(id));
  if (!log) {
    return NextResponse.json({ error: "ไม่พบ log นี้" }, { status: 404 });
  }
  if (log.success) {
    return NextResponse.json({ error: "รายการนี้ส่งสำเร็จแล้ว ไม่ต้องส่งซ้ำ" }, { status: 400 });
  }
  if (!log.requestPayload) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะส่งซ้ำ" }, { status: 400 });
  }

  let payloadObj: Record<string, string>;
  try {
    payloadObj = JSON.parse(log.requestPayload);
  } catch {
    return NextResponse.json({ error: "ข้อมูล payload เสียหาย" }, { status: 500 });
  }

  const spsParams = new URLSearchParams(payloadObj);
  // The stored payload has api_key redacted — restore the real one for the retry.
  if (process.env.SPS_API_KEY) {
    spsParams.set("api_key", process.env.SPS_API_KEY);
  }

  let spsSuccess = false;
  let spsStatus: number | undefined;
  let spsResponseBody: string | undefined;
  let spsErrorMessage: string | undefined;
  try {
    const spsRes = await fetch(SPS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: spsParams.toString(),
    });
    spsStatus = spsRes.status;
    const html = await spsRes.text();
    spsResponseBody = html;
    spsSuccess = html.includes("ขอขอบคุณสำหรับการนัดหมาย");
  } catch (err) {
    spsErrorMessage = err instanceof Error ? err.message : String(err);
  }

  const loggedPayload = { ...payloadObj };
  if (loggedPayload.api_key) loggedPayload.api_key = "[redacted]";

  await logSpsCall({
    branch: log.branch,
    branchId: log.branchId ?? undefined,
    customerName: log.customerName ?? undefined,
    customerPhone: log.customerPhone ?? undefined,
    preferredDate: log.preferredDate ?? undefined,
    preferredTime: log.preferredTime ?? undefined,
    requestPayload: loggedPayload,
    responseStatus: spsStatus,
    responseBody: spsResponseBody,
    success: spsSuccess,
    errorMessage: spsErrorMessage,
    notionPageId: log.notionPageId ?? undefined,
  });

  // Note: the appointment's Status is a staff-confirmation workflow field,
  // not a reflection of SPS API success — it stays whatever staff already
  // set it to in /admin/appointments. This retry only affects whether SPS
  // itself has the booking; it does not touch the Notion appointment.

  return NextResponse.json({
    success: spsSuccess,
    message: spsSuccess
      ? "ส่งซ้ำสำเร็จ — SPS รับข้อมูลแล้ว"
      : "ส่งซ้ำไม่สำเร็จ — SPS ยังไม่รับข้อมูล",
  });
}
