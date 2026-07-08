import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "รางวัลและความสำเร็จ",
  description: "รางวัลและความสำเร็จของ ช.เอราวัณ กรุ๊ป",
  path: "/awards",
});

export default function AwardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
