import Link from "next/link";
import Image from "next/image";
import BrandLogo from "@/components/BrandLogo";
import BrandBreadcrumb from "@/components/BrandBreadcrumb";
import BrandHeroContent from "@/components/BrandHeroContent";
import BrandSocialLinks from "@/components/BrandSocialLinks";
import { Button } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brandImages";
import type { BrandConfig } from "@/lib/brandConfig";
import type { BreadcrumbItem } from "@/lib/site";
import type { BrandSocialLink } from "@/lib/notion-types";


interface BrandHeroProps {
  brand: BrandConfig;
  breadcrumbs: BreadcrumbItem[];
  bgImage?: string;
  /** Extra row below description (GWM sub-lines, line tabs, etc.) */
  footer?: React.ReactNode;
  /** Override primary CTA */
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Optional second logo (GWM line pages) */
  secondaryLogo?: { src: string; alt: string; label?: string };
  /** Social media links — fetched from Notion, shown below description */
  socialLinks?: BrandSocialLink[];
}

export default function BrandHero({
  brand,
  breadcrumbs,
  bgImage,
  footer,
  primaryCta,
  secondaryCta,
  secondaryLogo,
  socialLinks,
}: BrandHeroProps) {
  const heroImage =
    bgImage ??
    brand.heroBgImage ??
    brand.navBgImage ??
    BRAND_IMAGES[brand.notionBrand];
  const accent = brand.accentColor ?? "#DD5259";
  const primary = primaryCta ?? {
    label: "นัดทดลองขับ",
    href: `/booking?type=test_drive&brand=${brand.notionBrand}`,
  };
  const secondary = secondaryCta ?? {
    label: "ดูรถทั้งหมด",
    href: "/cars",
  };

  return (
    <section className="relative overflow-hidden min-h-[420px] lg:min-h-[500px] flex items-end">
      {heroImage ? (
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A]"
          aria-hidden
        />
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/75 to-[#0F172A]/25"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/55 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{
          background: `linear-gradient(135deg, ${accent}33 0%, transparent 55%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full text-white">
        <div className="container py-12 lg:py-16">
          <BrandBreadcrumb items={breadcrumbs} />

          <BrandHeroContent className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mt-2">
            <div className="max-w-2xl">
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <BrandLogo
                  src={brand.logoLightPath ?? brand.logoPath}
                  alt={brand.displayName}
                  brandSlug={brand.slug}
                  size="xl"
                  bare
                  white={brand.logoOnDark !== "native"}
                  nativeOnDark={brand.logoOnDark === "native"}
                  width={220}
                  height={72}
                  priority
                />
                {secondaryLogo ? (
                  <>
                    <span className="text-white/30 text-sm hidden sm:inline">
                      {secondaryLogo.label ?? "by"}
                    </span>
                    <BrandLogo
                      src={secondaryLogo.src}
                      alt={secondaryLogo.alt}
                      size="lg"
                      bare
                      white
                      width={120}
                      height={40}
                      className="opacity-80"
                    />
                  </>
                ) : null}
              </div>

              {brand.tagline ? (
                <p
                  className="text-sm font-semibold tracking-[0.2em] uppercase mb-2"
                  style={{ color: accent }}
                >
                  {brand.tagline}
                </p>
              ) : null}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {brand.displayNameTh}
                <span className="text-white/40 font-normal text-2xl md:text-3xl ml-2">
                  {brand.displayName}
                </span>
              </h1>

              <p className="text-white/70 text-base lg:text-lg leading-relaxed max-w-xl">
                {brand.descriptionTh}
              </p>

              {/* Social links */}
              {socialLinks && socialLinks.length > 0 && (
                <div className="flex items-center gap-3 mt-5">
                  <span className="text-white/35 text-xs tracking-wider uppercase">ติดตาม</span>
                  <BrandSocialLinks links={socialLinks} brand={brand} variant="dark" size="sm" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link href={primary.href}>
                <Button
                  className="font-semibold min-h-[44px] text-white border-0"
                  style={{ backgroundColor: accent }}
                >
                  {primary.label}
                </Button>
              </Link>
              <Link href={secondary.href}>
                <Button
                  variant="outline"
                  className="border-white/35 text-white hover:bg-white/10 min-h-[44px] bg-white/5 backdrop-blur-sm"
                >
                  {secondary.label}
                </Button>
              </Link>
            </div>
          </BrandHeroContent>

          {footer ? (
            <div className="mt-10 pt-8 border-t border-white/15">{footer}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function BrandHeroSubLineLinks({
  brand,
  activeSlug,
}: {
  brand: BrandConfig;
  activeSlug?: string;
}) {
  if (!brand.subLines?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {brand.subLines.map((line) => {
        const isActive = line.slug === activeSlug;
        return (
          <Link
            key={line.slug}
            href={`/gwm/${line.slug}`}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 min-h-[44px] text-sm font-medium transition-colors backdrop-blur-sm ${
              isActive
                ? "bg-white text-[#0F172A]"
                : "bg-white/10 text-white/75 hover:bg-white/20 border border-white/15"
            }`}
          >
            <BrandLogo
              src={line.logoPath}
              alt={line.displayName}
              size="xs"
              bare
              white={!isActive}
              width={56}
              height={20}
              className={isActive ? "brightness-0" : "opacity-90"}
            />
            {line.displayName}
          </Link>
        );
      })}
    </div>
  );
}
