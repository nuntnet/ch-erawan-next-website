"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BrandMegaMenuPanel,
  MobileBrandLinks,
  type BrandNavMenuProps,
} from "@/components/BrandNavMenu";
import CompanyLogo from "@/components/CompanyLogo";
import BrandLogo from "@/components/BrandLogo";
import SearchPalette from "@/components/SearchPalette";
import type { BrandConfig } from "@/lib/brandConfig";

const MEGA_MENU_LABEL = "แบรนด์รถยนต์";

const navItems = [
  { label: "หน้าแรก", href: "/" },
  {
    label: "เกี่ยวกับเรา",
    href: "/about",
    children: [
      { label: "ประวัติบริษัท", href: "/about" },
      { label: "รางวัลและกิจกรรม", href: "/awards" },
      { label: "สาขาของเรา", href: "/branches" },
    ],
  },
  { label: MEGA_MENU_LABEL, href: "/cars", megaMenu: true },
  { label: "นัดหมายเรา", href: "/booking?type=test_drive" },
  { label: "การประกันรถยนต์", href: "/insurance" },
  { label: "ข่าวสารและกิจกรรม", href: "/blog" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export default function Navbar({
  navModelsByBrand = {},
  navCountsByBrand = {},
}: BrandNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [stickyBrand, setStickyBrand] = useState<BrandConfig | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinnedDropdown, setPinnedDropdown] = useState<string | null>(null);
  const [mobileBrandOpen, setMobileBrandOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeDropdown = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(null);
    setPinnedDropdown(null);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleStickyBrand = (e: Event) => {
      const { isSticky, brand } = (e as CustomEvent).detail;
      setStickyBrand(isSticky ? brand : null);
    };
    window.addEventListener("brand-subnav-sticky", handleStickyBrand);
    return () => window.removeEventListener("brand-subnav-sticky", handleStickyBrand);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setMobileBrandOpen(false);
    setMobileAboutOpen(false);
    closeDropdown();
  }, [pathname, closeDropdown]);

  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current?.contains(event.target as Node)) return;
      closeDropdown();
    };

    const handleScrollClose = () => closeDropdown();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDropdown();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollClose, { passive: true });
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollClose);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeDropdown, closeDropdown]);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    if (pinnedDropdown) return;
    // 400ms gives mouse time to travel from trigger button → dropdown panel
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 400);
  };

  const togglePinnedDropdown = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pinnedDropdown === label) {
      setPinnedDropdown(null);
      setActiveDropdown(null);
      return;
    }
    setPinnedDropdown(label);
    setActiveDropdown(label);
  };

  const handleDropdownTriggerKeyDown = (
    event: React.KeyboardEvent,
    label: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePinnedDropdown(label);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  const megaMenuOpen = activeDropdown === MEGA_MENU_LABEL;

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 bg-white ${
        scrolled ? "shadow-md" : "border-b border-gray-100"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-[68px]">
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              aria-label="ช.เอราวัณ ออโต้ กรุป — หน้าแรก"
            >
              <CompanyLogo height={44} priority className="h-11 w-auto" />
            </Link>
            {/* Mobile search — ติดโลโก้ฝั่งซ้าย */}
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="ค้นหา"
            >
              <Search className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {stickyBrand && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-px h-6 bg-gray-200" />
                  <Link href={stickyBrand.hubPath} className="flex items-center">
                    <BrandLogo
                      src={stickyBrand.logoPath}
                      alt={stickyBrand.displayName}
                      brandSlug={stickyBrand.slug}
                      size="md"
                      width={72}
                      height={28}
                    />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() =>
                  item.children || item.megaMenu
                    ? handleMouseEnter(item.label)
                    : undefined
                }
                onMouseLeave={
                  item.megaMenu ? undefined : handleMouseLeave
                }
              >
                {item.megaMenu ? (
                  <button
                    type="button"
                    id={`nav-trigger-${item.label}`}
                    className={`flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium transition-all whitespace-nowrap relative ${
                      isActive(item.href)
                        ? "text-[#131F3C] font-semibold"
                        : "text-[#4A5568] hover:text-[#131F3C]"
                    }`}
                    aria-expanded={megaMenuOpen}
                    aria-haspopup="true"
                    aria-controls="nav-brand-mega-menu"
                    onClick={() => togglePinnedDropdown(item.label)}
                    onKeyDown={(event) =>
                      handleDropdownTriggerKeyDown(event, item.label)
                    }
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        megaMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                    {isActive(item.href) && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#DD5259] rounded-full" />
                    )}
                  </button>
                ) : item.children ? (
                  <button
                    type="button"
                    id={`nav-trigger-${item.label}`}
                    className={`flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium transition-all whitespace-nowrap relative ${
                      isActive(item.href)
                        ? "text-[#131F3C] font-semibold"
                        : "text-[#4A5568] hover:text-[#131F3C]"
                    }`}
                    aria-expanded={activeDropdown === item.label}
                    aria-haspopup="true"
                    aria-controls={`nav-submenu-${item.label}`}
                    onClick={() => togglePinnedDropdown(item.label)}
                    onKeyDown={(event) =>
                      handleDropdownTriggerKeyDown(event, item.label)
                    }
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        activeDropdown === item.label ? "rotate-180" : ""
                      }`}
                    />
                    {isActive(item.href) && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#DD5259] rounded-full" />
                    )}
                  </button>
                ) : (
                  <Link href={item.href}>
                    <span
                      className={`flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium transition-all whitespace-nowrap relative ${
                        isActive(item.href)
                          ? "text-[#131F3C] font-semibold"
                          : "text-[#4A5568] hover:text-[#131F3C]"
                      }`}
                    >
                      {item.label}
                      {isActive(item.href) && (
                        <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#DD5259] rounded-full" />
                      )}
                    </span>
                  </Link>
                )}

                {item.children && activeDropdown === item.label && (
                  <div
                    id={`nav-submenu-${item.label}`}
                    role="menu"
                    className="absolute top-full left-0 mt-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100/80 py-2 z-50"
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#131F3C] transition-colors font-medium"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors text-sm bg-gray-50/50"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs hidden xl:block">ค้นหา</span>
              <kbd className="hidden xl:inline-flex items-center gap-0.5 text-[10px] bg-white border border-gray-200 px-1 py-0.5 rounded text-gray-400">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </button>
            <a href="tel:034305500">
              <Button
                size="sm"
                className="bg-[#131F3C] hover:bg-[#1a2a50] text-white font-semibold px-5 rounded-lg text-[13px] h-9 shadow-sm gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                034-305-500
              </Button>
            </a>
          </div>

          <button
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Mega menu — full-width panel anchored to nav, not nested in narrow item */}
      <AnimatePresence>
        {megaMenuOpen && (
          <motion.div
            key="brand-mega-menu"
            id="nav-brand-mega-menu"
            role="region"
            aria-labelledby={`nav-trigger-${MEGA_MENU_LABEL}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="hidden lg:block absolute left-0 right-0 top-full z-50 bg-white shadow-2xl border-t border-gray-100 pt-3 -mt-3"
            onMouseEnter={() => handleMouseEnter(MEGA_MENU_LABEL)}
            onMouseLeave={handleMouseLeave}
          >
            <BrandMegaMenuPanel
              navModelsByBrand={navModelsByBrand}
              navCountsByBrand={navCountsByBrand}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="container py-4 space-y-1">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.megaMenu ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMobileBrandOpen((open) => !open)}
                      className={`flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? "text-[#131F3C] bg-gray-50 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                      aria-expanded={mobileBrandOpen}
                    >
                      {item.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          mobileBrandOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileBrandOpen && (
                      <MobileBrandLinks
                        navModelsByBrand={navModelsByBrand}
                        navCountsByBrand={navCountsByBrand}
                      />
                    )}
                  </>
                ) : item.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMobileAboutOpen((open) => !open)}
                      className={`flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? "text-[#131F3C] bg-gray-50 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                      aria-expanded={mobileAboutOpen}
                    >
                      {item.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          mobileAboutOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileAboutOpen && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-50 hover:text-[#131F3C]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-[#131F3C] bg-gray-50 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-gray-100">
              <a href="tel:034305500">
                <Button className="w-full bg-[#131F3C] hover:bg-[#1a2a50] text-white font-semibold h-11 gap-2">
                  <Phone className="w-4 h-4" />
                  034-305-500
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
