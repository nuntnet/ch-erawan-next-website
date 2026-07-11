import { BRANDS } from "@/lib/brandConfig";

/**
 * Designed fallback cover for promotions without a cover image.
 * CSS-only (zero extra bytes): brand-tinted wash + promo title as a
 * typographic watermark, so cards differ per brand AND per promo instead
 * of rendering as identical flat navy boxes.
 */
export default function PromoFallbackCover({ brand, title }: { brand: string; title: string }) {
  const accent = BRANDS.find((b) => b.notionBrand === brand)?.accentColor || "#DD5259";
  return (
    <div className="relative w-full h-full bg-[#0F172A] overflow-hidden">
      {/* brand-tinted corner wash — differentiates cards by brand */}
      <div
        className="absolute -top-12 -right-12 w-52 h-52 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: accent }}
      />
      {/* subtle diagonal texture */}
      <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(135deg,white_0,white_1px,transparent_1px,transparent_10px)]" />
      {/* brand accent baseline */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />
      <div className="relative h-full flex flex-col justify-between p-5">
        <span className="self-end text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>
          Promotion
        </span>
        {/* promo title as typographic watermark — varies per card */}
        <p className="text-white/25 font-black text-2xl leading-tight line-clamp-3 select-none">
          {title}
        </p>
      </div>
    </div>
  );
}
