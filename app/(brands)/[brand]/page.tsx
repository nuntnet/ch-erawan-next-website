import Link from "next/link";
import { notFound } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import BrandCarGrid from "@/components/BrandCarGrid";
import BrandHero, { BrandHeroSubLineLinks } from "@/components/BrandHero";
import BrandSubNav from "@/components/brands/BrandSubNav";
import {
  BRANDS,
  BRAND_BY_SLUG,
  BRAND_SLUGS,
  isBrandSlug,
  type BrandSlug,
} from "@/lib/brandConfig";
import { getCarsByBrandLine, getSocialLinksByBrand } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { ArrowRight } from "lucide-react";
import BrandSocialLinks from "@/components/BrandSocialLinks";
import { GeelyModelCards, GeelyShowroomAndFaq } from "@/components/brands/GeelyHubSections";
import { GEELY_MODELS, geelyFaq } from "@/lib/geelyModels";
import { faqPageJsonLd } from "@/lib/seo/faq";
import { getBrandFaq } from "@/lib/brandFaq";
import BrandFaqSection from "@/components/brands/BrandFaqSection";
import { canonicalUrl } from "@/lib/site";
import Ga4PageSignals from "@/components/Ga4PageSignals";

// All brands now have sub-pages via generic [brand]/service, [brand]/body-repair etc.
const HAS_SUB_PAGES = new Set<BrandSlug>(["gwm", "mazda", "ford", "mitsubishi", "deepal", "kia", "gac", "lepas"]);

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ brand: string }>;
}

export async function generateStaticParams() {
  return BRAND_SLUGS.map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: PageProps) {
  const { brand: slug } = await params;
  if (!isBrandSlug(slug)) return {};
  const brand = BRAND_BY_SLUG[slug];
  return {
    ...pageMetadata({
    title: `${brand.displayName} ${brand.locationTh ?? "นครปฐม"} ราคาและโปรโมชั่น 2569 | ช.เอราวัณ`,
    description: `${brand.displayNameTh} ${brand.locationTh ?? "นครปฐม"} — ตัวแทนจำหน่ายอย่างเป็นทางการ ราคาดีที่สุด ผ่อนสบาย ทดลองขับฟรี บริการหลังการขายครบวงจร. ${brand.descriptionTh}`,
    path: brand.hubPath,
    openGraphImage: brand.logoPath,
  }),
    ...(brand.alsoKnownAs?.length ? { keywords: Array.from(new Set([brand.displayName, brand.displayNameTh, ...brand.alsoKnownAs])) } : {}),
  };
}

export default async function BrandHubPage({ params }: PageProps) {
  const { brand: slug } = await params;
  if (!isBrandSlug(slug)) notFound();

  const brand = BRAND_BY_SLUG[slug as BrandSlug];
  const [cars, socialLinks] = await Promise.all([
    getCarsByBrandLine(brand.notionBrand),
    getSocialLinksByBrand(brand.notionBrand),
  ]);

  // Geely: until the models exist in Notion, show the static model list + showroom info + FAQ.
  const isGeely = brand.slug === "geely";
  const brandFaq = isGeely ? [] : getBrandFaq(brand.slug);
  const useStaticGeelyModels = isGeely && cars.length === 0;
  const modelCount = useStaticGeelyModels ? GEELY_MODELS.length : cars.length;

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: brand.displayNameTh, path: brand.hubPath },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Brand",
            name: brand.displayName,
            ...(brand.alsoKnownAs?.length ? { alternateName: brand.alsoKnownAs } : {}),
            url: canonicalUrl(brand.hubPath),
            ...(Object.values(brand.social ?? {}).filter(Boolean).length
              ? { sameAs: Object.entries(brand.social ?? {}).filter(([k, v]) => v && k !== "line").map(([, v]) => v) }
              : {}),
          }),
        }}
      />
      {(isGeely || brandFaq.length > 0) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(isGeely ? geelyFaq() : brandFaq)) }}
        />
      )}
      <Ga4PageSignals pageType="brand_hub" />
      <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
        <BrandHero
          brand={brand}
          breadcrumbs={breadcrumbs}
          socialLinks={socialLinks}
          footer={
            brand.subLines?.length ? (
              <BrandHeroSubLineLinks brand={brand} />
            ) : undefined
          }
        />

        {HAS_SUB_PAGES.has(brand.slug) && (
          <BrandSubNav brand={brand} currentSection="overview" />
        )}

        <div className="container py-10 lg:py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-[#0F172A]">
                รุ่นรถ {brand.displayNameTh}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                พบ {modelCount} รุ่น
              </p>
            </div>
            <Link
              href="/cars"
              className="hidden sm:inline-flex items-center text-sm font-medium text-[#0F172A] hover:text-[#DD5259] transition-colors"
            >
              ดูรถทั้งหมด
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {useStaticGeelyModels ? (
            <GeelyModelCards />
          ) : (
            <BrandCarGrid
              cars={cars}
              emptyMessage={
                brand.comingSoonLabel
                  ? `รุ่นรถ ${brand.displayNameTh} เร็วๆ นี้ — ${brand.comingSoonLabel}`
                  : undefined
              }
            />
          )}

          {isGeely && <GeelyShowroomAndFaq />}
          {brandFaq.length > 0 && <BrandFaqSection items={brandFaq} id={`${brand.slug}-faq`} />}

          {/* Social links — Notion CMS overrides brandConfig; same five slots for every brand */}
          <div className="mt-10 flex items-center justify-between bg-gray-50 rounded-2xl px-6 py-4 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">ติดตาม {brand.displayNameTh}</p>
              <p className="text-xs text-gray-400 mt-0.5">ข่าวสาร โปรโมชั่น และคอนเทนต์ล่าสุด</p>
            </div>
            <BrandSocialLinks links={socialLinks} brand={brand} variant="light" />
          </div>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <p className="w-full text-center text-sm text-gray-400 mb-2">
              แบรนด์อื่นๆ
            </p>
            {BRANDS.filter((b) => b.slug !== brand.slug).map((other) => (
              <Link
                key={other.slug}
                href={other.hubPath}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 min-w-[44px] min-h-[44px] hover:border-[#DD5259]/30 hover:shadow-md transition-all"
              >
                <BrandLogo
                  src={other.logoPath}
                  alt={other.displayName}
                  brandSlug={other.slug}
                  size="md"
                  width={72}
                  height={28}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
