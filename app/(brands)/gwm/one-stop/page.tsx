import Link from "next/link";
import BrandHero from "@/components/BrandHero";
import BrandSubNav from "@/components/brands/BrandSubNav";
import { BRAND_BY_SLUG } from "@/lib/brandConfig";
import { getBranchesByBrand } from "@/lib/branchData";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "One Stop Service GWM — ช.เอราวัณ กรุ๊ป",
  description:
    "บริการ One Stop Service ครบวงจร สำหรับรถ GWM — ซื้อ, เซอร์วิส, ซ่อมสี, ประกัน ที่เดียวจบ ที่ ช.เอราวัณ นครปฐม",
  path: "/gwm/one-stop",
});

const oneStopServices = [
  {
    icon: "🚗",
    title: "ขาย",
    items: ["รถ GWM ใหม่ทุกรุ่น", "รถ HAVAL, ORA, TANK", "ทดลองขับฟรี", "จัดไฟแนนซ์ครบวงจร"],
  },
  {
    icon: "🔧",
    title: "เซอร์วิส",
    items: ["ศูนย์บริการมาตรฐาน GWM", "บริการตามระยะ", "ช่างเฉพาะทาง EV/HEV", "อะไหล่แท้ GWM"],
  },
  {
    icon: "🎨",
    title: "ซ่อมสี/ตัวถัง",
    items: ["สีตรงรหัสโรงงาน", "ห้องพ่นสีมาตรฐาน", "รับประกัน 1 ปี", "เคลมประกันได้"],
  },
  {
    icon: "🛡️",
    title: "ประกันภัย",
    items: ["ประกันชั้น 1-3", "ต่อประกันรถยนต์", "เคลมสินไหมรวดเร็ว", "ทีมที่ปรึกษาประกัน"],
  },
  {
    icon: "⚡",
    title: "EV Services",
    items: ["EV Charging Station", "ตรวจแบตเตอรี่ EV ฟรี", "ORA Exclusive Service", "Software Update"],
  },
  {
    icon: "💰",
    title: "การเงิน",
    items: ["จัดไฟแนนซ์ทุกสถาบัน", "อนุมัติรวดเร็ว", "ดอกเบี้ยพิเศษ", "รับแลกเปลี่ยนรถเก่า"],
  },
];

const steps = [
  { num: "01", title: "นัดหมายล่วงหน้า", desc: "โทรหรือนัดออนไลน์ — บอกความต้องการ เราเตรียมพร้อมให้" },
  { num: "02", title: "รับรถที่ศูนย์", desc: "ผู้เชี่ยวชาญรอต้อนรับ พร้อมที่นั่งรอและ WiFi ฟรี" },
  { num: "03", title: "ดำเนินงานครบจบ", desc: "ทำทุกอย่างในวันเดียว — เซอร์วิส, ซ่อม, ต่อประกัน" },
  { num: "04", title: "ส่งมอบรถพร้อมใช้", desc: "ตรวจสอบคุณภาพทุกขั้นตอน ก่อนส่งมอบรถคืน" },
];

export default function GwmOneStopPage() {
  const brand = BRAND_BY_SLUG.gwm;
  const gwmBranches = getBranchesByBrand("GWM");

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: "GWM", path: "/gwm" },
    { name: "One Stop Service", path: "/gwm/one-stop" },
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
          primaryCta={{ label: "นัดหมาย One Stop", href: "/booking?brand=GWM" }}
          secondaryCta={{ label: "ดูรถ GWM", href: "/gwm" }}
          footer={
            <p className="text-white/75 text-sm">
              ซื้อ • เซอร์วิส • ซ่อมสี • ประกัน — ที่เดียวจบ
            </p>
          }
        />

        <BrandSubNav brand={brand} currentSection="one-stop" scrollPastHero />

        {/* Tagline */}
        <section className="bg-[#0C1C3E] py-10">
          <div className="container text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              One Stop Service GWM
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              ทุกความต้องการสำหรับรถ GWM ของคุณ — ครบ จบ ที่ ช.เอราวัณ กรุ๊ป
            </p>
          </div>
        </section>

        {/* 6 บริการ */}
        <section className="container py-12 lg:py-16">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">ครบทุกความต้องการ</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">บริการทั้งหมดในที่เดียว</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {oneStopServices.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-3">{s.title}</h3>
                <ul className="space-y-1.5">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C8102E] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ขั้นตอน */}
        <section className="bg-gray-50 py-12 lg:py-16">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#0F172A]">ขั้นตอนการใช้บริการ</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {steps.map((s) => (
                <div key={s.num} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-[#0C1C3E] text-white text-xl font-black flex items-center justify-center mx-auto mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-semibold text-[#0F172A] mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* สาขา */}
        {gwmBranches.length > 0 && (
          <section className="container py-12">
            <h3 className="text-xl font-bold text-[#0F172A] mb-6">สาขาที่ให้บริการ</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {gwmBranches.map((b) => (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#0C1C3E] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">GWM</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0F172A] text-sm">{b.shortName}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{b.address}</div>
                    <a href={`tel:${b.phone}`} className="text-xs text-[#C8102E] hover:underline mt-1 block">
                      {b.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-[#0C1C3E] py-12">
          <div className="container text-center">
            <h3 className="text-2xl font-bold text-white mb-3">เริ่มต้นง่ายๆ — นัดหมายออนไลน์</h3>
            <p className="text-white/60 mb-6">ทีมงานพร้อมดูแลคุณตั้งแต่ต้นจนจบ</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/booking?brand=GWM">
                <Button className="bg-[#C8102E] hover:bg-[#a00d25] text-white border-0">
                  นัดหมาย One Stop Service
                </Button>
              </Link>
              <Link href="/gwm/service">
                <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                  ข้อมูลศูนย์บริการ
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
