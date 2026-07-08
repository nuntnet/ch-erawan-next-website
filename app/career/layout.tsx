import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "ร่วมงานกับเรา",
  description: "โอกาสในการร่วมงานกับ ช.เอราวัณ กรุ๊ป",
  path: "/career",
});

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
