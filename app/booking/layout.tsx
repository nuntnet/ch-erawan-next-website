import type { Metadata } from "next";
import { pageMetadata, breadcrumbJsonLd, SITE_URL } from "@/lib/site";
import { howToJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "จองนัดหมาย",
  description: "จองนัดหมายทดลองขับ บริการศูนย์ แจ้งซ่อมตัวถัง/สี และขอใบเสนอราคาประกันออนไลน์",
  path: "/booking",
});

const crumbs = breadcrumbJsonLd([
  { name: "หน้าแรก", path: "/" },
  { name: "จองนัดหมาย", path: "/booking" },
]);

const howTo = howToJsonLd({
  name: "วิธีนัดหมายทดลองขับรถยนต์ ช.เอราวัณ",
  description: "ขั้นตอนการนัดหมายทดลองขับรถยนต์ออนไลน์ที่ ช.เอราวัณ กรุ๊ป จ.นครปฐม",
  totalTime: "PT10M",
  steps: [
    { name: "เลือกประเภทการนัดหมาย", text: "เลือกทดลองขับ นัดบริการ หรือแจ้งซ่อมตัวถัง", url: `${SITE_URL}/booking` },
    { name: "เลือกแบรนด์และรุ่นรถ", text: "ระบุแบรนด์รถยนต์และรุ่นที่ต้องการ", url: `${SITE_URL}/booking` },
    { name: "เลือกสาขาและวันเวลา", text: "เลือกสาขาที่สะดวก และวันเวลาที่ต้องการ", url: `${SITE_URL}/booking` },
    { name: "กรอกข้อมูลติดต่อ", text: "กรอกชื่อ-นามสกุล เบอร์โทรศัพท์ เพื่อให้เจ้าหน้าที่ยืนยัน", url: `${SITE_URL}/booking` },
    { name: "รอการยืนยัน", text: "เจ้าหน้าที่จะโทรยืนยันนัดหมายภายใน 24 ชั่วโมง", url: `${SITE_URL}/booking` },
  ],
});

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      {children}
    </>
  );
}
