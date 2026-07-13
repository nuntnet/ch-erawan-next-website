"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { BRANDS, type BrandSlug } from "@/lib/brandConfig";
import { BRAND_IMAGES } from "@/lib/brandImages";
import { branches } from "@/lib/branchData";
import CoverageMap from "@/components/about/CoverageMap";
import { getYearsLabel, getYearsOfExperience, FOUNDED_YEAR_BE } from "@/lib/company";
import {
  Award,
  Users,
  MapPin,
  Shield,
  Star,
  Heart,
  TrendingUp,
  Building2,
  ChevronRight,
} from "lucide-react";

const hqBranch = branches.find((b) => b.isHQ)!;

// Some brand marks sit on a much smaller/narrower canvas than others (e.g. a
// tall diamond vs. a wide wordmark), so object-contain renders them visibly
// smaller at the same logoScale. Local override for this strip only — the
// shared brandConfig.logoScale still governs hero/nav usage elsewhere.
const STRIP_LOGO_SCALE: Partial<Record<BrandSlug, number>> = {
  mitsubishi: 1.4,
  gac: 1.35,
};

type TimelineItem = {
  year: string;
  title: string;
  desc: string;
  milestone: string;
  image?: string;
  imageAlt?: string;
  imageClass?: string;
};

const timeline: TimelineItem[] = [
  {
    year: "2510",
    title: "จุดเริ่มต้นของตำนาน",
    desc: "นายชัยพงศ์ จันทร์วาววาม ก่อตั้ง หสน.ช.เอราวัณ จำหน่ายอะไหล่รถยนต์และอะไหล่รถแทร็คเตอร์ ที่ตลาดลูกแก ต.ดอนขมิ้น อ.ท่ามะกา จ.กาญจนบุรี",
    milestone: "ก่อตั้งกิจการ",
    image: "/logo-company.png",
    imageAlt: "โลโก้ ช.เอราวัณ",
    imageClass: "object-contain bg-[#0F172A] p-8",
  },
  {
    year: "2520s",
    title: "ก้าวสู่ธุรกิจรถยนต์",
    desc: "เริ่มนำรถเก่าญี่ปุ่นมาจำหน่าย ก่อตั้ง บจก.ช.เอราวัณร่วมทุนธุรกิจ เปิดโชว์รูมแห่งแรก เป็นตัวแทนจำหน่ายรถยนต์ดัทสัน (นิสสัน) และมิตซูบิชิ",
    milestone: "เปิดโชว์รูมแห่งแรก",
  },
  {
    year: "2530",
    title: "ขยายสู่นครปฐม",
    desc: "คุณวิชัย จันทร์วาววาม และคุณสุกัญญา จันทร์วาววาม บุกเบิกขยายธุรกิจเข้าสู่จังหวัดนครปฐม ภายใต้ชื่อ ช.เอราวัณ ออโตเซลส์",
    milestone: "สาขานครปฐม",
    image: hqBranch.graphicMapUrl,
    imageAlt: hqBranch.name,
  },
  {
    year: "2544",
    title: "พันธมิตร Mazda",
    desc: "ได้รับแต่งตั้งเป็นตัวแทนจำหน่ายรถยนต์มาสด้าอย่างเป็นทางการ เริ่มต้นความสัมพันธ์กับแบรนด์ที่แข็งแกร่งที่สุดในเครือ",
    milestone: "Mazda Dealer",
    image: BRAND_IMAGES.Mazda,
    imageAlt: "Mazda CX-5",
  },
  {
    year: "2556",
    title: "เปิดสาขาศาลายา",
    desc: "เปิดสาขา มาสด้า ช.เอราวัณ ศาลายา บนถนนพุทธมณฑลสาย 5 รองรับลูกค้าในเขตสามพราน ศาลายา และปริมณฑลตะวันตก",
    milestone: "Mazda ศาลายา",
    image: branches.find((b) => b.id === "mazda-salaya")!.graphicMapUrl,
    imageAlt: "มาสด้า ช.เอราวัณ ศาลายา",
  },
  {
    year: "2558",
    title: "Ford อ้อมใหญ่",
    desc: "เปิด ฟอร์ด ช.เอราวัณ อ้อมใหญ่ บนถนนเพชรเกษม อ.สามพราน เสริมความแข็งแกร่งในกลุ่ม Pickup Truck และ SUV",
    milestone: "Ford Dealer",
    image: BRAND_IMAGES.Ford,
    imageAlt: "Ford Ranger",
  },
  {
    year: "2559",
    title: "Mitsubishi นครปฐม",
    desc: "เปิด มิตซู ช.เอราวัณ นครปฐม ที่ ต.ลำพยา อ.เมือง จ.นครปฐม ครบวงจรด้วยแบรนด์ญี่ปุ่นที่ครองตลาด Pickup Truck",
    milestone: "Mitsubishi Dealer",
    image: BRAND_IMAGES.Mitsubishi,
    imageAlt: "Mitsubishi Triton",
  },
  {
    year: "2566",
    title: "ก้าวสู่ยุค EV",
    desc: "ได้รับแต่งตั้งเป็นตัวแทนจำหน่าย GWM เปิดโชว์รูมที่ ต.ธรรมศาลา จ.นครปฐม ครบทั้ง HAVAL, ORA และ TANK พร้อมรับกระแสรถยนต์ไฟฟ้าและไฮบริดอย่างเต็มตัว",
    milestone: "GWM Dealer",
    image: BRAND_IMAGES.GWM,
    imageAlt: "GWM HAVAL H6 HEV",
  },
  {
    year: "2567",
    title: "Deepal ศาลายา",
    desc: "เปิด Deepal ช.เอราวัณ ศาลายา ตัวแทนจำหน่ายรถยนต์ไฟฟ้า Deepal จาก Changan ติดกับโชว์รูมมาสด้า ศาลายา ขยายพอร์ตโฟลิโอ EV 100%",
    milestone: "Deepal Dealer",
    image: BRAND_IMAGES.Deepal,
    imageAlt: "Deepal S07",
  },
  {
    year: "2568",
    title: "Kia นครปฐม",
    desc: "เปิด Kia ช.เอราวัณ นครปฐม ที่ อ.สามพราน เสริมพอร์ตโฟลิโอด้วย SUV, MPV และ EV ระดับโลกจากเกาหลีใต้ ดีไซน์ Opposites United",
    milestone: "Kia Dealer",
    image: BRAND_IMAGES.Kia,
    imageAlt: "Kia EV9",
  },
  {
    year: "2569",
    title: "GAC และ Lepas",
    desc: "ขยายสู่ 8 แบรนด์ ภายใต้ บริษัท ช.เอราวัณ เนกซ์ จำกัด — ก่อสร้างโชว์รูม GAC (AION, HYPTEC, GAC MOTOR) ที่ ต.ลำพยา กำหนดเปิดตุลาคม 2569 พร้อมเตรียมเปิดตัว Lepas แบรนด์พรีเมียมจาก Chery Group",
    milestone: "GAC · Lepas",
    image: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1783781107/ch-erawan/brands/gac-nakhonpathom-exterior-render.png",
    imageAlt: "โชว์รูม GAC ช.เอราวัณ นครปฐม (แบบจำลอง 3 มิติ)",
  },
  {
    year: "ปัจจุบัน",
    title: "8 แบรนด์ 9 สาขา",
    desc: "ช.เอราวัณ กรุ๊ป เติบโตเป็นกลุ่มดีลเลอร์ชั้นนำในภาคตะวันตก ครอบคลุม ICE, Hybrid และ EV ครบทุกกลุ่ม ส่วนแบ่งตลาดรวม ~13.1%",
    milestone: "ผู้นำภาคตะวันตก",
    image: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245672/ch-erawan/team/team-photo-2.jpg",
    imageAlt: "ทีมงาน ช.เอราวัณ กรุ๊ป",
  },
];

const coreValues = [
  { icon: Shield, title: "ความซื่อสัตย์", sub: "Integrity", desc: "ดำเนินธุรกิจด้วยความโปร่งใสและซื่อตรงต่อลูกค้าและพันธมิตรทุกราย" },
  { icon: Star, title: "ความเป็นเลิศ", sub: "Excellence", desc: "มุ่งมั่นพัฒนาคุณภาพการบริการและผลิตภัณฑ์อย่างต่อเนื่องไม่หยุดยั้ง" },
  { icon: Heart, title: "มุ่งเน้นลูกค้า", sub: "Customer Focus", desc: "ให้ความสำคัญกับความต้องการและความพึงพอใจของลูกค้าเป็นอันดับแรกเสมอ" },
  { icon: Users, title: "การทำงานเป็นทีม", sub: "Teamwork", desc: "ส่งเสริมการทำงานร่วมกันอย่างมีประสิทธิภาพเพื่อบรรลุเป้าหมายองค์กร" },
];

const awards = [
  {
    title: "GWM Number One Award",
    year: "2567",
    desc: "รางวัลผู้จำหน่ายยอดเยี่ยมอันดับ 1 จาก GWM Thailand สาขานครปฐม",
    img: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245670/ch-erawan/awards/ford-advisor-award.jpg",
    brand: "GWM",
  },
  {
    title: "Mazda Dealer of Excellence 2024",
    year: "2567",
    desc: "รางวัลผู้จำหน่ายมาสด้ายอดเยี่ยมแห่งปี 2024 ภาคตะวันตก",
    img: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245659/ch-erawan/awards/deepal-top-sales-2025.jpg",
    brand: "Mazda",
  },
  {
    title: "GWM Leader Challenge 2025",
    year: "2568",
    desc: "รางวัลผู้นำยอดเยี่ยมแห่งปี 2025 จาก GWM Thailand",
    img: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245636/ch-erawan/awards/gwm-leader-challenge-2025.jpg",
    brand: "GWM",
  },
  {
    title: "Mitsubishi Skill Contest Winner",
    year: "2568",
    desc: "ผู้ชนะการแข่งขันทักษะมิตซูบิชิ 2025 ศูนย์บริการ ช.เอราวัณ",
    img: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245648/ch-erawan/awards/mitsu-president-award.jpg",
    brand: "Mitsubishi",
  },
  {
    title: "ทีมงาน ช.เอราวัณ",
    year: "2567",
    desc: "ทีมงานมืออาชีพกว่า 200 คน พร้อมให้บริการลูกค้าทุกท่านด้วยใจ",
    img: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245672/ch-erawan/team/team-photo-2.jpg",
    brand: "Team",
  },
  {
    title: "กิจกรรมเพื่อสังคม",
    year: "2565",
    desc: "ช.เอราวัณ กรุ๊ป บริจาคของช่วยเหลือผู้ประสบภัยน้ำท่วมภาคอีสาน",
    img: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245677/ch-erawan/team/team-photo-6.jpg",
    brand: "CSR",
  },
];

/**
 * Management team data
 * photoUrl: upload portrait photo to Cloudinary → https://res.cloudinary.com/n5llrdnq/image/upload/ch-erawan/team/[name].jpg
 * teamPhotoUrl: group photo of all executives together (for hero banner of team section)
 */
// Set to null to show HQ map fallback instead
const TEAM_GROUP_PHOTO_URL: string | null = "https://res.cloudinary.com/n5llrdnq/image/upload/v1780238965/ch-erawan/team/team-group.jpg";

const management = [
  {
    name: "คุณวิชัย จันทร์วาววาม",
    nickname: null,
    role: "ประธานกรรมการ",
    roleEn: "Chairman",
    desc: "ผู้บุกเบิกและขยายธุรกิจ ช.เอราวัณ สู่จังหวัดนครปฐมตั้งแต่ปี พ.ศ. 2530 ด้วยวิสัยทัศน์ที่มองเห็นโอกาสในธุรกิจยานยนต์",
    initial: "ว",
    accent: "from-red-600 to-red-800",
    photoUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780238982/ch-erawan/team/vichai.jpg",
  },
  {
    name: "คุณสุกัญญา จันทร์วาววาม",
    nickname: null,
    role: "กรรมการผู้จัดการ",
    roleEn: "Managing Director",
    desc: "ผู้ร่วมบุกเบิกธุรกิจในนครปฐม ดูแลภาพรวมการบริหารและการเงินองค์กร พร้อมสืบสานปณิธานการให้บริการที่เป็นเลิศ",
    initial: "ส",
    accent: "from-pink-600 to-pink-800",
    photoUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780238968/ch-erawan/team/sukanya.jpg",
  },
  {
    name: "คุณณัฐวุฒิ จันทร์วาววาม",
    nickname: "คุณณัฐ",
    role: "ผู้อำนวยการ IT & พัฒนาธุรกิจ",
    roleEn: "Director, IT & Business Development",
    desc: "ดูแลด้านเทคโนโลยีสารสนเทศ การพัฒนาธุรกิจดิจิทัล และวางแผนกลยุทธ์องค์กรสู่อนาคต",
    initial: "ณ",
    accent: "from-slate-700 to-slate-900",
    photoUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780238986/ch-erawan/team/nattawut.jpg",
  },
  {
    name: "คุณอรพา พงษ์วิทยภานุ",
    nickname: "คุณหยี",
    role: "ผู้อำนวยการฝ่ายขาย & บริการ",
    roleEn: "Director, Sales & After-Sales",
    desc: "ดูแลงานขาย บริการหลังการขาย และบัญชีการเงิน ด้วยประสบการณ์ยาวนานในอุตสาหกรรมยานยนต์",
    initial: "อ",
    accent: "from-rose-600 to-rose-800",
    photoUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780238979/ch-erawan/team/orepa.jpg",
  },
  {
    name: "คุณนันทวิทย์ จันทร์วาววาม",
    nickname: "คุณนันท์",
    role: "ผู้อำนวยการฝ่ายการตลาด",
    roleEn: "Director, Marketing & Strategy",
    desc: "ดูแลการตลาด สื่อดิจิทัล และวางแผนกลยุทธ์การตลาดเพื่อเสริมความแข็งแกร่งแบรนด์ในภูมิภาค",
    initial: "น",
    accent: "from-blue-600 to-blue-800",
    photoUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780238975/ch-erawan/team/nantawit.jpg",
  },
  {
    name: "คุณจันทร์จิรา จันทร์วาววาม",
    nickname: "คุณนุ้ย",
    role: "ผู้อำนวยการฝ่ายบุคคล & กฎหมาย",
    roleEn: "Director, HR & Legal",
    desc: "ดูแลงานบุคคล การสรรหาทีมงาน งานกฎหมาย และการจัดการทะเบียนประกันภัยทุกสาขา",
    initial: "จ",
    accent: "from-violet-600 to-violet-800",
    photoUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780238972/ch-erawan/team/jantjira.jpg",
  },
];

const stats = [
  { value: getYearsLabel(), label: "ปีแห่งประสบการณ์", sub: `ก่อตั้งปี ${FOUNDED_YEAR_BE}` },
  { value: "8", label: "แบรนด์รถยนต์", sub: "Mazda · Ford · Mitsubishi · GWM · Deepal · Kia · GAC · Lepas" },
  { value: "9", label: "สาขาทั่วนครปฐม", sub: "ครอบคลุมทุกพื้นที่" },
  { value: "4", label: "ศูนย์ Body & Paint", sub: "มาตรฐาน OEM" },
  { value: "13.1%", label: "ส่วนแบ่งตลาดรวม", sub: "แบรนด์ในเครือ ปี 2568" },
  { value: "#1", label: "ผู้นำภาคตะวันตก", sub: "ดีลเลอร์อันดับ 1 ในภูมิภาค" },
];

const brandCards = [
  { name: "Mazda", since: "2544", branches: "2 สาขา", highlight: "KODO Design · SKYACTIV Technology", rank: "อันดับ 15", sales: "7,769 คัน", color: "bg-red-50 border-red-100", dot: "bg-red-500", slug: "mazda" as const, comingSoon: false },
  { name: "Ford", since: "2558", branches: "1 สาขา", highlight: "Ranger · Everest · Ford Pro", rank: "อันดับ 7", sales: "20,349 คัน", color: "bg-blue-50 border-blue-100", dot: "bg-blue-600", slug: "ford" as const, comingSoon: false },
  { name: "Mitsubishi", since: "2510", branches: "1 สาขา", highlight: "Triton · Pajero Sport · PHEV", rank: "อันดับ 5", sales: "26,798 คัน", color: "bg-orange-50 border-orange-100", dot: "bg-orange-500", slug: "mitsubishi" as const, comingSoon: false },
  { name: "GWM", since: "2566", branches: "1 สาขา", highlight: "Haval H6 · ORA · Tank 300", rank: "อันดับ 8", sales: "14,264 คัน", color: "bg-amber-50 border-amber-100", dot: "bg-amber-500", slug: "gwm" as const, comingSoon: false },
  { name: "Deepal", since: "2567", branches: "1 สาขา", highlight: "EV 100% · Changan Group", rank: "อันดับ 12", sales: "8,459 คัน", color: "bg-violet-50 border-violet-100", dot: "bg-violet-500", slug: "deepal" as const, comingSoon: false },
  { name: "Kia", since: "2568", branches: "1 สาขา", highlight: "Sorento · Carnival · EV5 · EV9", rank: "อันดับ 26", sales: "1,889 คัน", color: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-600", slug: "kia" as const, comingSoon: false },
];

// GAC/Lepas aren't open yet — shown in the brand roster grid (real, honest "coming soon"
// status) but deliberately excluded from the 2568 sales-share strip below, which is real
// Thai-market registration data these two brands have zero of yet.
const upcomingBrandCards = [
  { name: "GAC", since: "2569", branches: "เร็วๆ นี้", highlight: "AION · HYPTEC · GAC MOTOR", rank: "เปิดตัว 2569", sales: "อยู่ระหว่างก่อสร้าง", color: "bg-rose-50 border-rose-100", dot: "bg-rose-600", slug: "gac" as const, comingSoon: true },
  { name: "Lepas", since: "2569", branches: "เร็วๆ นี้", highlight: "L4 · L6 · L8", rank: "เปิดตัว 2569", sales: "เตรียมเปิดตัว", color: "bg-teal-50 border-teal-100", dot: "bg-teal-600", slug: "lepas" as const, comingSoon: true },
];

const rosterCards = [...brandCards, ...upcomingBrandCards];

type Section = "history" | "brands" | "team" | "values";

const NAV_TABS = [
  { key: "history" as Section, label: "ประวัติบริษัท" },
  { key: "brands" as Section, label: "แบรนด์รถยนต์" },
  { key: "team" as Section, label: "ทีมผู้บริหาร" },
  { key: "values" as Section, label: "ค่านิยมองค์กร" },
];

function TimelineImage({ item }: { item: TimelineItem }) {
  if (!item.image) return null;
  const imageClass = item.imageClass ?? "object-cover";

  return (
    <div className="relative h-36 sm:h-40 overflow-hidden bg-slate-100">
      <Image
        src={item.image}
        alt={item.imageAlt ?? item.title}
        fill
        className={imageClass}
        sizes="(max-width: 768px) 100vw, 480px"
      />
    </div>
  );
}

export default function About() {
  const [active, setActive] = useState<Section>("history");
  const sectionRefs = useRef<Record<Section, HTMLElement | null>>({
    history: null, brands: null, team: null, values: null,
  });

  // Scroll to section when nav clicked
  const scrollTo = useCallback((key: Section) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Update active nav based on scroll position (IntersectionObserver)
  useEffect(() => {
    const OFFSET = 160; // sticky nav height + buffer
    const observers: IntersectionObserver[] = [];

    NAV_TABS.forEach(({ key }) => {
      const el = sectionRefs.current[key];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(key); },
        { rootMargin: `-${OFFSET}px 0px -60% 0px`, threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B1220] text-white">
        <div className="absolute inset-0">
          {TEAM_GROUP_PHOTO_URL ? (
            <Image
              src={TEAM_GROUP_PHOTO_URL}
              alt="ทีมบริหาร ช.เอราวัณ กรุ๊ป"
              fill
              priority
              className="object-cover object-center opacity-30"
              sizes="100vw"
            />
          ) : (
            <Image
              src={hqBranch.graphicMapUrl}
              alt={hqBranch.name}
              fill
              priority
              className="object-cover object-center opacity-25"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220] via-[#0B1220]/85 to-[#0B1220]/60" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(221,82,89,0.18) 0%, transparent 55%)",
            }}
          />
        </div>

        <div className="container relative z-10 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[#DD5259] text-xs font-bold uppercase tracking-[0.25em] mb-4">
                {`About Us · กว่า ${getYearsOfExperience()} ปี`}
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5">
                &ldquo;ช.เอราวัณ คือเพื่อนแท้
                <br />
                <span className="text-white/80">ที่พร้อมดูแลรถคุณ&rdquo;</span>
              </h1>
              <p className="text-white/55 text-base lg:text-lg leading-relaxed max-w-xl">
                ตัวแทนจำหน่ายรถยนต์ชั้นนำจ.นครปฐม ตั้งแต่ปี พ.ศ. 2510 — 8 แบรนด์ 9 สาขา
                ครอบคลุม ICE, Hybrid และ EV ด้วยทีมงานมืออาชีพกว่า 200 คน
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 mb-8">
                {[
                  { value: getYearsLabel(), label: "ปี" },
                  { value: "9", label: "สาขา" },
                  { value: "200+", label: "ทีมงาน" },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/branches">
                  <Button className="bg-[#DD5259] hover:bg-[#c9454c] text-white font-semibold">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    ดู 9 สาขา
                  </Button>
                </Link>
                <Link href="/awards">
                  <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 bg-transparent">
                    <Award className="w-4 h-4 mr-1.5" />
                    รางวัลและผลงาน
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Team photo or HQ map */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {TEAM_GROUP_PHOTO_URL ? (
                  <Image
                    src={TEAM_GROUP_PHOTO_URL}
                    alt="ทีมบริหาร ช.เอราวัณ กรุ๊ป"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 0vw, 560px"
                  />
                ) : (
                  <Image
                    src={hqBranch.graphicMapUrl}
                    alt={hqBranch.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 0vw, 560px"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {TEAM_GROUP_PHOTO_URL ? (
                    <>
                      <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Users className="w-3.5 h-3.5" />
                        ทีมผู้บริหาร
                      </div>
                      <p className="font-bold text-lg">ช.เอราวัณ กรุ๊ป</p>
                      <p className="text-white/60 text-sm mt-1">{`ตระกูลจันทร์วาววาม · ผู้บุกเบิกกว่า ${getYearsOfExperience()} ปี`}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Building2 className="w-3.5 h-3.5" />
                        สำนักงานใหญ่
                      </div>
                      <p className="font-bold text-lg">{hqBranch.name}</p>
                      <p className="text-white/60 text-sm mt-1">{hqBranch.address}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand strip */}
      <section className="bg-white border-b border-gray-100">
        <div className="container py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2">
            {BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                href={brand.hubPath}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] px-2 transition-all group"
              >
                <BrandLogo
                  src={brand.logoPath}
                  alt={brand.displayName}
                  brandSlug={brand.slug}
                  size="md"
                  scale={STRIP_LOGO_SCALE[brand.slug]}
                  className="grayscale opacity-45 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-100">
            {stats.map((s) => (
              <div key={s.label} className="py-6 px-4 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#0F172A]">{s.value}</div>
                <div className="text-xs font-semibold text-gray-600 mt-1">{s.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-tight">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky scroll-nav */}
      <div className="sticky top-[68px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container">
          <div className="flex overflow-x-auto scrollbar-none">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => scrollTo(tab.key)}
                className={`shrink-0 px-5 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  active === tab.key
                    ? "border-[#DD5259] text-[#0F172A]"
                    : "border-transparent text-gray-400 hover:text-[#0F172A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── All sections scroll continuously ── */}
      <div className="container py-12 lg:py-16 space-y-24">
        {/* HISTORY */}
        <section id="history" className="scroll-mt-[140px]" ref={(el) => { sectionRefs.current.history = el; }}>
          <div>
            <div className="max-w-3xl mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-4">ประวัติความเป็นมา</h2>
              <p className="text-gray-500 leading-relaxed">
                &ldquo;ช.เอราวัณ&rdquo; ชื่ออันคุ้นหูของคนแถบตะวันตกมาเป็นเวลายาวนาน หากย้อนไปเมื่อปี พ.ศ. 2510
                นายชัยพงศ์ จันทร์วาววาม คุณปู่ของตระกูลจันทร์วาววาม ได้เล็งเห็นถึงช่องทางและโอกาสในการทำธุรกิจรถยนต์
                ท่านได้ริเริ่มร้านอะไหล่เล็กๆ และขยายกิจการจนกลายเป็นกลุ่มดีลเลอร์ชั้นนำในภาคตะวันตกในปัจจุบัน
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#DD5259] via-[#0F172A] to-gray-200" />
              <div className="space-y-8">
                {timeline.map((item, i) => (
                  <div
                    key={item.year}
                    className={`relative flex gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                  >
                    <div className={`pl-16 md:pl-0 flex-1 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                        <TimelineImage item={item} />
                        <div className="p-5">
                          <div className={`flex items-center gap-2 mb-2 flex-wrap ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                            <span className="text-2xl font-bold text-[#0F172A]">{item.year}</span>
                            <span className="px-2.5 py-0.5 bg-[#DD5259]/10 text-[#DD5259] text-xs rounded-full font-medium">
                              {item.milestone}
                            </span>
                          </div>
                          <h3 className="font-bold text-[#0F172A] mb-1.5">{item.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-6 md:left-1/2 top-8 w-4 h-4 rounded-full bg-[#DD5259] border-4 border-white shadow-md -translate-x-1/2 z-10" />
                    <div className="hidden md:block flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BRANDS */}
        <section id="brands" className="scroll-mt-[140px]" ref={(el) => { sectionRefs.current.brands = el; }}>
          <div>
            <div className="max-w-3xl mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">แบรนด์รถยนต์ในเครือ</h2>
              <p className="text-gray-500 leading-relaxed">
                ช.เอราวัณ กรุ๊ป เป็นตัวแทนจำหน่ายอย่างเป็นทางการของ 8 แบรนด์ชั้นนำ
                ครอบคลุมทุกกลุ่มรถยนต์ตั้งแต่ ICE, Hybrid ไปจนถึง EV เต็มรูปแบบ
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rosterCards.map((b) => {
                const brandConfig = BRANDS.find((br) => br.slug === b.slug)!;
                const heroImage = BRAND_IMAGES[b.name] ?? BRAND_IMAGES.default;

                return (
                  <Link
                    key={b.name}
                    href={brandConfig.hubPath}
                    className={`group rounded-2xl border overflow-hidden hover:shadow-lg transition-all ${b.color}`}
                  >
                    <div className="relative h-32 overflow-hidden bg-slate-900">
                      <Image
                        src={heroImage}
                        alt={b.name}
                        fill
                        className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <BrandLogo
                          src={brandConfig.logoPath}
                          alt={b.name}
                          brandSlug={b.slug}
                          size="sm"
                          white
                          nativeOnDark={brandConfig.logoOnDark === "native"}
                        />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${b.dot}`} />
                            <h3 className="text-lg font-bold text-[#0F172A]">{b.name}</h3>
                          </div>
                          <p className="text-xs text-gray-400">ตัวแทนจำหน่ายตั้งแต่ปี {b.since}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-500">{b.rank}</div>
                          <div className="text-xs text-gray-400">{b.comingSoon ? "สถานะ" : "ตลาดไทย"}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-4 italic">{b.highlight}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-black/5">
                        <div>
                          <div className="text-xs text-gray-400">{b.comingSoon ? "สถานะโชว์รูม" : "ยอดจดทะเบียน 2568"}</div>
                          <div className="text-sm font-bold text-[#0F172A]">{b.sales}</div>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-[#0F172A] group-hover:text-[#DD5259] transition-colors">
                          {b.branches}
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 bg-[#0F172A] rounded-2xl p-6 lg:p-8 text-white">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#DD5259]" />
                <h3 className="font-bold">ส่วนแบ่งตลาดรวมแบรนด์ในเครือ ปี 2568</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {brandCards.map((b) => (
                  <div key={b.name} className="text-center">
                    <div className="text-base font-bold text-white">{b.sales.replace(" คัน", "")}</div>
                    <div className="text-xs text-white/50 mt-0.5">{b.name}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-white/50 text-sm">รวมทั้งหมด (ตลาดไทย 604,755 คัน)</span>
                <span className="text-white font-bold text-lg">79,528 คัน · 13.1%</span>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section id="team" className="scroll-mt-[140px]" ref={(el) => { sectionRefs.current.team = el; }}>
          <div className="space-y-12">
            {/* ── Section header ── */}
            <div className="max-w-3xl">
              <p className="text-[#DD5259] text-xs font-bold uppercase tracking-[0.25em] mb-2">Our Team</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">ทีมผู้บริหาร</h2>
              <p className="text-gray-500 leading-relaxed text-base">
                {`ช.เอราวัณ กรุ๊ป บริหารงานโดยทีมผู้บริหารที่มีความเชี่ยวชาญและประสบการณ์ยาวนานกว่า ${getYearsOfExperience()} ปี`}
                ภายใต้การนำของตระกูลจันทร์วาววาม ที่สืบทอดปณิธานการให้บริการที่เป็นเลิศแก่ลูกค้าทุกท่าน
              </p>
            </div>

            {/* ── Dealer Coverage Map Banner ── */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0B1220]"
              style={{ minHeight: "280px" }}>
              <CoverageMap />
              {/* left-side fade keeps the Thai text readable over the map */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220] via-[#0B1220]/75 to-transparent" />
              <div className="relative z-10 flex items-center p-8 lg:p-12 min-h-[280px]">
                <div className="max-w-lg">
                  <p className="text-[#DD5259] text-xs font-bold uppercase tracking-widest mb-3">Dealer Coverage</p>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    ครอบคลุมฝั่งตะวันตก<br className="hidden sm:block" />กรุงเทพฯ &amp; นครปฐม
                  </h3>
                  <p className="text-white/60 leading-relaxed mb-5">
                    {`ตระกูลจันทร์วาววาม ผู้บุกเบิกธุรกิจยานยนต์นครปฐมกว่า ${getYearsOfExperience()} ปี`}
                    ด้วยเครือข่ายดีลเลอร์ครบ 8 แบรนด์ 9 สาขา ดูแลลูกค้าทั่วโซนนครปฐม–ศาลายา–สามพราน–อ้อมใหญ่
                  </p>
                  <div className="flex flex-wrap gap-5">
                    {[
                      { value: "9", label: "สาขาในเครือ" },
                      { value: "8", label: "แบรนด์ชั้นนำ" },
                      { value: getYearsLabel(), label: "ปีแห่งประสบการณ์" },
                      { value: "200+", label: "ทีมงานทั่วสาขา" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-2xl font-bold text-white">{s.value}</p>
                        <p className="text-white/50 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Management Profile Cards ── */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-6">คณะผู้บริหาร</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {management.map((person) => (
                  <div
                    key={person.name}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Photo area */}
                    <div className={`relative aspect-[3/4] bg-gradient-to-br ${person.accent} overflow-hidden`}>
                      {person.photoUrl ? (
                        <Image
                          src={person.photoUrl}
                          alt={person.name}
                          fill
                          className="object-cover object-[center_15%] group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center">
                            <span className="text-white font-bold text-4xl">{person.initial}</span>
                          </div>
                          <p className="text-white/40 text-[10px] italic">รอรูปโปรไฟล์</p>
                        </div>
                      )}
                      {/* Role badge */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                          {person.roleEn}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h3 className="font-bold text-[#0F172A] text-base leading-snug">{person.name}</h3>
                      {person.nickname && (
                        <p className="text-gray-400 text-sm mt-0.5">{person.nickname}</p>
                      )}
                      <p className="text-[#DD5259] text-xs font-semibold mt-1.5 mb-3 uppercase tracking-wide">
                        {person.role}
                      </p>
                      <p className="text-gray-500 text-sm leading-relaxed">{person.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Full staff banner ── */}
            <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "200px" }}>
              <Image
                src="https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245672/ch-erawan/team/team-photo-2.jpg"
                alt="ทีมงาน ช.เอราวัณ กรุ๊ป"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/90 via-[#0B1220]/60 to-[#0B1220]/20" />
              <div className="relative z-10 flex items-center p-8 lg:p-12 min-h-[200px]">
                <div className="max-w-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-[#DD5259]" />
                    <p className="text-[#DD5259] text-xs font-bold uppercase tracking-wider">ทีมงานทั้งหมด</p>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
                    ทีมงานมืออาชีพกว่า 200 คน
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    ฝ่ายขาย · ศูนย์บริการ · Body & Paint · อะไหล่ · ประกันภัย
                    พร้อมดูแลลูกค้าทุกท่านด้วยใจ ทุกวัน 8:00–17:00 น.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section id="values" className="scroll-mt-[140px]" ref={(el) => { sectionRefs.current.values = el; }}>
          <div>
            <div className="max-w-3xl mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">วิสัยทัศน์และค่านิยมองค์กร</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-10">
              <div className="bg-[#0F172A] text-white rounded-2xl p-8">
                <div className="text-white/65 text-sm font-semibold uppercase tracking-wider mb-3">
                  วิสัยทัศน์ (Vision)
                </div>
                <p className="text-white/80 leading-relaxed">
                  เป็นผู้นำในธุรกิจค้าปลีกรถยนต์ในภูมิภาคตะวันตก โดยมุ่งสร้างความพึงพอใจสูงสุดให้แก่ลูกค้า
                  ผ่านผลิตภัณฑ์และบริการที่มีคุณภาพ
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white font-bold text-lg">&ldquo;เพื่อนแท้ พร้อมดูแลรถคุณ&rdquo;</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <div className="text-[#0F172A] text-sm font-semibold uppercase tracking-wider mb-3">
                  พันธกิจ (Mission)
                </div>
                <ul className="space-y-3">
                  {[
                    "ส่งมอบรถยนต์และบริการที่เป็นเลิศเพื่อตอบสนองความต้องการของลูกค้า",
                    "พัฒนาบุคลากรให้มีความรู้ความสามารถและใจรักบริการ",
                    "สร้างความสัมพันธ์ที่ยั่งยืนกับคู่ค้าและพันธมิตรทางธุรกิจ",
                    "ดำเนินธุรกิจด้วยความรับผิดชอบต่อสังคมและสิ่งแวดล้อม",
                  ].map((m) => (
                    <li key={m} className="flex items-start gap-2.5 text-sm text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DD5259] mt-1.5 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {coreValues.map((v) => (
                <div
                  key={v.title}
                  className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#DD5259]/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-7 h-7 text-[#DD5259]" />
                  </div>
                  <h3 className="font-bold text-[#0F172A] mb-0.5">{v.title}</h3>
                  <p className="text-gray-400 text-xs font-medium mb-3">{v.sub}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-[#DD5259]" />
                  <h3 className="font-bold text-[#0F172A] text-xl">รางวัลและกิจกรรม</h3>
                </div>
                <Link
                  href="/awards"
                  className="text-sm font-semibold text-[#DD5259] hover:text-[#c9454c] flex items-center gap-1"
                >
                  ดูทั้งหมด
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {awards.map((award) => (
                  <div
                    key={award.title}
                    className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]"
                  >
                    <Image
                      src={award.img}
                      alt={award.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 400px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-[#0F172A]/80 backdrop-blur text-white text-xs rounded-full font-medium">
                        {award.brand} · {award.year}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-white font-bold text-sm leading-snug">{award.title}</h4>
                      <p className="text-white/70 text-xs mt-1 leading-relaxed line-clamp-2">{award.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CTA */}
      <section className="bg-[#0B1220] text-white py-16 lg:py-20 mt-4">
        <div className="container text-center">
          <p className="text-[#DD5259] text-xs font-bold uppercase tracking-[0.2em] mb-3">Get Started</p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-3">พร้อมให้บริการคุณทุกวัน</h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto">
            ไม่ว่าจะเป็นการซื้อรถใหม่ บริการซ่อมบำรุง หรือประกันภัย ช.เอราวัณ กรุ๊ป พร้อมดูแลคุณ
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/cars">
              <Button className="bg-[#DD5259] hover:bg-[#c9454c] text-white font-semibold">
                ดูรถยนต์ทั้งหมด
              </Button>
            </Link>
            <Link href="/booking">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                จองนัดหมาย
              </Button>
            </Link>
            <Link href="/branches">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                <MapPin className="w-4 h-4 mr-1.5" />
                ค้นหาสาขา
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
