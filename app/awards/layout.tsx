import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "รางวัลและความสำเร็จ",
  description: "รางวัลดีลเลอร์ดีเด่นและความสำเร็จของ ช.เอราวัณ กรุ๊ป ตัวแทนจำหน่ายรถยนต์ในนครปฐมและกรุงเทพฯ จากผู้ผลิตและผลการประเมินลูกค้า",
  path: "/awards",
});

export default function AwardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
