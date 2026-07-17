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

export async function sendServiceCheckinNotification(data: ServiceCheckinPayload): Promise<{ sent: boolean }> {
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
    if (!res.ok) {
      console.error("[bola] Webhook failed:", res.status, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[bola] Failed to call service check-in webhook:", err);
    return { sent: false };
  }
}
