"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import {
  Search, Car, Building, Wrench, Tag, Star, Phone,
  BookOpen, Calendar, Map, ChevronRight, Layers,
  Zap, Palette, X,
} from "lucide-react";
import { BRANDS } from "@/lib/brandConfig";
import { AnimatePresence, motion } from "framer-motion";

// ─── Static search index ──────────────────────────────────────────────────────

interface SearchItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  group: string;
  keywords?: string;
}

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [
    // Main pages
    { id: "home",       label: "หน้าแรก",             href: "/",          icon: Building, group: "หน้าหลัก" },
    { id: "cars",       label: "รถยนต์ทั้งหมด",        href: "/cars",       icon: Car,      group: "หน้าหลัก", keywords: "รถ ราคา" },
    { id: "booking",    label: "นัดหมาย / ทดลองขับ",   href: "/booking",    icon: Calendar, group: "หน้าหลัก", keywords: "จอง นัด" },
    { id: "branches",   label: "สาขาและที่ตั้ง",        href: "/branches",   icon: Map,      group: "หน้าหลัก", keywords: "สาขา แผนที่ ที่อยู่" },
    { id: "blog",       label: "บทความและข่าวสาร",      href: "/blog",       icon: BookOpen, group: "หน้าหลัก", keywords: "บทความ ข่าว รีวิว" },
    { id: "contact",    label: "ติดต่อเรา",             href: "/contact",    icon: Phone,    group: "หน้าหลัก" },
    { id: "about",      label: "เกี่ยวกับเรา",          href: "/about",      icon: Building, group: "หน้าหลัก" },
    { id: "secondhand", label: "รถมือสอง",              href: "/secondhand", icon: Car,      group: "หน้าหลัก", keywords: "รถเก่า มือสอง" },
    { id: "insurance",  label: "ประกันภัยรถยนต์",       href: "/insurance",  icon: Tag,      group: "หน้าหลัก", keywords: "ประกัน" },
    { id: "career",     label: "ร่วมงานกับเรา",         href: "/career",     icon: Star,     group: "หน้าหลัก", keywords: "งาน สมัคร" },
    { id: "feedback",   label: "แนะนำ–ติชม / ร้องเรียน", href: "/feedback",   icon: Star,     group: "หน้าหลัก", keywords: "feedback ร้องเรียน ปัญหา ติชม ชมเชย" },
    // Brands
    ...BRANDS.map((b) => ({
      id: `brand-${b.slug}`,
      label: `${b.displayNameTh}`,
      sublabel: b.displayName,
      href: b.hubPath,
      icon: Car,
      group: "แบรนด์",
      keywords: `${b.displayName} ${b.displayNameTh} รถ`,
    })),
    // GWM sub-pages
    { id: "gwm-service",    label: "ศูนย์บริการ GWM",       sublabel: "GWM", href: "/gwm/service",    icon: Wrench,  group: "บริการ GWM", keywords: "ซ่อม เซอร์วิส" },
    { id: "gwm-body",       label: "ซ่อมสี/ตัวถัง GWM",     sublabel: "GWM", href: "/gwm/body-repair",icon: Palette, group: "บริการ GWM", keywords: "สี ตัวถัง เคลม" },
    { id: "gwm-promo",      label: "โปรโมชั่น GWM",         sublabel: "GWM", href: "/gwm/promotions", icon: Tag,     group: "บริการ GWM" },
    { id: "gwm-review",     label: "รีวิว GWM",             sublabel: "GWM", href: "/gwm/reviews",    icon: Star,    group: "บริการ GWM" },
    { id: "gwm-onestop",    label: "One Stop Service GWM",   sublabel: "GWM", href: "/gwm/one-stop",   icon: Layers,  group: "บริการ GWM" },
    // GWM sub-lines
    { id: "gwm-haval", label: "GWM HAVAL", sublabel: "SUV ไฮบริด", href: "/gwm/haval", icon: Car, group: "GWM Lines", keywords: "haval ฮาเวล" },
    { id: "gwm-ora",   label: "GWM ORA",   sublabel: "รถไฟฟ้า BEV", href: "/gwm/ora",   icon: Zap, group: "GWM Lines", keywords: "ora โอร่า ev" },
    { id: "gwm-tank",  label: "GWM TANK",  sublabel: "SUV Off-road", href: "/gwm/tank",  icon: Car, group: "GWM Lines", keywords: "tank แทงค์" },
    // Booking types
    { id: "book-test",     label: "นัดทดลองขับ",      href: "/booking?type=test_drive",     icon: Car,     group: "นัดหมาย" },
    { id: "book-service",  label: "นัดบริการซ่อม",    href: "/booking?type=service",        icon: Wrench,  group: "นัดหมาย" },
    { id: "book-bodyp",    label: "นัดซ่อมสี/ตัวถัง", href: "/booking?type=body_paint",     icon: Palette, group: "นัดหมาย" },
    { id: "book-ins",      label: "ขอใบเสนอราคาประกัน",href: "/insurance",icon: Tag,     group: "นัดหมาย" },
  ];
  return items;
}

const INDEX = buildIndex();
const GROUPS = ["รถยนต์", "หน้าหลัก", "แบรนด์", "บริการ GWM", "GWM Lines", "นัดหมาย"];

interface CarIndexEntry {
  slug: string;
  brand: string;
  model: string;
  year: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [carItems, setCarItems] = useState<SearchItem[]>([]);
  const logTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lazy-load car models into the index on first open so searches like "CX-3" work.
  useEffect(() => {
    if (!open || carItems.length > 0) return;
    let cancelled = false;
    fetch("/api/cars-index")
      .then((r) => (r.ok ? r.json() : []))
      .then((cars: CarIndexEntry[]) => {
        if (cancelled || !Array.isArray(cars)) return;
        setCarItems(
          cars.map((c) => ({
            id: `car-${c.slug}`,
            label: `${c.brand} ${c.model}`,
            sublabel: String(c.year),
            href: `/cars/${c.slug}`,
            icon: Car,
            group: "รถยนต์",
            keywords: `${c.brand} ${c.model} ${c.year}`,
          }))
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, carItems.length]);

  const fullIndex = carItems.length ? [...carItems, ...INDEX] : INDEX;

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
  }, [onOpenChange]);

  const navigate = useCallback((href: string) => {
    close();
    router.push(href);
  }, [close, router]);

  // Log failed searches (debounced 2s after user stops typing with no results)
  useEffect(() => {
    if (logTimerRef.current) clearTimeout(logTimerRef.current);
    if (!query.trim() || query.trim().length < 2) return;

    logTimerRef.current = setTimeout(() => {
      const trimmed = query.trim();
      const hasResults = fullIndex.some((item) => {
        const q = trimmed.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.sublabel?.toLowerCase().includes(q) || item.keywords?.toLowerCase().includes(q);
      });
      if (!hasResults) {
        fetch("/api/search-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, page: pathname }),
        }).catch(() => {});
      }
    }, 2000);

    return () => { if (logTimerRef.current) clearTimeout(logTimerRef.current); };
  }, [query, pathname]);

  // Filter items
  const results = query.trim()
    ? fullIndex.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.sublabel?.toLowerCase().includes(q) ||
          item.keywords?.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q)
        );
      })
    : INDEX;

  // Group results
  const grouped = GROUPS.reduce<Record<string, SearchItem[]>>((acc, g) => {
    const items = results.filter((i) => i.group === g);
    if (items.length) acc[g] = items;
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[8vh] inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[61] w-auto sm:w-full sm:max-w-xl"
          >
            <Command
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
              shouldFilter={false}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 border-b border-gray-100">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="ค้นหา รถยนต์ บริการ สาขา..."
                  className="flex-1 py-4 text-sm bg-transparent outline-none placeholder:text-gray-400 text-[#0F172A]"
                  autoFocus
                />
                {query && (
                  <button onClick={() => setQuery("")} className="p-1 rounded hover:bg-gray-100">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">
                  esc
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[55vh] overflow-y-auto pb-1">
                {results.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-400">
                    ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;
                  </div>
                )}

                {Object.entries(grouped).map(([group, items]) => (
                  <Command.Group key={group}>
                    {/* Group heading — rendered once, by us */}
                    <div className="px-4 pt-4 pb-1.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                        {group}
                      </p>
                    </div>
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Command.Item
                          key={item.id}
                          value={item.id}
                          onSelect={() => navigate(item.href)}
                          className="flex items-center gap-3 px-3 py-2 mx-2 rounded-xl cursor-pointer hover:bg-[#F8FAFC] aria-selected:bg-[#EFF6FF] transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-50 group-aria-selected:bg-[#0F172A] flex items-center justify-center shrink-0 transition-colors border border-gray-100 group-aria-selected:border-transparent">
                            <Icon className="w-4 h-4 text-gray-400 group-aria-selected:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-[#0F172A]">{item.label}</span>
                            {item.sublabel && (
                              <span className="text-xs text-gray-400 ml-2">{item.sublabel}</span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-data-[selected=true]:text-gray-400 shrink-0" />
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}

              </Command.List>

              {/* Footer hint — fixed, outside scroll area */}
              <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50/60">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] shadow-sm">↑↓</kbd> เลือก
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] shadow-sm">↵</kbd> ไป
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] shadow-sm">esc</kbd> ปิด
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
