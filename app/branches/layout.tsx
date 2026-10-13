import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { localBusinessGraph } from "@/lib/seo";
import { BRANDS } from "@/lib/brandConfig";
import { branches } from "@/lib/branchData";

export const metadata: Metadata = pageMetadata({
  title: "10 สาขา นครปฐมและกรุงเทพฯ — ที่ตั้ง เบอร์โทร แผนที่",
  description: `ที่ตั้ง เบอร์โทร และแผนที่ ${branches.length} สาขา ช.เอราวัณ กรุ๊ป ในนครปฐม สามพราน และรัชดา กรุงเทพฯ — ${BRANDS.map((b) => b.displayName).join(", ")}`,
  path: "/branches",
});

export default function BranchesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessGraph()) }}
      />
      {children}
    </>
  );
}
