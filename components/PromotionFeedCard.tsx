import Link from "next/link";
import { Calendar, ChevronRight, ExternalLink } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary";
import PromoFallbackCover from "@/components/PromoFallbackCover";
import BrandLogo from "@/components/BrandLogo";
import { BRANDS } from "@/lib/brandConfig";
import type { Promotion } from "@/lib/notion-types";

function isExpiringSoon(endDate: string | null): boolean {
  if (!endDate) return false;
  const diff = new Date(endDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isNew(startDate: string | null): boolean {
  if (!startDate) return false;
  return Date.now() - new Date(startDate).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (startDate) return `เริ่ม ${fmt(startDate)}`;
  if (endDate) return `ถึง ${fmt(endDate)}`;
  return "";
}

interface PromotionFeedCardProps {
  promo: Promotion;
  accentColor: string;
  /** Show the brand name in the post header — for feeds mixing multiple brands (e.g. homepage). */
  showBrandName?: boolean;
  /** Internal link to use when the promo has no linkUrl (e.g. that brand's promotions page). */
  fallbackHref?: string;
  /** tel: number to use when the promo has no linkUrl and no fallbackHref (e.g. that branch's phone). */
  fallbackTel?: string;
}

/**
 * A single promotion rendered like a social-feed post: header (brand +
 * dates), full caption, media at its own natural aspect ratio (no forced
 * cropping — these images are usually dense marketing posters, not photos),
 * then an action link.
 */
export default function PromotionFeedCard({
  promo,
  accentColor,
  showBrandName = false,
  fallbackHref,
  fallbackTel,
}: PromotionFeedCardProps) {
  const dateLabel = formatDateRange(promo.startDate, promo.endDate);
  const brandConfig = BRANDS.find((b) => b.notionBrand === promo.brand);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Post header */}
      <div className="flex items-center gap-3 px-5 pt-4">
        {brandConfig ? (
          <BrandLogo
            src={brandConfig.logoPath}
            alt={brandConfig.displayName}
            brandSlug={brandConfig.slug}
            size="xs"
            containerClassName="bg-white border border-gray-100 rounded-lg"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold" style={{ color: accentColor }}>
              {promo.brand.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          {showBrandName && (
            <p className="text-sm font-semibold text-[#0F172A] truncate">{promo.brand}</p>
          )}
          {dateLabel && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {dateLabel}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {isNew(promo.startDate) && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ใหม่</span>
          )}
          {isExpiringSoon(promo.endDate) && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ใกล้หมดเวลา</span>
          )}
        </div>
      </div>

      {/* Caption — full title, no truncation */}
      <p className="px-5 pt-3 pb-4 text-[#0F172A] font-medium leading-relaxed">{promo.title}</p>

      {/* Media — natural aspect ratio, capped height, never cropped */}
      {promo.coverImageUrl ? (
        <div className="bg-gray-50 border-y border-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cldUrl(promo.coverImageUrl, "quality")}
            alt={promo.title}
            loading="lazy"
            className="w-full max-h-[560px] object-contain mx-auto block"
          />
        </div>
      ) : (
        <div className="aspect-[16/9]">
          <PromoFallbackCover brand={promo.brand} title={promo.title} />
        </div>
      )}

      {/* Action */}
      <div className="px-5 py-4">
        {promo.linkUrl ? (
          <a
            href={promo.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            style={{ color: accentColor }}
          >
            ดูรายละเอียด
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : fallbackHref ? (
          <Link
            href={fallbackHref}
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            style={{ color: accentColor }}
          >
            ดูโปรโมชั่นทั้งหมด
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : fallbackTel ? (
          <a
            href={`tel:${fallbackTel}`}
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            style={{ color: accentColor }}
          >
            สอบถามโปรโมชั่น
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
