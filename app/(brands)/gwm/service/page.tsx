import Link from "next/link";
import { Suspense } from "react";
import BrandServiceContent from "@/components/brands/BrandServiceContent";
import BrandHero from "@/components/BrandHero";
import BrandSubNav from "@/components/brands/BrandSubNav";
import { BRAND_BY_SLUG } from "@/lib/brandConfig";
import { getBranchesByBrand } from "@/lib/branchData";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import {
  MapPin, Phone, Clock, MessageCircle, Wrench, ChevronRight,
  Wifi, Car, Sofa, Smartphone, ShieldCheck,
  Zap, Thermometer, RefreshCw, Key, Wind, Gauge, TriangleAlert,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "ศูนย์บริการ GWM — ช.เอราวัณ กรุ๊ป",
  description:
    "ศูนย์บริการ GWM มาตรฐานโรงงาน ครบทุกบริการ — EV/HEV, แบตเตอรี่, ยาง, เฟิร์มแวร์, ฉุกเฉิน พร้อม Delivery & Pickup ที่ ช.เอราวัณ จ.นครปฐม",
  path: "/gwm/service",
});

const serviceCategories = [
  {
    id: "general",
    label: "บริการมาตรฐาน",
    accent: "#0F172A",
    bg: "from-[#0F172A] to-[#1a3a6b]",
    services: [
      { icon: Wrench,       title: "ศูนย์บริการมาตรฐาน GWM",     desc: "ช่างผ่านการอบรมจาก GWM Motor Thailand ทุกคน" },
      { icon: ShieldCheck,  title: "เคลมประกัน / รับประกัน",      desc: "ดำเนินการเคลมทุกบริษัท ครอบคลุมการรับประกันโรงงาน" },
      { icon: Key,          title: "งานกุญแจ",                      desc: "ตัดกุญแจ โปรแกรม Smart Key เปลี่ยนกุญแจสำรอง" },
      { icon: Wind,         title: "ระบบแอร์ / Recycle น้ำยา",    desc: "ล้างแอร์ เปลี่ยนไส้กรอง Recycle น้ำยาแอร์ F-gas" },
      { icon: CheckCircle2, title: "อะไหล่แท้ GWM",               desc: "สต็อกอะไหล่แท้ครบทุกรุ่น ส่งรวดเร็ว" },
      { icon: Gauge,        title: "ตรวจเช็คราคาก่อนซ่อม",         desc: "ประเมินราคาโปร่งใสก่อนลงมือ ลูกค้าอนุมัติทุกครั้ง" },
    ],
  },
  {
    id: "ev",
    label: "EV & HEV เฉพาะทาง",
    accent: "#C8102E",
    bg: "from-[#7f1d1d] to-[#C8102E]",
    services: [
      { icon: Zap,         title: "EV & HEV Service",               desc: "วิศวกรเฉพาะทางระบบไฟฟ้าและไฮบริด เครื่องมือครบมาตรฐาน" },
      { icon: Gauge,       title: "วัดคุณภาพแบตเตอรี่ (SOH)",       desc: "ทดสอบ State of Health รายงานผลแม่นยำ" },
      { icon: Thermometer, title: "ระบบหล่อเย็นแบตเตอรี่",          desc: "ตรวจสอบ Thermal Management ป้องกัน Battery Degradation" },
      { icon: RefreshCw,   title: "Firmware & Software Update",     desc: "OTA & Firmware อย่างเป็นทางการ ทุกรุ่น HAVAL / ORA / TANK" },
      { icon: Zap,         title: "EV Charging Station",            desc: "AC Type 2 ฟรีสำหรับลูกค้าศูนย์ระหว่างรอเซอร์วิส" },
    ],
  },
  {
    id: "tires",
    label: "บริการยางและล้อ",
    accent: "#374151",
    bg: "from-[#1f2937] to-[#374151]",
    services: [
      { icon: RefreshCw,   title: "เปลี่ยนยาง",                     desc: "ยางทุกแบรนด์ พร้อมคำแนะนำให้เหมาะกับรุ่นและการใช้งาน" },
      { icon: Gauge,       title: "ตั้งศูนย์ล้อ 3D (Alignment)",   desc: "เครื่องแม่นยำสูง ลดสึกของยาง เพิ่มความปลอดภัย" },
      { icon: Gauge,       title: "ถ่วงล้อ (Balancing)",            desc: "ถ่วงน้ำหนักทุกเส้น ลดสั่น ขับนุ่มขึ้น" },
      { icon: RefreshCw,   title: "สลับยาง (Rotation)",             desc: "ยืดอายุยางได้สูงสุดตามรอบระยะทาง" },
      { icon: CheckCircle2,title: "ปะยาง (Plug & Patch)",           desc: "ปะแบบถอดแกนภายใน มาตรฐาน ปลอดภัย" },
    ],
  },
  {
    id: "emergency",
    label: "บริการฉุกเฉิน",
    accent: "#B45309",
    bg: "from-[#78350f] to-[#B45309]",
    services: [
      { icon: TriangleAlert, title: "รถสไลด์ / รถลาก",              desc: "พร้อมออกรับครอบคลุม จ.นครปฐมและใกล้เคียง" },
      { icon: Phone,         title: "ช่วยเหลือฉุกเฉิน 24 ชม.",      desc: "Roadside Assistance ตอบรับตลอด 24 ชม. ทุกวัน" },
    ],
  },
];

const customerExperience = [
  { icon: Car,          title: "Delivery & Pickup",        desc: "รับ-ส่งรถถึงบ้าน ไม่เสียเวลาเดินทาง" },
  { icon: Sofa,         title: "Customer Lounge",          desc: "ห้องรอสบาย แอร์เย็น เครื่องดื่มฟรี" },
  { icon: Wifi,         title: "Free WiFi",                desc: "WiFi ความเร็วสูงตลอดเวลาที่รอ" },
  { icon: Gauge,        title: "ประเมินราคาก่อนซ่อม",      desc: "แจ้งราคาโปร่งใส ลูกค้าอนุมัติก่อนทุกครั้ง" },
  { icon: ShieldCheck,  title: "ช่างผ่านการรับรอง GWM",   desc: "อบรมและรับรองโดย GWM Motor Thailand" },
  { icon: Smartphone,   title: "จองผ่านแอป GWM",          desc: "นัดหมายผ่าน GWM Thailand App ตลอด 24 ชม." },
];

export default function GwmServicePage() {
  const brand = BRAND_BY_SLUG.gwm;
  const gwmBranches = getBranchesByBrand("GWM");

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: "GWM", path: "/gwm" },
    { name: "ศูนย์บริการ", path: "/gwm/service" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <div className="min-h-screen bg-[#F8FAFC] pt-[64px]">
        <BrandHero
          brand={brand}
          breadcrumbs={breadcrumbs}
          primaryCta={{ label: "นัดบริการ", href: "/booking?type=service&brand=GWM" }}
          secondaryCta={{ label: "ดูรถ GWM", href: "/gwm" }}
          footer={
            <p className="text-white/75 text-sm">
              ศูนย์บริการมาตรฐาน GWM • EV & HEV • ยางและล้อ • บริการฉุกเฉิน
            </p>
          }
        />

        <BrandSubNav brand={brand} currentSection="service" scrollPastHero />

        {/* ── Stats ── */}
        <section className="bg-[#0F172A] py-10">
          <div className="container grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
            {[
              { num: "GWM", sub: "Certified", label: "ช่างผ่านการรับรอง" },
              { num: "4",   sub: "กลุ่ม",     label: "หมวดบริการครบ" },
              { num: "24",  sub: "ชม.",        label: "บริการฉุกเฉิน" },
              { num: "Free",sub: "",           label: "Delivery & Lounge" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl lg:text-3xl font-black text-[#C8102E]">
                  {s.num}<span className="text-base font-medium text-white/60 ml-1">{s.sub}</span>
                </div>
                <div className="mt-1 text-sm text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ประสบการณ์ลูกค้า ── */}
        <section className="container py-14">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">ประสบการณ์ลูกค้า</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">บริการเหนือระดับ ดูแลทุกขั้นตอน</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {customerExperience.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#0F172A]/20 transition-all group overflow-hidden"
              >
                {/* Accent corner */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-[#0F172A]/5 rounded-bl-2xl group-hover:bg-[#0F172A]/10 transition-colors" />
                <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center mb-3 shadow-md">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#0F172A] text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Service Categories ── */}
        <section className="py-14 bg-gray-50">
          <div className="container">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">งานบริการ</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">บริการทั้งหมดที่รองรับ</h2>
            </div>

            <div className="space-y-6">
              {serviceCategories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Category header */}
                  <div className={`bg-gradient-to-r ${cat.bg} px-6 py-4 flex items-center gap-3`}>
                    <div className="w-2 h-6 bg-white/40 rounded-full" />
                    <h3 className="text-white font-bold text-lg">{cat.label}</h3>
                    <span className="ml-auto text-white/50 text-sm">{cat.services.length} บริการ</span>
                  </div>

                  {/* Service grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
                    {cat.services.map(({ icon: Icon, title, desc }, idx) => (
                      <div
                        key={title}
                        className={`flex gap-3 p-5 hover:bg-gray-50 transition-colors ${
                          idx >= 3 ? "border-t border-gray-50" : ""
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${cat.accent}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: cat.accent }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0F172A] text-sm leading-snug mb-1">{title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── สาขา ── */}
        <section className="bg-[#0F172A] py-14">
          <div className="container">
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">ที่ตั้ง</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">ศูนย์บริการ GWM ช.เอราวัณ</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {gwmBranches.map((branch) => (
                <div key={branch.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-7 hover:bg-white/8 transition-colors">
                  <h3 className="text-lg font-bold text-white mb-4">{branch.name}</h3>
                  <div className="space-y-2.5 text-sm text-white/65 mb-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-[#C8102E] shrink-0" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#C8102E] shrink-0" />
                      <a href={`tel:${branch.phone}`} className="hover:text-white transition-colors">{branch.phone}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[#C8102E] shrink-0" />
                      <span>{branch.hours}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {branch.services.map((svc) => (
                      <span key={svc} className="bg-white/10 text-white/75 text-xs px-2.5 py-1 rounded-full">
                        {svc}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/booking?type=service&branch=${branch.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-[#C8102E] hover:bg-[#a00d25] text-white border-0">
                        นัดบริการ
                      </Button>
                    </Link>
                    <a href={branch.lineUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full border-white/20 text-white bg-transparent hover:bg-white/10">
                        <MessageCircle className="w-4 h-4 mr-1.5" />LINE
                      </Button>
                    </a>
                  </div>
                  {branch.lat && branch.lng && (
                    <div className="mt-4 rounded-xl overflow-hidden h-44">
                      <iframe src={`https://maps.google.com/maps?q=${branch.lat},${branch.lng}&z=16&output=embed&hl=th`} width="100%" height="100%" loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade" title={`แผนที่ ${branch.name}`}
                        className="border-0 w-full h-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notion CMS content */}
        <Suspense fallback={null}>
          <BrandServiceContent brand="GWM" page="service" />
        </Suspense>

        {/* ── CTA ── */}
        <section className="container py-14 text-center">
          <h3 className="text-xl font-bold text-[#0F172A] mb-2">พร้อมดูแลรถ GWM ของคุณ</h3>
          <p className="text-gray-500 mb-7 text-sm max-w-md mx-auto">
            นัดหมายล่วงหน้า รับสิทธิ์ Delivery & Pickup ฟรี พร้อม Customer Lounge และ Free WiFi
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/booking?type=service&brand=GWM">
              <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-6">
                <Wrench className="w-4 h-4 mr-2" />
                นัดบริการออนไลน์
              </Button>
            </Link>
            <Link href="/gwm/one-stop">
              <Button variant="outline" className="px-6">
                One Stop Service
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
