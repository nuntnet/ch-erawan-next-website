import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { localBusinessGraph } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "สาขาของเรา",
  description: "10 สาขา ช.เอราวัณ กรุ๊ป ในนครปฐมและกรุงเทพฯ — Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas, Geely",
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
