/**
 * Extra LINE notification channel (via Bola) for service-center bookings,
 * on top of the existing appointment email. Sends every appointment field
 * so the receiving side (Bola) can map whichever it needs into the LINE
 * message template — currently just "{customer_name} มาเข้าศูนย์".
 */
export interface ServiceCheckinPayload {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  carModel?: string;
  branch?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

export interface ServiceCheckinResult {
  sent: boolean;
  /** Bola's own delivery_log_id, for cross-referencing with their dashboard/support. */
  deliveryLogId?: string;
}

export async function sendServiceCheckinNotification(data: ServiceCheckinPayload): Promise<ServiceCheckinResult> {
  const webhookUrl = process.env.BOLA_SERVICE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[bola] BOLA_SERVICE_WEBHOOK_URL not configured — skipping service check-in notification");
    return { sent: false };
  }

  const payload = {
    customer_name: data.customerName,
    customer_phone: data.customerPhone ?? "",
    customer_email: data.customerEmail ?? "",
    car_model: data.carModel ?? "",
    branch: data.branch ?? "",
    preferred_date: data.preferredDate ?? "",
    preferred_time: data.preferredTime ?? "",
    notes: data.notes ?? "",
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[bola] Webhook failed:", res.status, text);
      return { sent: false };
    }
    // Bola's own tracking id for this delivery — log it so a delivery that
    // never reaches LINE can be looked up on Bola's side, not just ours.
    let deliveryLogId: string | undefined;
    try {
      deliveryLogId = JSON.parse(text)?.delivery_log_id;
    } catch {
      // Non-JSON response — still a successful HTTP call, just nothing to extract.
    }
    console.log("[bola] Webhook accepted:", text);
    return { sent: true, deliveryLogId };
  } catch (err) {
    console.error("[bola] Failed to call service check-in webhook:", err);
    return { sent: false };
  }
}
