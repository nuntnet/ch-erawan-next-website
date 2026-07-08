import type { Metadata } from "next";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/site";
import { contactPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "ติดต่อเรา",
  description: "ติดต่อ ช.เอราวัณ กรุ๊ป 7 สาขาในนครปฐมและปริมณฑล",
  path: "/contact",
});

const crumbs = breadcrumbJsonLd([
  { name: "หน้าแรก", path: "/" },
  { name: "ติดต่อเรา", path: "/contact" },
]);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd()) }} />
      {children}
    </>
  );
}
