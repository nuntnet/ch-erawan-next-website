import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Client } from "@notionhq/client";
import { sendAppointmentNotification, resolveBrandFromBranch } from "@/lib/email";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const SPS_ENDPOINT = process.env.SPS_BASE_URL
  ? `${process.env.SPS_BASE_URL}/servicebooking_form.php`
  : "https://system.ch-erawan.com/sps/servicebooking_form.php";

// Branch name → SPS branch_id mapping
const BRANCH_SPS_ID: Record<string, string> = {
  "มาสด้า ช.เอราวัณ นครปฐม": "1",
  "มาสด้า ช.เอราวัณ ศาลายา": "2",
  "ฟอร์ด ช.เอราวัณ อ้อมใหญ่": "3",
  "ฟอร์ด ช.เอราวัณ นครปฐม": "3",
  "มิตซูบิชิ ช.เอราวัณ นครปฐม": "4",
  "GWM ช.เอราวัณ นครปฐม": "7",
  "Deepal ช.เอราวัณ ศาลายา": "8",
  "Kia ช.เอราวัณ นครปฐม": "9",
};

const schema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  carModel: z.string().optional(),
  branch: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTime: z.string().min(1),
  notes: z.string().optional(),
  vehicleRegistration: z.string().optional(),
  serviceType: z.string().optional(),
  mileage: z.string().optional(),
  repairDetails: z.string().optional(),
});

function toSpsDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function isSunday(isoDate: string): boolean {
  return new Date(isoDate).getDay() === 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (isSunday(data.preferredDate)) {
      return NextResponse.json(
        { error: "ไม่สามารถจองวันอาทิตย์ได้ ศูนย์บริการปิดทำการ" },
        { status: 400 }
      );
    }

    const branchId = BRANCH_SPS_ID[data.branch];
    if (!branchId) {
      return NextResponse.json(
        { error: "สาขาที่เลือกไม่รองรับการจองผ่านระบบนี้" },
        { status: 400 }
      );
    }

    // Build SPS form data
    const spsParams = new URLSearchParams();
    if (process.env.SPS_API_KEY) {
      spsParams.set("api_key", process.env.SPS_API_KEY);
    }
    spsParams.set("branch_id", branchId);
    spsParams.set("svb_date", toSpsDate(data.preferredDate));
    spsParams.set("svb_time", data.preferredTime);
    spsParams.set("svb_time2", "");
    spsParams.set("sbth_id", "");
    spsParams.set("svb_iscustomer", "n");
    spsParams.set("vehicle_owner_code", "");
    spsParams.set("svb_tabien", data.vehicleRegistration || "");
    spsParams.set("svb_tabien_id", "");
    spsParams.set("svb_model", data.carModel || "");
    spsParams.set("svb_model_id", "");
    spsParams.set("cus_id", "");
    spsParams.set("svb_customer", data.customerName);
    spsParams.set("svb_customer_id", "");
    spsParams.set("svb_tel", data.customerPhone);
    spsParams.set("svb_tel_id", "");
    spsParams.set("svb_tel2", "");
    spsParams.set("svb_mail", data.customerEmail || "");
    spsParams.set("svb_type", data.serviceType || "ซ่อมทั่วไป");
    spsParams.set("svb_typedetail", data.mileage || "");
    spsParams.set("svb_desc", data.repairDetails || "");
    const remarkParts = ["[นัดหมายจากเว็บไซต์]"];
    if (data.notes) remarkParts.push(data.notes);
    spsParams.set("svb_remark", remarkParts.join(" "));
    spsParams.set("svb_appoint", "1"); // 1 = ลูกค้า (customer-initiated)
    spsParams.set("svb_remind", "1"); // 1 = เตือน
    spsParams.set("Submit", "บันทึก");
    spsParams.set("Submit_right", "");
    spsParams.set("svb_id", "");

    // POST to SPS
    let spsSuccess = false;
    try {
      const spsRes = await fetch(SPS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: spsParams.toString(),
      });
      const html = await spsRes.text();
      spsSuccess = html.includes("ขอขอบคุณสำหรับการนัดหมาย");
      if (!spsSuccess) {
        console.error("[service-booking] SPS did not return success marker");
      }
    } catch (err) {
      console.error("[service-booking] SPS proxy error:", err instanceof Error ? err.message : err);
    }

    // Fold service details into Notes (appointments DB has no dedicated
    // Service Type / Mileage / Repair Details columns).
    const notesText = [
      data.serviceType ? `ประเภทบริการ: ${data.serviceType}` : "",
      data.mileage ? `เลขไมล์: ${data.mileage}` : "",
      data.repairDetails ? `รายละเอียด/อาการ: ${data.repairDetails}` : "",
      data.notes,
    ].filter(Boolean).join("\n");

    // Also save to Notion as backup
    try {
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_APPOINTMENTS_DB_ID! },
        properties: {
          "Customer Name": { title: [{ text: { content: data.customerName } }] },
          Type: { select: { name: "service" } },
          Status: { select: { name: spsSuccess ? "confirmed" : "pending" } },
          "Customer Phone": { phone_number: data.customerPhone },
          ...(data.customerEmail ? { "Customer Email": { email: data.customerEmail } } : {}),
          ...(data.carModel ? { "Car Model": { rich_text: [{ text: { content: data.carModel } }] } } : {}),
          Branch: { rich_text: [{ text: { content: data.branch } }] },
          "Preferred Date": { date: { start: data.preferredDate } },
          "Preferred Time": { rich_text: [{ text: { content: data.preferredTime } }] },
          ...(notesText ? { Notes: { rich_text: [{ text: { content: notesText } }] } } : {}),
          ...(data.vehicleRegistration ? { "Vehicle Registration": { rich_text: [{ text: { content: data.vehicleRegistration } }] } } : {}),
          "Submitted At": { date: { start: new Date().toISOString() } },
        },
      });
    } catch (notionErr) {
      console.error("[service-booking] Notion backup error:", notionErr);
    }

    // Send email notification
    await sendAppointmentNotification({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      type: "service",
      carModel: data.carModel,
      branch: data.branch,
      brandSlug: resolveBrandFromBranch(data.branch),
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      notes: data.notes,
    });
    if (!spsSuccess) {
      return NextResponse.json({
        success: true,
        spsSuccess: false,
        message: "บันทึกข้อมูลเรียบร้อย แต่ระบบ SPS อาจยังไม่ได้รับข้อมูล ทีมงานจะติดต่อกลับเพื่อยืนยัน",
      });
    }

    return NextResponse.json({ success: true, spsSuccess: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[service-booking] Error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
