import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "ร่วมงานกับเรา",
  description: "ตำแหน่งงานที่เปิดรับและสวัสดิการของ ช.เอราวัณ กรุ๊ป ดีลเลอร์รถยนต์ 9 แบรนด์ 10 สาขา ในนครปฐมและกรุงเทพฯ สมัครงานได้ที่นี่",
  path: "/career",
});

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
