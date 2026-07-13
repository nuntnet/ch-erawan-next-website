import Link from "next/link";
import { notFound } from "next/navigation";
import BrandCarGrid from "@/components/BrandCarGrid";
import BrandHero, { BrandHeroSubLineLinks } from "@/components/BrandHero";
import { BRAND_BY_SLUG, isBrandSlug, type BrandSlug } from "@/lib/brandConfig";
import { getCarsByBrandLine } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { ArrowRight } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ brand: string; line: string }>;
}

export async function generateStaticParams() {
  return Object.values(BRAND_BY_SLUG)
    .filter((b) => b.slug !== "gwm" && b.subLines?.length)
    .flatMap((b) => b.subLines!.map((line) => ({ brand: b.slug, line: line.slug })));
}

function resolve(brandSlug: string, lineSlug: string) {
  if (!isBrandSlug(brandSlug)) return null;
  const brand = BRAND_BY_SLUG[brandSlug as BrandSlug];
  const line = brand.subLines?.find((l) => l.slug === lineSlug);
  if (!line) return null;
  return { brand, line };
}

export async function generateMetadata({ params }: PageProps) {
  const { brand: brandSlug, line: lineSlug } = await params;
  const resolved = resolve(brandSlug, lineSlug);
  if (!resolved) return {};
  const { brand, line } = resolved;
  return pageMetadata({
    title: `${line.displayName} — ${brand.displayName} รถยนต์`,
    description: `รุ่นรถ ${line.displayName} จาก ${brand.displayName} ที่ ช.เอราวัณ กรุ๊ป — ${brand.descriptionTh}`,
    path: `${brand.hubPath}/${lineSlug}`,
    openGraphImage: line.logoPath,
  });
}

export default async function BrandLinePage({ params }: PageProps) {
  const { brand: brandSlug, line: lineSlug } = await params;
  const resolved = resolve(brandSlug, lineSlug);
  if (!resolved) notFound();
  const { brand, line } = resolved;
  const cars = await getCarsByBrandLine(brand.notionBrand, lineSlug);

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: brand.displayName, path: brand.hubPath },
    { name: line.displayName, path: `${brand.hubPath}/${lineSlug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)),
        }}
      />
      <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
        <BrandHero
          brand={{
            ...brand,
            displayName: line.displayName,
            displayNameTh: line.displayNameTh,
            tagline: line.displayName,
            descriptionTh: `รุ่นรถ ${line.displayName} จาก ${brand.displayName} ที่ ช.เอราวัณ กรุ๊ป พร้อมทดลองขับและบริการหลังการขายครบวงจร`,
            logoPath: line.logoPath,
          }}
          breadcrumbs={breadcrumbs}
          bgImage={brand.navBgImage}
          primaryCta={{ label: "นัดทดลองขับ", href: `/booking?type=test_drive&brand=${brand.notionBrand}` }}
          secondaryCta={{ label: `ดู ${brand.displayName} ทั้งหมด`, href: brand.hubPath }}
          secondaryLogo={{ src: brand.logoPath, alt: brand.displayName, label: "by" }}
          footer={<BrandHeroSubLineLinks brand={brand} activeSlug={lineSlug} />}
        />

        <div className="container py-10 lg:py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-[#0F172A]">
                รุ่นรถ {line.displayName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">พบ {cars.length} รุ่น</p>
            </div>
            <Link
              href={brand.hubPath}
              className="hidden sm:inline-flex items-center text-sm font-medium text-[#0F172A] hover:text-[#DD5259] transition-colors"
            >
              กลับหน้า {brand.displayName}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <BrandCarGrid
            cars={cars}
            emptyMessage={`ยังไม่มีรุ่น ${line.displayName} ในระบบ — ติดต่อเราเพื่อสอบถามรุ่นที่พร้อมจำหน่าย`}
          />
        </div>
      </div>
    </>
  );
}
