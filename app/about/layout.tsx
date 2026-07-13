import type { Metadata } from "next";
import { pageMetadata, breadcrumbJsonLd, SITE_URL } from "@/lib/site";
import { organizationNode } from "@/lib/seo";
import { getYearsOfExperience } from "@/lib/company";

export const metadata: Metadata = pageMetadata({
  title: "เกี่ยวกับเรา",
  description: `ประวัติและวิสัยทัศน์ ช.เอราวัณ กรุ๊ป ตัวแทนจำหน่ายรถยนต์ชั้นนำจ.นครปฐม กว่า ${getYearsOfExperience()} ปี`,
  path: "/about",
});

const crumbs = breadcrumbJsonLd([
  { name: "หน้าแรก", path: "/" },
  { name: "เกี่ยวกับเรา", path: "/about" },
]);

// Organization schema — tells Google/AI who we are
const aboutPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    organizationNode(),
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about#webpage`,
      name: "เกี่ยวกับ ช.เอราวัณ กรุ๊ป",
      url: `${SITE_URL}/about`,
      description: `ประวัติกว่า ${getYearsOfExperience()} ปี ตัวแทนจำหน่าย Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas จ.นครปฐม`,
      mainEntity: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }} />
      {children}
    </>
  );
}
