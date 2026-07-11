"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import {
  BRANDS,
  GWM_SUB_LINES,
  getBrandHref,
  getGwmLineHref,
  type BrandConfig,
  type BrandSlug,
} from "@/lib/brandConfig";

// All brands now have sub-pages via generic [brand]/* routes
const HAS_SUB_PAGES = new Set<string>(["gwm", "mazda", "ford", "mitsubishi", "deepal", "kia"]);

const BRAND_SUB_LINKS = [
  { label: "ศูนย์บริการ",    section: "service" },
  { label: "ซ่อมสี/ตัวถัง", section: "body-repair" },
  { label: "โปรโมชั่น",      section: "promotions" },
  { label: "รีวิวรถ",         section: "reviews" },
];
import type {
  NavCountsByBrand,
  NavHighlightModel,
  NavModelBadge,
  NavModelsByBrand,
} from "@/lib/navModels";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface BrandNavMenuProps {
  navModelsByBrand?: NavModelsByBrand;
  navCountsByBrand?: NavCountsByBrand;
}

function navBadgeLabel(badge: NavModelBadge): string {
  return badge === "featured" ? "แนะนำ" : "ใหม่";
}

function resolveNavModels(
  brand: BrandConfig,
  navModelsByBrand: NavModelsByBrand
): NavHighlightModel[] {
  // Only show models backed by active cars (built from Notion in PublicLayoutServer).
  // No hardcoded featuredModels fallback — a brand with no active cars must show
  // no model links in the mega nav (otherwise stale demo models appear, R43).
  return navModelsByBrand[brand.notionBrand] ?? [];
}

function resolveNavCount(
  brand: BrandConfig,
  navCountsByBrand: NavCountsByBrand
): number | undefined {
  const n = navCountsByBrand[brand.notionBrand];
  return n && n > 0 ? n : undefined;
}

interface BrandNavTileProps {
  brand: BrandConfig;
  navModels: NavHighlightModel[];
  navTotalCount?: number;
  compact?: boolean;
  showFeatured?: boolean;
  showGwmSubLines?: boolean;
  className?: string;
}

function FeaturedModelLinks({
  brand,
  models,
  totalCount,
  compact = false,
}: {
  brand: BrandConfig;
  models: NavHighlightModel[];
  totalCount?: number;
  compact?: boolean;
}) {
  if (!models.length) return null;

  const countLabel = totalCount ?? models.length;

  return (
    <div
      className={cn(
        compact ? "mt-2" : "mt-3 border-t border-gray-100/80 pt-3"
      )}
    >
      {!compact && (
        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 px-1">
          รุ่นแนะนำ / ใหม่
        </p>
      )}
      <ul className="space-y-1">
        {models.map((model) => (
          <li key={model.slug}>
            <Link
              href={`/cars/${model.slug}`}
              className="group/model flex items-center justify-between gap-2 rounded-md px-2 py-1.5 min-h-[32px] text-xs text-gray-500 hover:bg-[#0F172A]/5 hover:text-[#0F172A] transition-colors"
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span className="truncate">{model.name}</span>
                {model.badge ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      model.badge === "featured"
                        ? "bg-[#DD5259]/10 text-[#DD5259]"
                        : "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {navBadgeLabel(model.badge)}
                  </span>
                ) : null}
              </span>
              <ChevronRight className="w-3 h-3 shrink-0 opacity-0 -translate-x-1 group-hover/model:opacity-60 group-hover/model:translate-x-0 transition-all" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={brand.hubPath}
        className={cn(
          "mt-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 min-h-[32px] text-xs font-semibold text-[#0F172A] hover:bg-[#0F172A]/5 hover:text-[#DD5259] transition-colors",
          compact ? "" : "border border-gray-100/80 bg-white/60"
        )}
      >
        <span className="truncate">
          ดูรุ่น {brand.displayNameTh} ทั้งหมด ({countLabel})
        </span>
        <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
      </Link>
    </div>
  );
}

function GwmSubLineLinks({
  compact = false,
  visible = true,
}: {
  compact?: boolean;
  visible?: boolean;
}) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("overflow-hidden", compact ? "mt-2" : "mt-3")}
    >
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 px-1">
        สายย่อย GWM
      </p>
      <div className={cn("flex flex-wrap gap-1.5", compact ? "" : "justify-center")}>
        {GWM_SUB_LINES.map((line) => (
          <Link
            key={line.slug}
            href={getGwmLineHref(line.slug)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-100 hover:border-[#DD5259]/40 px-2 py-1 min-h-[32px] bg-gray-50/80 hover:bg-white transition-all text-xs font-medium text-gray-600 hover:text-[#0F172A]"
          >
            <BrandLogo
              src={line.logoPath}
              alt={line.displayName}
              size="xs"
              width={48}
              height={16}
              className="opacity-80"
            />
            {line.displayName}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export function BrandNavTile({
  brand,
  navModels,
  navTotalCount,
  compact = false,
  showFeatured = false,
  showGwmSubLines = false,
  className,
}: BrandNavTileProps) {
  const [hovered, setHovered] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({
    x: 50,
    y: 50,
    tiltX: 0,
    tiltY: 0,
  });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = tileRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointer({
      x,
      y,
      tiltX: ((y - 50) / 50) * -3,
      tiltY: ((x - 50) / 50) * 3,
    });
  }, []);

  const resetPointer = useCallback(() => {
    setPointer({ x: 50, y: 50, tiltX: 0, tiltY: 0 });
  }, []);

  const active = hovered || showFeatured || showGwmSubLines;
  const logoRotateY = ((pointer.x - 50) / 50) * 10;
  const logoRotateX = ((pointer.y - 50) / 50) * -4;

  return (
    <div
      ref={tileRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        resetPointer();
      }}
      onMouseMove={handleMove}
      style={{
        transform: active
          ? `perspective(900px) rotateX(${pointer.tiltX}deg) rotateY(${pointer.tiltY}deg) scale(1.01)`
          : "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-white text-center min-h-[44px]",
        "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_16px_rgba(15,23,42,0.07)]",
        "transition-[border-color,box-shadow,transform] duration-300 ease-out will-change-transform",
        active
          ? "border-[#DD5259]/35 shadow-[0_2px_6px_rgba(15,23,42,0.06),0_16px_36px_rgba(19,31,60,0.14),0_0_0_1px_rgba(221,82,89,0.08)]"
          : "border-gray-100 hover:border-[#DD5259]/20 hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_10px_24px_rgba(15,23,42,0.1)]",
        compact ? "p-3" : "p-5",
        className
      )}
    >
      <Link
        href={brand.hubPath}
        aria-label={`ดู ${brand.displayNameTh}`}
        className="absolute inset-0 z-[2] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DD5259] focus-visible:ring-offset-2"
      />
      {brand.navBgImage ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl">
          <Image
            src={brand.navBgImage}
            alt=""
            fill
            sizes="(max-width: 1024px) 33vw, 200px"
            className={cn(
              "object-cover object-center transition-opacity duration-500",
              active ? "opacity-[0.22]" : "opacity-0"
            )}
          />
          <div
            className={cn(
              "absolute inset-0 bg-white transition-opacity duration-500",
              active ? "opacity-70" : "opacity-95"
            )}
            aria-hidden
          />
        </div>
      ) : null}

      <motion.div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `
            radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.45) 0%, transparent 38%),
            radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(221,82,89,0.16) 0%, rgba(19,31,60,0.05) 42%, transparent 72%),
            radial-gradient(circle at ${100 - pointer.x}% ${100 - pointer.y}%, rgba(19,31,60,0.07) 0%, transparent 55%)
          `,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: active
            ? "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -12px 24px rgba(19,31,60,0.04)"
            : undefined,
        }}
        aria-hidden
      />

      <div className="relative z-10 pointer-events-none flex flex-col flex-1">
        <motion.div
          className={cn(
            "mx-auto flex items-center justify-center mb-2",
            compact ? "w-14 h-14" : "w-[4.5rem] h-[4.5rem]"
          )}
          style={{ perspective: 500, transformStyle: "preserve-3d" }}
          animate={{
            rotateY: active ? logoRotateY : 0,
            rotateX: active ? logoRotateX : 0,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
        >
          <BrandLogo
            src={brand.logoPath}
            alt={brand.displayName}
            brandSlug={brand.slug}
            size={compact ? "sm" : "md"}
            containerClassName="h-full w-full bg-transparent p-1"
            width={compact ? 72 : 110}
            height={compact ? 28 : 40}
            className={cn(
              "transition-opacity duration-300",
              active ? "opacity-100" : "opacity-75"
            )}
          />
        </motion.div>

        <div className="font-semibold text-sm text-[#0F172A]">
          {brand.displayNameTh}
        </div>
        <div className="text-[11px] text-gray-400 font-medium tracking-wide">
          {brand.displayName}
        </div>
        <div
          className={cn(
            "text-xs mt-0.5 transition-colors",
            active ? "text-[#DD5259]" : "text-gray-400"
          )}
        >
          ดูรุ่นรถ →
        </div>

        <AnimatePresence>
          {showFeatured && navModels.length > 0 ? (
            <motion.div
              key="featured"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto relative z-20"
            >
              <FeaturedModelLinks
                brand={brand}
                models={navModels}
                totalCount={navTotalCount}
                compact={compact}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {brand.slug === "gwm" && (
          <AnimatePresence>
            {showGwmSubLines ? (
              <div className="pointer-events-auto relative z-20">
                <GwmSubLineLinks key="gwm-sublines" compact={compact} visible />
              </div>
            ) : null}
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}

export function BrandMegaMenuGrid({
  navModelsByBrand = {},
  navCountsByBrand = {},
}: BrandNavMenuProps) {
  const [hoveredSlug, setHoveredSlug] = useState<BrandSlug | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSpot, setPanelSpot] = useState({ x: 50, y: 30 });
  // Delay clearing hoveredSlug so mouse can travel between tiles without flash
  const hoverClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHoveredWithDelay = useCallback((slug: BrandSlug | null) => {
    if (hoverClearRef.current) clearTimeout(hoverClearRef.current);
    if (slug) {
      setHoveredSlug(slug);
    } else {
      hoverClearRef.current = setTimeout(() => setHoveredSlug(null), 200);
    }
  }, []);

  useEffect(() => () => { if (hoverClearRef.current) clearTimeout(hoverClearRef.current); }, []);

  const handlePanelMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanelSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  return (
    <div
      ref={panelRef}
      onMouseMove={handlePanelMove}
      className="relative"
      onMouseLeave={() => setHoveredWithDelay(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${panelSpot.x}% ${panelSpot.y}%, rgba(221,82,89,0.06), transparent 55%)`,
        }}
        aria-hidden
      />

      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {BRANDS.map((brand) => (
          // Only onMouseEnter here — NO onMouseLeave on individual tiles.
          // Clearing hoveredSlug is handled solely by the outer panelRef onMouseLeave.
          // This prevents the panel from shrinking mid-mouse-travel (service links stay accessible).
          <div
            key={brand.slug}
            onMouseEnter={() => setHoveredWithDelay(brand.slug)}
          >
            <BrandNavTile
              brand={brand}
              navModels={resolveNavModels(brand, navModelsByBrand)}
              navTotalCount={resolveNavCount(brand, navCountsByBrand)}
              showFeatured={hoveredSlug === brand.slug}
              showGwmSubLines={false}
            />
          </div>
        ))}
      </div>

      {/* Service links row — reactive to hovered brand.
          min-h is fixed so panel height never shrinks while mouse is inside. */}
      <div className="mt-4 pt-4 border-t border-gray-100 min-h-[52px]">
        {hoveredSlug && HAS_SUB_PAGES.has(hoveredSlug) ? (
          (() => {
            const hb = BRANDS.find(b => b.slug === hoveredSlug);
            if (!hb) return null;
            return (
              <motion.div
                key={hoveredSlug}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-2 w-full"
              >
                <p className="text-[11px] text-gray-400 font-medium">
                  บริการ {hb.displayNameTh}
                </p>
                <div className="flex justify-center gap-3 flex-wrap w-full">
                  {BRAND_SUB_LINKS.map(({ label, section }) => (
                    <Link
                      key={section}
                      href={`${hb.hubPath}/${section}`}
                      className="text-sm font-medium text-gray-700 hover:text-[#DD5259] border border-gray-200 hover:border-[#DD5259]/50 hover:bg-[#DD5259]/5 bg-white px-6 py-2.5 rounded-xl transition-all min-w-[120px] text-center"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })()
        ) : (
          <p className="text-xs text-gray-400">
            ชี้เมาส์ที่แบรนด์เพื่อดูบริการด่วน
          </p>
        )}
      </div>
    </div>
  );
}

/** Full desktop mega menu panel — rendered only when dropdown is open */
export function BrandMegaMenuPanel({
  navModelsByBrand = {},
  navCountsByBrand = {},
}: BrandNavMenuProps) {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#0F172A]">
          แบรนด์รถยนต์ที่ ช.เอราวัณ กรุ๊ป
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          เลือกแบรนด์เพื่อดูรุ่นรถทั้งหมด — ชี้เมาส์เพื่อดูไฮไลท์รุ่นแนะนำ / ใหม่
        </p>
      </div>
      <div className="space-y-5">
        <BrandMegaMenuGrid
          navModelsByBrand={navModelsByBrand}
          navCountsByBrand={navCountsByBrand}
        />

        {/* Brand service links are rendered inside BrandMegaMenuGrid, reactive to hover */}

        <div className="border-t border-gray-100 pt-5 flex items-center justify-between gap-4">
          <Link
            href="/cars"
            className="inline-flex items-center min-h-[44px] py-2 text-sm text-[#0F172A] font-semibold hover:text-[#DD5259] transition-colors"
          >
            ดูรถยนต์ทั้งหมด →
          </Link>
          <Link
            href="/secondhand"
            className="inline-flex items-center min-h-[44px] py-2 text-sm text-gray-400 hover:text-[#0F172A] transition-colors"
          >
            รถยนต์มือสอง →
          </Link>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use nested GWM links in BrandMegaMenuGrid instead */
export function GwmSubLineRow({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        compact ? "mt-2" : "mt-4 pt-4 border-t border-gray-100"
      )}
    >
      {!compact && (
        <span className="w-full text-xs text-gray-400 mb-1">สายย่อย GWM</span>
      )}
      {GWM_SUB_LINES.map((line) => (
        <Link
          key={line.slug}
          href={getGwmLineHref(line.slug)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-100 hover:border-[#DD5259]/30 px-3 py-2 min-h-[44px] bg-gray-50/50 hover:bg-white transition-all"
        >
          <BrandLogo
            src={line.logoPath}
            alt={line.displayName}
            size="xs"
            width={56}
            height={20}
            className="opacity-70"
          />
          <span className="text-xs font-medium text-gray-600">
            {line.displayName}
          </span>
        </Link>
      ))}
      <Link
        href={getBrandHref("gwm" as BrandSlug)}
        className="inline-flex items-center px-3 py-2 min-h-[44px] text-xs font-medium text-[#0F172A] hover:text-[#DD5259]"
      >
        GWM ทั้งหมด →
      </Link>
    </div>
  );
}

function MobileBrandTile({
  brand,
  navModels,
  navTotalCount,
}: {
  brand: BrandConfig;
  navModels: NavHighlightModel[];
  navTotalCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = navModels.length > 0 || HAS_SUB_PAGES.has(brand.slug);

  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
      <div className="flex items-stretch min-h-[44px]">
        <Link
          href={brand.hubPath}
          className="flex flex-1 items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#0F172A] min-h-[44px]"
        >
          <BrandLogo
            src={brand.logoPath}
            alt={brand.displayName}
            brandSlug={brand.slug}
            size="sm"
            width={56}
            height={20}
            className="opacity-80"
          />
          <span className="font-medium truncate">{brand.displayNameTh}</span>
        </Link>
        {hasExtra && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-3 border-l border-gray-100 text-gray-400 hover:text-[#0F172A] hover:bg-gray-50 min-w-[44px]"
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `ซ่อนรายละเอียด ${brand.displayNameTh}`
                : `ดูรายละเอียด ${brand.displayNameTh}`
            }
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              ▾
            </motion.span>
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-gray-100 bg-gray-50/50 px-3 py-2"
          >
            {navModels.length > 0 ? (
              <FeaturedModelLinks
                brand={brand}
                models={navModels}
                totalCount={navTotalCount}
                compact
              />
            ) : null}

            {/* Brand sub-page links (mobile) */}
            {HAS_SUB_PAGES.has(brand.slug) && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">บริการ</p>
                <div className="flex flex-wrap gap-1.5">
                  {BRAND_SUB_LINKS.map(({ label, section }) => (
                    <Link
                      key={section}
                      href={`${brand.hubPath}/${section}`}
                      className="text-xs text-gray-600 hover:text-[#C8102E] border border-gray-200 hover:border-red-200 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileBrandLinks({
  navModelsByBrand = {},
  navCountsByBrand = {},
}: BrandNavMenuProps) {
  return (
    <div className="ml-4 mt-1 space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {BRANDS.map((brand) => (
          <MobileBrandTile
            key={brand.slug}
            brand={brand}
            navModels={resolveNavModels(brand, navModelsByBrand)}
            navTotalCount={resolveNavCount(brand, navCountsByBrand)}
          />
        ))}
      </div>
      <Link
        href="/cars"
        className="block px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:text-[#DD5259] min-h-[44px]"
      >
        ดูรถยนต์ทั้งหมด →
      </Link>
    </div>
  );
}
