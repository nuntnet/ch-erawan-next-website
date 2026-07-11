"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { BrandConfig } from "@/lib/brandConfig";

interface SubNavItem {
  label: string;
  href: string;
  section: string;
}

function getSubNavItems(brand: BrandConfig): SubNavItem[] {
  return [
    { label: "ภาพรวม", href: brand.hubPath, section: "overview" },
    { label: "ศูนย์บริการ", href: `${brand.hubPath}/service`, section: "service" },
    { label: "ซ่อมสี/ตัวถัง", href: `${brand.hubPath}/body-repair`, section: "body-repair" },
    { label: "โปรโมชั่น", href: `${brand.hubPath}/promotions`, section: "promotions" },
    { label: "รีวิวรถ", href: `${brand.hubPath}/reviews`, section: "reviews" },
  ];
}

interface BrandSubNavProps {
  brand: BrandConfig;
  currentSection?: string;
  /** Auto-scroll hero out of view on mount (use on sub-pages, not hub page) */
  scrollPastHero?: boolean;
}

export default function BrandSubNav({ brand, scrollPastHero }: BrandSubNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const items = getSubNavItems(brand);

  // Scroll past hero on sub-pages
  useEffect(() => {
    if (!scrollPastHero || !navRef.current) return;
    const navTop = navRef.current.getBoundingClientRect().top + window.scrollY;
    const NAVBAR_HEIGHT = 68;
    window.scrollTo({ top: navTop - NAVBAR_HEIGHT, behavior: "instant" });
  }, [scrollPastHero]);

  // Notify Navbar when this bar becomes sticky
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(
          new CustomEvent("brand-subnav-sticky", {
            detail: { isSticky: !entry.isIntersecting, brand },
          })
        );
      },
      { threshold: 0, rootMargin: `-68px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      // Reset when component unmounts
      window.dispatchEvent(
        new CustomEvent("brand-subnav-sticky", { detail: { isSticky: false, brand: null } })
      );
    };
  }, [brand]);

  const isActive = (item: SubNavItem) => {
    if (item.section === "overview") return pathname === brand.hubPath;
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Sentinel: when this exits viewport (past navbar), the bar is sticky */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden />
      <div
        ref={navRef}
        className="sticky top-[68px] z-30 bg-[#0F172A]/95 backdrop-blur-sm border-b border-white/10"
      >
      <div className="container overflow-x-auto">
        <nav className="flex items-center gap-1 py-1 min-w-max">
          {items.map((item) => (
            <Link
              key={item.section}
              href={item.href}
              className={cn(
                "px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                isActive(item)
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
    </>
  );
}
