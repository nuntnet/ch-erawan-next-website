"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
const BranchesMap = dynamic(() => import("@/components/BranchesMapEmbed"), {
  ssr: false,
  loading: () => <div className="h-[520px] rounded-2xl bg-[#0B1220] animate-pulse" />,
});
import BrandLogo from "@/components/BrandLogo";
import BrandHallCard from "@/components/BrandHallCard";
import { BRAND_IMAGES } from "@/lib/brandImages";
import { BRANDS } from "@/lib/brandConfig";
import { cldUrl } from "@/lib/cloudinary";
import { getYearsLabel, getYearsOfExperience } from "@/lib/company";
import {
  ArrowRight, Phone, MapPin, Calendar, Star,
  Shield, Wrench, Award, TrendingUp,
} from "lucide-react";
import type { Car, BlogPost, CustomerStory, Promotion } from "@/lib/notion-types";
import { format } from "date-fns";
import { th } from "date-fns/locale";

/**
 * Award slideshow images — upload photos from Google Drive to Cloudinary
 * then replace URLs here. Format: https://res.cloudinary.com/n5llrdnq/image/upload/ch-erawan/awards/...
 *
 * Current placeholders use graphicMapUrl from branchData until real award photos are uploaded.
 */
const AWARD_SLIDES: { url: string; caption: string }[] = [
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233444/ch-erawan/awards/mazda-dealer-excellence-2024.jpg", caption: "Mazda Dealer of Excellence Award 2024" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233448/ch-erawan/awards/mazda-dealer-excellence-2022.jpg", caption: "Mazda Dealer of Excellence Award 2022" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233450/ch-erawan/awards/mazda-guild-sale-2024.jpg", caption: "Mazda Guild — ทีมงานฝ่ายขายยอดเยี่ยม 2024" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233453/ch-erawan/awards/mitsu-body-paint-2024.jpg", caption: "Mitsubishi Body&Paint Performance Award 2024" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233457/ch-erawan/awards/mitsu-president-award-2018.jpg", caption: "Mitsubishi President Award — ผู้จำหน่ายยอดเยี่ยม 2018" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233460/ch-erawan/awards/gwm-top-sale-2024.jpg", caption: "GWM — ยอดขายสูงสุด 2024" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233463/ch-erawan/awards/gwm-top-sale-2025.jpg", caption: "GWM — สุดยอดนักขาย 2025" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233467/ch-erawan/awards/deepal-top-advisor-2025.jpg", caption: "Deepal — ที่ปรึกษาการขายยอดเยี่ยม 2025" },
  { url: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best,w_1200/v1780233470/ch-erawan/awards/deepal-top-sale-spare-part.jpg", caption: "Deepal — Top Sale & Spare Part Award" },
];

const heroSlides = [
  {
    bg: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:good/v1780245610/ch-erawan/hero/mazda-cx5-hero-2026.jpg",
    mobileGravity: "east", // car sits on the right half; g_auto picks the reflective glass on the left
    brand: "Mazda", tagline: "FEEL ALIVE",
    thaiTitle: "ขับเคลื่อนด้วยแรงบันดาลใจ",
    desc: "Mazda CX-5 SUV สมรรถนะสมดุล ดีไซน์ Kodo เอกลักษณ์เฉพาะตัว พร้อม i-Activsense ช่วยเหลือผู้ขับขี่",
  },
  {
    bg: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:good/v1780245615/ch-erawan/hero/gwm-haval-h6-hero.jpg",
    mobileGravity: "auto",
    brand: "GWM", tagline: "HAVAL H6 HEV",
    thaiTitle: "SUV ไฮบริดยอดนิยม",
    desc: "GWM HAVAL H6 HEV ประหยัดน้ำมัน ออพชั่นครบ ราคาเริ่มต้น 969,000 บาท จาก gwm.co.th",
  },
  {
    bg: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:good/v1780245617/ch-erawan/hero/kia-ev5-hero.jpg",
    mobileGravity: "auto",
    brand: "Kia", tagline: "INSPIRATION DRIVEN",
    thaiTitle: "SUV ไฟฟ้าแห่งอนาคต",
    desc: "Kia EV5 ดีไซน์ Opposites United ห้องโดยสารกว้าง ราคาเริ่มต้น 1,399,000 บาท",
  },
];

/** Portrait, car-focused crop for the mobile hero — Cloudinary content-aware
 * gravity keeps the vehicle in frame instead of centre-cropping a landscape shot. */
function heroMobileSrc(bg: string, gravity = "auto"): string {
  return bg.replace("f_auto,q_auto:good", `f_auto,q_auto:good,c_fill,g_${gravity},ar_4:5,w_800`);
}

const brandTabs = ["ทั้งหมด", ...BRANDS.map((b) => b.notionBrand)];

interface Props {
  featuredCars: Car[];
  recentPosts: BlogPost[];
  publicStories: CustomerStory[];
  promotions: Promotion[];
}

/** Auto-play award photo slideshow for the About section */
function AwardSlideshow() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = AWARD_SLIDES.length;

  const go = useCallback((idx: number) => {
    setCurrent((idx + total) % total);
  }, [total]);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent((s) => (s + 1) % total), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((s) => (s + 1) % total), 4000);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#0F172A] aspect-[4/3] group">
      {/* Slides */}
      {AWARD_SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={slide.url}
            alt={slide.caption}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
          />
          {/* Dark overlay + caption */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest">รางวัล</span>
            </div>
            <p className="text-white text-sm font-semibold leading-snug">{slide.caption}</p>
          </div>
        </div>
      ))}

      {/* Prev / Next arrows */}
      <button
        onClick={() => { go(current - 1); resetTimer(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        aria-label="ก่อนหน้า"
      >‹</button>
      <button
        onClick={() => { go(current + 1); resetTimer(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        aria-label="ถัดไป"
      >›</button>

      {/* Dots */}
      <div className="absolute bottom-14 right-4 flex gap-1.5">
        {AWARD_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { go(i); resetTimer(); }}
            className="flex items-center justify-center w-6 h-6"
            aria-label={`สไลด์ ${i + 1}`}
          >
            <span className={`block rounded-full transition-all ${i === current ? "bg-white w-4 h-1.5" : "w-1.5 h-1.5 bg-white/40"}`} />
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 bg-black/40 text-white/70 text-[10px] px-2 py-0.5 rounded-full">
        {current + 1} / {total}
      </div>
    </div>
  );
}

export default function HomeClient({ featuredCars, recentPosts, publicStories, promotions }: Props) {
  const [activeBrandTab, setActiveBrandTab] = useState("ทั้งหมด");
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setHeroSlide((s) => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const filteredCars = useMemo(() => {
    if (activeBrandTab === "ทั้งหมด") return featuredCars.slice(0, 6);
    return featuredCars.filter((c) => c.brand === activeBrandTab).slice(0, 6);
  }, [featuredCars, activeBrandTab]);

  return (
    <div className="min-h-screen pt-[68px]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-black h-[80svh] min-h-[540px] lg:h-[calc(100vh-68px)]">
        {heroSlides.map((slide, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === heroSlide ? "opacity-100" : "opacity-0"}`}>
            {/* Desktop: original landscape */}
            <Image
              src={slide.bg}
              alt={slide.brand}
              fill
              priority={i === 0}
              className="hidden md:block object-cover object-center"
              sizes="100vw"
            />
            {/* Mobile: portrait, car-focused crop (Cloudinary g_auto) */}
            <Image
              src={heroMobileSrc(slide.bg, slide.mobileGravity)}
              alt={slide.brand}
              fill
              priority={i === 0}
              className="md:hidden object-cover object-center"
              sizes="100vw"
            />
          </div>
        ))}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent z-10" />

        {/* ── Main hero text overlay ── */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end pb-20">
          <div className="container">
            <div className="max-w-3xl">
              {/* Brand label */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-px bg-[#DD5259]" />
                <span className="text-[#DD5259] text-xs font-bold uppercase tracking-[0.3em]">
                  Ch.Erawan Auto Group
                </span>
              </div>

              {/* Main quote */}
              <h1
                className="text-white font-bold leading-[1.1] mb-3"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3.75rem)" }}
              >
                ช.เอราวัณ คือเพื่อนแท้
                <br />
                <span className="text-white/75">ที่พร้อมดูแลรถคุณ</span>
              </h1>

              {/* Description */}
              <p className="text-white/55 text-sm lg:text-base leading-relaxed max-w-xl mb-6">
                {`ตัวแทนจำหน่ายรถยนต์ชั้นนำจ.นครปฐม กว่า ${getYearsOfExperience()} ปี — 6 แบรนด์ 7 สาขา`}
                ครอบคลุม ICE, Hybrid และ EV ด้วยทีมงานมืออาชีพกว่า 200 คน
              </p>

              {/* Per-slide tagline (subtle, changes with slide) */}
              <p
                className="text-white/60 text-xs font-medium uppercase tracking-[0.25em] transition-opacity duration-700"
                key={heroSlide}
              >
                {heroSlides[heroSlide].tagline} · {heroSlides[heroSlide].thaiTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
          {heroSlides.map((slide, i) => (
            <button key={i} onClick={() => setHeroSlide(i)}
              aria-label={`สไลด์ ${slide.brand}`}
              className="flex items-center justify-center w-8 h-8 -m-2"
            >
              <span className={`block rounded-full transition-all duration-300 ${i === heroSlide ? "w-8 h-2 bg-[#DD5259]" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`} />
            </button>
          ))}
        </div>
      </section>

      {/* BRAND LOGOS BAR */}
      <section className="bg-white border-b border-gray-100">
        <div className="container py-6">
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
            {BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                href={brand.hubPath}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 transition-all duration-300 group hover:scale-110 hover:opacity-80"
              >
                <BrandLogo
                  src={brand.logoPath}
                  alt={brand.displayName}
                  brandSlug={brand.slug}
                  size="md"
                  width={88}
                  height={32}
                  className="transition-all duration-300"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND HALL */}
      <section className="relative py-16 lg:py-28 bg-[#0B1220] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(221,82,89,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(19,31,60,0.5) 0%, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="container relative z-10">
          <div className="text-center mb-12 lg:mb-16 max-w-2xl mx-auto">
            <p className="text-[#DD5259] text-xs font-bold uppercase tracking-[0.25em] mb-4">
              Brand Hall
            </p>
            <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              โลกแห่งแบรนด์ชั้นนำ
            </h2>
            <p className="text-white/50 text-sm lg:text-base leading-relaxed">
              ตัวแทนจำหน่ายอย่างเป็นทางการ 6 แบรนด์ระดับโลก — สำรวจเอกลักษณ์ ปรัชญา
              และประสบการณ์ของแต่ละแบรนด์
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {BRANDS.map((brand) => (
              <BrandHallCard key={brand.slug} brand={brand} />
            ))}
          </div>
        </div>
      </section>

      {/* CAR SEARCH */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">ค้นหารุ่นรถที่ใช่ของคุณ</h2>
            <p className="text-gray-500">เลือกแบรนด์เพื่อดูรุ่นรถที่พร้อมจำหน่าย</p>
          </div>
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {brandTabs.map((tab) => (
              <button key={tab} onClick={() => setActiveBrandTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeBrandTab === tab ? "bg-[#0F172A] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >{tab}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-gray-500">ไม่พบรุ่นรถในหมวดนี้</div>
            ) : filteredCars.map((car) => (
              <div key={car.id} className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Whole image area links to car detail */}
                <Link href={`/cars/${car.slug || car.id}`} className="block relative aspect-[16/10] bg-gray-50 overflow-hidden">
                  {car.imageUrls[0] ? (
                    <Image src={cldUrl(car.imageUrls[0], "quality")} alt={car.model} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  ) : (
                    <Image src={BRAND_IMAGES[car.brand] ?? BRAND_IMAGES.default} alt={car.brand} fill className="object-cover opacity-80" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  )}
                  {car.isBestSeller && (
                    <Badge className="absolute top-3 left-3 bg-[#0F172A] text-white text-[10px] font-semibold px-2.5 py-1 border-0">แนะนำ</Badge>
                  )}
                </Link>
                <div className="p-5">
                  <p className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-1">{car.brand}</p>
                  <Link href={`/cars/${car.slug || car.id}`}>
                    <h3 className="font-bold text-[#0F172A] text-lg mb-2 hover:text-[#334155] transition-colors">{car.model}</h3>
                  </Link>
                  {car.priceMin > 0 && (
                    <p className="text-lg font-bold text-[#0F172A] mb-4">
                      ฿{car.priceMin.toLocaleString()}
                      <span className="text-xs font-normal text-gray-500 ml-1">เริ่มต้น</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/cars/${car.slug || car.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="text-xs border-gray-200 text-gray-600 hover:border-[#0F172A] w-full">ดูรายละเอียด</Button>
                    </Link>
                    <Link href={`/booking?type=test_drive&car=${car.model}`} className="flex-1">
                      <Button size="sm" className="text-xs bg-[#0F172A] hover:bg-[#1E293B] text-white w-full">ทดลองขับ</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/cars">
              <Button variant="outline" size="lg" className="border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white font-semibold px-10">
                ดูรถยนต์ทั้งหมด <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PROMOTIONS */}
      {promotions.length > 0 && (
        <section className="py-16 lg:py-24 bg-[#F8FAFC]">
          <div className="container">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <p className="text-[#DD5259] text-xs font-bold uppercase tracking-[0.25em] mb-3">Promotions</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">โปรโมชั่นและข้อเสนอพิเศษ</h2>
              <p className="text-gray-500">ดีลล่าสุดจากทุกแบรนด์ ช.เอราวัณ ออโต้ กรุป</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => {
                const brandSlug = BRANDS.find((b) => b.notionBrand === promo.brand)?.slug;
                const href = promo.linkUrl || (brandSlug ? `/${brandSlug}/promotions` : "/contact");
                const external = !!promo.linkUrl;
                const endLabel = promo.endDate
                  ? `ถึง ${new Date(promo.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`
                  : null;
                const card = (
                  <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 h-full">
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                      {promo.coverImageUrl ? (
                        <Image
                          src={cldUrl(promo.coverImageUrl, "quality")}
                          alt={promo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0C1C3E] via-[#1a2f52] to-[#334155]">
                          <span className="text-white/10 text-5xl font-black select-none uppercase">{promo.brand}</span>
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-[#0F172A]/85 text-white text-[10px] font-semibold px-2.5 py-1 border-0 backdrop-blur-sm">
                        {promo.brand}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-[#0F172A] leading-snug line-clamp-2 mb-3 group-hover:text-[#DD5259] transition-colors">
                        {promo.title}
                      </h3>
                      {endLabel && (
                        <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-xs text-gray-500 mb-3">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {endLabel}
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-sm font-medium text-[#DD5259]">
                        ดูรายละเอียด <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
                return external ? (
                  <a key={promo.id} href={href} target="_blank" rel="noopener noreferrer">{card}</a>
                ) : (
                  <Link key={promo.id} href={href}>{card}</Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* QUOTE SECTION */}
      <section className="relative py-20 lg:py-28 bg-[#131F3C] overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#DD5259]" />
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-8 h-8 text-[#DD5259]" />
                <span className="text-[#DD5259]/80 text-sm font-medium tracking-wider uppercase">ความภาคภูมิใจของเรา</span>
              </div>
              <blockquote className="text-2xl lg:text-3xl font-bold text-white leading-relaxed mb-6">
                "ช.เอราวัณ คือเพื่อนแท้ที่พร้อมดูแลรถคุณ ด้วยมาตรฐานระดับสากล และหัวใจของคนไทย"
              </blockquote>
              <div className="flex flex-wrap gap-6">
                {[[getYearsLabel(), "ปีแห่งประสบการณ์"], ["7", "สาขาทั่วนครปฐม"], ["6", "แบรนด์ชั้นนำ"]].map(([num, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-3xl font-bold text-[#DD5259]">{num}</div>
                    <div className="text-xs text-white/65 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: Award,
                  year: "2025",
                  title: "GWM Partner Challenge 2025",
                  desc: "รางวัลยอดขายอันดับ 1 สองปีซ้อน (2024–2025) จาก GWM Thailand",
                },
                {
                  icon: Star,
                  year: "2024",
                  title: "Mazda Dealer of Excellence 2024",
                  desc: "รางวัลผู้จำหน่ายยอดเยี่ยมแห่งปี พร้อมรางวัลทีมงานฝ่ายขายยอดเยี่ยม",
                },
                {
                  icon: Shield,
                  year: "2025",
                  title: "Mitsubishi Skills Contest Winner 2025",
                  desc: "รางวัลชนะเลิศ The Winner of Sales Consultant Mitsubishi Skills Contest",
                },
                {
                  icon: TrendingUp,
                  year: "2025",
                  title: "Deepal Top Sale Performance 2025",
                  desc: "รางวัล Top Sale Performance Award & Spare Parts Achievement Award จาก Deepal Thailand",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-[#DD5259] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-semibold text-sm leading-snug">{item.title}</span>
                        <span className="text-[#DD5259] text-[10px] font-bold bg-[#DD5259]/15 px-1.5 py-0.5 rounded">{item.year}</span>
                      </div>
                      <p className="text-white/65 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">บริการครบวงจรจาก ช.เอราวัณ</h2>
            <p className="text-gray-500 max-w-lg mx-auto">เราพร้อมดูแลรถของคุณตลอดอายุการใช้งาน</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Calendar, title: "นัดหมายทดลองขับ", desc: "ทดลองขับรถรุ่นที่คุณสนใจ ที่ศูนย์บริการใกล้บ้าน", href: "/booking?type=test_drive", color: "bg-blue-50 text-blue-600" },
              { icon: Wrench, title: "ศูนย์บริการมาตรฐาน", desc: "บริการซ่อมบำรุงตามระยะ ด้วยช่างผู้เชี่ยวชาญ", href: "/booking?type=service", color: "bg-emerald-50 text-emerald-600" },
              { icon: Shield, title: "ประกันภัยรถยนต์", desc: "เปรียบเทียบราคาจากบริษัทประกันชั้นนำ", href: "/insurance", color: "bg-amber-50 text-amber-600" },
              { icon: Star, title: "ซ่อมตัวถังและสี", desc: "แจ้งซ่อมออนไลน์ พร้อมส่งเอกสารให้ประกันอนุมัติ", href: "/booking?type=body_paint", color: "bg-rose-50 text-rose-600" },
            ].map((service) => (
              <Link key={service.title} href={service.href}>
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all cursor-pointer h-full">
                  <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4`}>
                    <service.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[#0F172A] mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.desc}</p>
                  <span className="text-xs font-medium text-[#0F172A] group-hover:underline">นัดหมายเลย →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT / MAP */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-4">ช.เอราวัณ ออโต้ กรุป</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                กลุ่มบริษัท ช.เอราวัณ ก่อตั้งขึ้นเมื่อปี พ.ศ. 2510 โดยคุณวิชัย จันทร์วาววาม
                เริ่มต้นจากอู่ซ่อมรถเล็กๆ ในจังหวัดนครปฐม จนเติบโตเป็นกลุ่มธุรกิจยานยนต์ครบวงจร
                ที่มีโชว์รูมและศูนย์บริการมากกว่า 15 แห่ง ครอบคลุม 6 แบรนด์ชั้นนำ
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600">75/2 หมู่ 1 ต.ธรรมศาลา อ.เมือง จ.นครปฐม 73000</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href="tel:034305500" className="text-sm text-gray-600 hover:text-[#0F172A] transition-colors">034-305-500</a>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/about">
                  <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold">
                    เกี่ยวกับเรา <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/branches">
                  <Button variant="outline" className="border-gray-200 text-gray-600 hover:border-[#0F172A]">ค้นหาสาขา</Button>
                </Link>
              </div>
            </div>
            {/* Award Photo Slideshow */}
            <AwardSlideshow />
          </div>
        </div>
      </section>

      {/* SECONDHAND CTA */}
      <section className="py-12 lg:py-16 bg-[#0F172A]">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[#DD5259] text-sm font-bold uppercase tracking-widest mb-1">รถมือสอง</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">รถยนต์มือสองคัดสรรคุณภาพ</h2>
              <p className="text-white/50 text-sm max-w-lg">
                รถมือสองผ่านการตรวจสภาพและรับประกัน คัดเลือกจากลูกค้าช.เอราวัณ พร้อมประวัติการดูแลรักษา
              </p>
            </div>
            <Link href="/secondhand" className="shrink-0">
              <Button className="bg-[#DD5259] hover:bg-[#c94048] text-white font-semibold px-8 py-3 text-base rounded-xl">
                ดูรถมือสอง <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CUSTOMER STORIES */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC]">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-2">เสียงจากลูกค้าของเรา</h2>
              <p className="text-gray-500">เรื่องราวความประทับใจจากลูกค้าที่ไว้วางใจ ช.เอราวัณ</p>
            </div>
            <Link href="/stories" aria-label="ดูรีวิวลูกค้าทั้งหมด" className="hidden md:block">
              <Button variant="outline" className="flex border-gray-200 text-gray-600 hover:border-[#0F172A]">
                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicStories.map((story) => (
              <div key={story.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: story.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#DD5259] text-[#DD5259]" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">"{story.story}"</p>
                <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#DD5259] to-[#c94850] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{story.customerName[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A] text-sm">{story.customerName}</p>
                    {story.carModel && <p className="text-xs text-gray-500 mt-0.5">{story.carModel}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/stories" aria-label="ดูรีวิวลูกค้าทั้งหมด">
              <Button variant="outline" className="border-gray-200 text-gray-600 hover:border-[#0F172A]">
                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* NEWS / BLOG */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-2">ข่าวสารและกิจกรรมล่าสุด</h2>
              <p className="text-gray-500">ติดตามข่าวสาร โปรโมชั่น และกิจกรรมจาก ช.เอราวัณ</p>
            </div>
            <Link href="/blog" aria-label="ดูบทความทั้งหมด" className="hidden md:block">
              <Button variant="outline" className="flex border-gray-200 text-gray-600 hover:border-[#0F172A]">
                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <div className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
                  <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden">
                    {post.coverImageUrl ? (
                      <Image src={cldUrl(post.coverImageUrl, "quality")} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Calendar className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <Badge variant="secondary" className="mb-2 text-[10px] font-medium">{post.category}</Badge>
                    <h3 className="font-semibold text-[#0F172A] mb-2 line-clamp-2">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>}
                    {post.publishedAt && (
                      <p className="text-xs text-gray-500 mt-3">
                        {format(new Date(post.publishedAt), "d MMM yyyy", { locale: th })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/blog" aria-label="ดูบทความทั้งหมด">
              <Button variant="outline" className="border-gray-200 text-gray-600 hover:border-[#0F172A]">
                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* BRANCHES MAP */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC]">
        <div className="container">
          <BranchesMap />
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 lg:py-20 bg-[#0F172A]">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">ติดต่อเราได้เลย ยินดีให้บริการ</h2>
          <p className="text-white/65 max-w-lg mx-auto mb-8">ให้ทีมผู้เชี่ยวชาญของเราช่วยคุณค้นหารถยนต์ที่ตรงกับความต้องการและงบประมาณของคุณ</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:034305500">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12">
                <Phone className="w-4 h-4 mr-2" /> 034-305-500
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" className="bg-[#DD5259] hover:bg-[#c94850] text-white font-semibold px-8 h-12 shadow-lg border-0">
                ติดต่อเรา <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
