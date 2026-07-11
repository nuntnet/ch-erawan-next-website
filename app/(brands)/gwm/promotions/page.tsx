import Image from "next/image";
import { cldUrl } from "@/lib/cloudinary";
import Link from "next/link";
import BrandHero from "@/components/BrandHero";
import BrandSubNav from "@/components/brands/BrandSubNav";
import { BRAND_BY_SLUG } from "@/lib/brandConfig";
import { getPromotionsByBrand } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { ExternalLink, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Promotion } from "@/lib/notion-types";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "โปรโมชั่น GWM — ช.เอราวัณ กรุ๊ป",
  description: "โปรโมชั่นและแคมเปญสุดพิเศษจาก GWM ที่ ช.เอราวัณ กรุ๊ป จ.นครปฐม",
  path: "/gwm/promotions",
});

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

function isExpiringSoon(endDate: string | null): boolean {
  if (!endDate) return false;
  const diff = new Date(endDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // within 7 days
}

function isNew(startDate: string | null): boolean {
  if (!startDate) return false;
  const diff = Date.now() - new Date(startDate).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // within 7 days
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (startDate) return `เริ่ม ${fmt(startDate)}`;
  if (endDate) return `ถึง ${fmt(endDate)}`;
  return "";
}

export default async function GwmPromotionsPage() {
  const brand = BRAND_BY_SLUG.gwm;
  const promotions = await getPromotionsByBrand("GWM");
  const grouped = groupByMonth(promotions);

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: "GWM", path: "/gwm" },
    { name: "โปรโมชั่น", path: "/gwm/promotions" },
  ];

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
          primaryCta={{ label: "นัดทดลองขับ", href: "/booking?type=test_drive&brand=GWM" }}
          secondaryCta={{ label: "ดูรถ GWM", href: "/gwm" }}
          footer={
            <p className="text-white/75 text-sm">
              โปรโมชั่นและแคมเปญพิเศษจาก GWM ประจำเดือน
            </p>
          }
        />

        <BrandSubNav brand={brand} currentSection="promotions" scrollPastHero />

        <section className="container py-12 lg:py-16">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-1">
                แคมเปญและโปรโมชั่น
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">โปรโมชั่น GWM</h2>
            </div>
            {promotions.length > 0 && (
              <p className="text-sm text-gray-400 pb-1">
                {promotions.length} แคมเปญ · {grouped.size} ช่วงเวลา
              </p>
            )}
          </div>

          {promotions.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">ติดตามโปรโมชั่นได้เร็วๆ นี้</h3>
              <p className="text-gray-500 mb-6 text-sm">
                ยังไม่มีโปรโมชั่นในขณะนี้ — ติดต่อเราเพื่อสอบถามข้อเสนอพิเศษ
              </p>
              <Link href="/contact">
                <Button variant="outline">ติดต่อสอบถาม</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {Array.from(grouped.entries()).map(([monthLabel, items]) => (
                <div key={monthLabel}>
                  {/* Month divider */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-semibold px-4 py-2 rounded-full">
                      <Calendar className="w-4 h-4" />
                      {monthLabel}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 shrink-0">{items.length} โปรโมชั่น</span>
                  </div>

                  {/* Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((promo) => (
                      <div
                        key={promo.id}
                        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                      >
                        {/* Image / Placeholder */}
                        {promo.coverImageUrl ? (
                          <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                            <Image
                              src={cldUrl(promo.coverImageUrl, "quality")}
                              alt={promo.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            {/* Badges on image */}
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              {isNew(promo.startDate) && (
                                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  ใหม่
                                </span>
                              )}
                              {isExpiringSoon(promo.endDate) && (
                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  ใกล้หมดเวลา
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative aspect-[16/9] bg-gradient-to-br from-[#0F172A] via-[#1a2f52] to-[#C8102E] flex items-center justify-center overflow-hidden">
                            <span className="text-white/10 text-7xl font-black select-none">GWM</span>
                            {/* Decorative circles */}
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              {isNew(promo.startDate) && (
                                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  ใหม่
                                </span>
                              )}
                              {isExpiringSoon(promo.endDate) && (
                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  ใกล้หมดเวลา
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-5">
                          <h3 className="font-semibold text-[#0F172A] leading-snug line-clamp-2 mb-3 group-hover:text-[#C8102E] transition-colors">
                            {promo.title}
                          </h3>

                          {/* Date range pill */}
                          {(promo.startDate || promo.endDate) && (
                            <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-xs text-gray-500 mb-3">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formatDateRange(promo.startDate, promo.endDate)}
                            </div>
                          )}

                          {promo.linkUrl ? (
                            <a
                              href={promo.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm font-medium text-[#C8102E] hover:underline"
                            >
                              ดูรายละเอียด
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <a
                              href="tel:034-219-000"
                              className="flex items-center gap-1 text-sm font-medium text-[#C8102E] hover:underline"
                            >
                              สอบถามโปรโมชั่น
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-[#0F172A] py-12">
          <div className="container text-center">
            <h3 className="text-xl font-bold text-white mb-2">ไม่พลาดทุกโปรโมชั่น</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
              ติดตาม LINE Official เพื่อรับข่าวสารโปรโมชั่นใหม่ก่อนใคร
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="https://line.me/R/ti/p/@gwmch.erawan" target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#06C755] hover:bg-[#05a847] text-white border-0">
                  ติดตามผ่าน LINE
                </Button>
              </a>
              <Link href="/booking?type=test_drive&brand=GWM">
                <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10">
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
