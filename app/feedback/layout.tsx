import type { Metadata } from "next";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "ศูนย์ร้องเรียนทันใจ แนะนำ-ติชม",
  description:
    "แจ้งข้อเสนอแนะ คำชม หรือข้อร้องเรียนถึง ช.เอราวัณ กรุ๊ป เราพร้อมรับฟังและปรับปรุงบริการให้ดียิ่งขึ้น",
  path: "/feedback",
});

const crumbs = breadcrumbJsonLd([
  { name: "หน้าแรก", path: "/" },
  { name: "ศูนย์ร้องเรียนทันใจ", path: "/feedback" },
]);

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      {children}
    </>
  );
}
