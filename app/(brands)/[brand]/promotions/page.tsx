import Link from "next/link";
import { notFound } from "next/navigation";
import BrandHero from "@/components/BrandHero";
import BrandSubNav from "@/components/brands/BrandSubNav";
import PromotionFeedCard from "@/components/PromotionFeedCard";
import {
  BRAND_BY_SLUG,
  BRAND_SLUGS,
  isBrandSlug,
} from "@/lib/brandConfig";
import { getBranchesByBrand } from "@/lib/branchData";
import { getPromotionsByBrand, getSocialLinksByBrand } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Promotion } from "@/lib/notion-types";

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
  return pageMetadata({
    title: `โปรโมชั่น ${brand.displayName} — ช.เอราวัณ กรุ๊ป`,
    description: `โปรโมชั่นและแคมเปญสุดพิเศษจาก ${brand.displayNameTh} ที่ ช.เอราวัณ กรุ๊ป จ.นครปฐม`,
    path: `${brand.hubPath}/promotions`,
  });
}

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return "ไม่ระบุช่วงเวลา";
  const d = new Date(dateStr);
  return `${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function groupByMonth(promotions: Promotion[]): Map<string, Promotion[]> {
  const map = new Map<string, Promotion[]>();
  for (const p of promotions) {
    const key = getMonthKey(p.startDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return map;
}

export default async function BrandPromotionsPage({ params }: PageProps) {
  const { brand: slug } = await params;
  if (!isBrandSlug(slug)) notFound();

  const brand = BRAND_BY_SLUG[slug];
  const brandBranches = getBranchesByBrand(brand.notionBrand);
  const fallbackTel = brandBranches[0]?.phone;

  const [promotions, socialLinks] = await Promise.all([
    getPromotionsByBrand(brand.notionBrand as Promotion["brand"]),
    getSocialLinksByBrand(brand.notionBrand),
  ]);

  const grouped = groupByMonth(promotions);

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: brand.displayNameTh, path: brand.hubPath },
    { name: "โปรโมชั่น", path: `${brand.hubPath}/promotions` },
  ];

  // Resolve LINE OA URL: prefer Notion CMS social links, then brandConfig, then generic fallback
  const lineFromNotion = socialLinks.find((l) => l.platform === "LINE")?.url;
  const lineUrl =
    lineFromNotion ??
    brand.social?.line ??
    `https://line.me/R/ti/p/@${slug}ch.erawan`;

  const accentColor = brand.accentColor ?? "#DD5259";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <div className="min-h-screen bg-[#F8FAFC] pt-[64px]">
        <BrandHero
          brand={brand}
          breadcrumbs={breadcrumbs}
          primaryCta={{
            label: "นัดทดลองขับ",
            href: `/booking?type=test_drive&brand=${brand.notionBrand}`,
          }}
          secondaryCta={{ label: `ดูรถ ${brand.displayName}`, href: brand.hubPath }}
          footer={
            <p className="text-white/75 text-sm">
              โปรโมชั่นและแคมเปญพิเศษจาก {brand.displayNameTh} ประจำเดือน
            </p>
          }
        />

        <BrandSubNav brand={brand} currentSection="promotions" scrollPastHero />

        <section className="container py-12 lg:py-16">
          <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <p
                className="text-sm font-medium uppercase tracking-wider mb-1"
                style={{ color: accentColor }}
              >
                แคมเปญและโปรโมชั่น
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">
                โปรโมชั่น {brand.displayNameTh}
              </h2>
              {promotions.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  {promotions.length} แคมเปญ · {grouped.size} ช่วงเวลา
                </p>
              )}
            </div>

            {promotions.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                  ติดตามโปรโมชั่นได้เร็วๆ นี้
                </h3>
                <p className="text-gray-500 mb-6 text-sm">
                  ยังไม่มีโปรโมชั่นในขณะนี้ — ติดต่อเราเพื่อสอบถามข้อเสนอพิเศษ
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <a href={lineUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-[#06C755] hover:bg-[#05a847] text-white border-0">
                      สอบถามผ่าน LINE
                    </Button>
                  </a>
                  <Link href="/contact">
                    <Button variant="outline">ติดต่อสอบถาม</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(grouped.entries()).map(([monthLabel, items]) => (
                  <div key={monthLabel}>
                    {/* Month divider */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1.5 bg-[#0F172A] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Calendar className="w-3.5 h-3.5" />
                        {monthLabel}
                      </div>
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 shrink-0">{items.length} โปรโมชั่น</span>
                    </div>

                    {/* Feed */}
                    <div className="space-y-4">
                      {items.map((promo) => (
                        <PromotionFeedCard
                          key={promo.id}
                          promo={promo}
                          accentColor={accentColor}
                          fallbackTel={fallbackTel}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA LINE footer */}
        <section className="bg-[#0F172A] py-12">
          <div className="container text-center">
            <h3 className="text-xl font-bold text-white mb-2">ไม่พลาดทุกโปรโมชั่น</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
              ติดตาม LINE Official เพื่อรับข่าวสารโปรโมชั่นใหม่ก่อนใคร
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={lineUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#06C755] hover:bg-[#05a847] text-white border-0">
                  ติดตามผ่าน LINE
                </Button>
              </a>
              <Link href={`/booking?type=test_drive&brand=${brand.notionBrand}`}>
                <Button
                  variant="outline"
                  className="border-white/20 text-white bg-transparent hover:bg-white/10"
                >
                  นัดทดลองขับ
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
