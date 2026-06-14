import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createFeedback } from "@/lib/notion";
import { sendFormNotification } from "@/lib/email";
import type { BrandSlug } from "@/lib/brandConfig";

const schema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  type: z.enum(["ร้องเรียน", "ชมเชย", "เสนอแนะ"]),
  brand: z.string().min(1),
  branch: z.string().min(1),
  department: z.string().min(1),
  phone: z.string().min(9, "กรุณาระบุเบอร์โทรที่ถูกต้อง"),
  email: z.string().email().optional().or(z.literal("")),
  licensePlate: z.string().optional().default(""),
  serviceDate: z.string().optional().default(""),
  message: z.string().min(10, "กรุณาอธิบายรายละเอียดอย่างน้อย 10 ตัวอักษร"),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    await createFeedback({
      ...body,
      email: body.email ?? "",
      licensePlate: body.licensePlate ?? "",
      serviceDate: body.serviceDate ?? "",
    });
    const brandSlug = body.brand.toLowerCase() as BrandSlug;
    void sendFormNotification({
      formType: "feedback",
      name: body.name,
      phone: body.phone,
      email: body.email,
      brandSlug,
      fields: {
        ประเภท: body.type,
        แบรนด์: body.brand,
        สาขา: body.branch,
        แผนก: body.department,
        ข้อความ: body.message.slice(0, 200),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    console.error("Feedback submit error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
