"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import type { BrandConfig } from "@/lib/brandConfig";
import { BRAND_IMAGES } from "@/lib/brandImages";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface BrandHallCardProps {
  brand: BrandConfig;
  className?: string;
}

export default function BrandHallCard({ brand, className }: BrandHallCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pointer, setPointer] = useState({
    x: 50,
    y: 50,
    tiltX: 0,
    tiltY: 0,
  });

  const accent = brand.accentColor ?? "#DD5259";
  const heroImage =
    brand.heroBgImage ?? brand.navBgImage ?? BRAND_IMAGES[brand.notionBrand];
  // Showroom photo shown on hover (crossfade from car → dealership exterior)
  const showroomImage = brand.showroomImageUrl ?? null;

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointer({
      x,
      y,
      tiltX: ((y - 50) / 50) * -4,
      tiltY: ((x - 50) / 50) * 4,
    });
  }, []);

  const resetPointer = useCallback(() => {
    setPointer({ x: 50, y: 50, tiltX: 0, tiltY: 0 });
  }, []);

  const parallaxX = (pointer.x - 50) * 0.08;
  const parallaxY = (pointer.y - 50) * 0.08;

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        resetPointer();
      }}
      onMouseMove={handleMove}
      style={{
        transform: hovered
          ? `perspective(1000px) rotateX(${pointer.tiltX}deg) rotateY(${pointer.tiltY}deg) scale(1.015)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      }}
      className={cn(
        "group relative flex min-h-[320px] sm:min-h-[360px] lg:min-h-[400px] flex-col justify-end overflow-hidden rounded-2xl",
        "border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        "transition-[transform,box-shadow,border-color] duration-500 ease-out will-change-transform",
        hovered &&
          "border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <Link
        href={brand.hubPath}
        aria-label={`เข้าสู่โลก ${brand.displayNameTh}`}
        className="absolute inset-0 z-[5] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DD5259] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
      />
      {/* Car image — default state */}
      {heroImage ? (
        <motion.div
          className="absolute inset-0 z-0"
          animate={{
            x: hovered ? parallaxX : 0,
            y: hovered ? parallaxY : 0,
            scale: hovered ? 1.08 : 1,
            opacity: hovered && showroomImage ? 0 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        >
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </motion.div>
      ) : (
        <div
          className="absolute inset-0 z-0 bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A]"
          aria-hidden
        />
      )}

      {/* Showroom image — CSS transition (no Framer opacity to avoid blink) */}
      {showroomImage && (
        <div
          className="absolute inset-0 z-[1] rounded-2xl overflow-hidden"
          style={{
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.55s ease-in-out",
          }}
        >
          <Image
            src={showroomImage}
            alt={`โชว์รูม ${brand.displayNameTh} ช.เอราวัณ`}
            fill
            className="object-cover object-[center_35%]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* "SHOWROOM" badge */}
          <div
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#0F172A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(-6px)",
              transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s",
            }}
          >
            Showroom
          </div>
        </div>
      )}

      {/* Gradient overlay — lightens when showing showroom photo */}
      <motion.div
        className="absolute inset-0 z-[2]"
        animate={{ opacity: hovered && showroomImage ? 0.45 : 1 }}
        transition={{ duration: 0.5 }}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.15) 100%)" }}
        aria-hidden
      />
      <motion.div
        className="absolute inset-0 z-[2]"
        animate={{ opacity: hovered && showroomImage ? 0.2 : 0.7 }}
        transition={{ duration: 0.5 }}
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }}
        aria-hidden
      />
      <motion.div
        className="absolute inset-0 z-[3] mix-blend-soft-light"
        animate={{ opacity: hovered ? 0.55 : 0.35 }}
        transition={{ duration: 0.4 }}
        style={{
          background: `linear-gradient(135deg, ${accent}55 0%, transparent 50%), radial-gradient(circle at ${pointer.x}% ${pointer.y}%, ${accent}33 0%, transparent 45%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 pointer-events-none flex flex-col p-6 sm:p-7 lg:p-8">
        <motion.div
          className="mb-auto pb-6 self-start"
          animate={{
            y: hovered ? -4 : 0,
            scale: hovered ? 1.03 : 1,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
        >
          <BrandLogo
            src={brand.logoLightPath ?? brand.logoPath}
            alt={brand.displayName}
            brandSlug={brand.slug}
            size="lg"
            bare
            white={brand.logoOnDark !== "native"}
            nativeOnDark={brand.logoOnDark === "native"}
            width={160}
            height={52}
            containerClassName="!justify-start"
            className="object-left"
          />
        </motion.div>

        <div className="space-y-2">
          {brand.tagline ? (
            <p
              className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {brand.tagline}
            </p>
          ) : null}

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {brand.displayNameTh}
            </h3>
            <p className="text-xs sm:text-sm text-white/45 font-medium tracking-wide mt-0.5">
              {brand.displayName}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-white/55 leading-relaxed line-clamp-2 max-w-md">
            {brand.descriptionTh}
          </p>

          <div
            className={cn(
              "inline-flex items-center gap-2 pt-3 text-sm font-semibold transition-colors",
              hovered ? "text-white" : "text-white/80"
            )}
          >
            <span>เข้าสู่โลก{brand.displayNameTh}</span>
            <ArrowRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300",
                hovered && "translate-x-1"
              )}
              style={{ color: hovered ? accent : undefined }}
            />
          </div>
        </div>

        {brand.subLines ? (
          <div className="pointer-events-auto relative z-20 mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {brand.subLines.map((line) => (
              <Link
                key={line.slug}
                href={`${brand.hubPath}/${line.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 min-h-[32px] text-[10px] font-medium text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white transition-all"
              >
                <BrandLogo
                  src={line.logoPath}
                  alt={line.displayName}
                  size="xs"
                  width={40}
                  height={14}
                  white
                  className="opacity-90"
                />
                {line.displayName}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
