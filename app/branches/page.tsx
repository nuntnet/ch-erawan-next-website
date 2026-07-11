"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Car, Wrench, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary";
import { branches as branchData, type Branch } from "@/lib/branchData";

/** UI-only extras not stored in canonical branch data */
const branchUiExtras: Record<string, { nearby?: string[]; note?: string }> = {
  "deepal-salaya": {
    note: "ตั้งอยู่ติดกับ Mazda ช.เอราวัณ ศาลายา บนที่ดินเดียวกัน",
    nearby: ["ติดกับ Mazda ศาลายา", "Lotus's Salaya (0.3 กม.)", "ถ.พุทธมณฑลสาย 5"],
  },
  "gwm-nakhonpathom": {
    note: "ตั้งอยู่บนถนนเพชรเกษม ใกล้กับ Mazda ช.เอราวัณ นครปฐม",
    nearby: ["ถ.เพชรเกษม ต.ธรรมศาลา", "ติดกับ Mazda ช.เอราวัณ นครปฐม"],
  },
};

type BranchDisplay = Branch & { nearby?: string[]; note?: string };

const branches: BranchDisplay[] = branchData.map((branch) => ({
  ...branch,
  ...branchUiExtras[branch.id],
}));

const brandColors: Record<string, { bg: string; text: string; dot: string }> = {
  "Mazda":      { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500" },
  "Ford":       { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-600" },
  "Mitsubishi": { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-600" },
  "GWM":        { bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-500" },
  "Deepal":     { bg: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-500" },
  "Kia":        { bg: "bg-green-50",   text: "text-green-700",  dot: "bg-green-600" },
  "GAC":        { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-600" },
  "Lepas":      { bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-600" },
};

const serviceMenuByBrand: Record<string, { category: string; items: string[] }[]> = {
  "Mazda": [
    { category: "บริการตรวจเช็ค", items: ["ตรวจเช็คตามระยะ Mazda Service Schedule", "ตรวจเช็คก่อนเดินทาง (Pre-Trip Check)", "ตรวจเช็คระบบ SKYACTIV"] },
    { category: "บริการซ่อมบำรุง", items: ["เปลี่ยนถ่ายน้ำมันเครื่อง", "เปลี่ยนไส้กรองอากาศ/น้ำมัน", "ซ่อมระบบเบรค", "ซ่อมระบบช่วงล่าง", "ซ่อมระบบไฟฟ้า"] },
    { category: "ศูนย์ล้อและยาง", items: ["ถ่วงล้อ (Wheel Balancing)", "ตั้งศูนย์ล้อ (Wheel Alignment)", "เปลี่ยนยาง", "สลับยาง (Tyre Rotation)", "เจียรจานเบรค"] },
    { category: "Body & Paint", items: ["ซ่อมตัวถังจากอุบัติเหตุ", "พ่นสีมาตรฐาน OEM", "ซ่อมรอยขีดข่วน/บุบ", "เคลือบแก้ว/เซรามิก", "บริการประกันภัย"] },
  ],
  "Ford": [
    { category: "บริการตรวจเช็ค", items: ["ตรวจเช็คตามระยะ Ford Service Schedule", "Ford Pro Service (Commercial)", "ตรวจเช็คระบบ EcoBoost"] },
    { category: "บริการซ่อมบำรุง", items: ["เปลี่ยนถ่ายน้ำมันเครื่อง", "ซ่อมระบบเกียร์อัตโนมัติ", "ซ่อมระบบ 4WD", "ซ่อมระบบเบรค ABS", "ซ่อมระบบช่วงล่าง"] },
    { category: "ศูนย์ล้อและยาง", items: ["ถ่วงล้อ", "ตั้งศูนย์ล้อ", "เปลี่ยนยาง", "สลับยาง", "เจียรจานเบรค"] },
    { category: "Body & Paint", items: ["ซ่อมตัวถังจากอุบัติเหตุ", "พ่นสีมาตรฐาน OEM", "ซ่อมรอยขีดข่วน/บุบ", "เคลือบแก้ว/เซรามิก", "บริการประกันภัย"] },
  ],
  "Mitsubishi": [
    { category: "บริการตรวจเช็ค", items: ["ตรวจเช็คตามระยะ Mitsubishi Service Schedule", "PHEV Battery Check", "ตรวจเช็คระบบ 4WD Super Select"] },
    { category: "บริการซ่อมบำรุง", items: ["เปลี่ยนถ่ายน้ำมันเครื่อง", "ซ่อมระบบ PHEV", "ซ่อมระบบเกียร์", "ซ่อมระบบช่วงล่าง", "ซ่อมระบบไฟฟ้า"] },
    { category: "ศูนย์ล้อและยาง", items: ["ถ่วงล้อ", "ตั้งศูนย์ล้อ", "เปลี่ยนยาง", "สลับยาง", "เจียรจานเบรค"] },
    { category: "Body & Paint", items: ["ซ่อมตัวถังจากอุบัติเหตุ", "พ่นสีมาตรฐาน OEM", "ซ่อมรอยขีดข่วน/บุบ", "เคลือบแก้ว/เซรามิก", "บริการประกันภัย"] },
  ],
  "GWM": [
    { category: "บริการตรวจเช็ค", items: ["ตรวจเช็คตามระยะ GWM Service Schedule", "EV/Hybrid Battery Check", "ตรวจเช็คระบบ ADAS"] },
    { category: "บริการซ่อมบำรุง", items: ["เปลี่ยนถ่ายน้ำมันเครื่อง", "ซ่อมระบบ EV/Hybrid", "ซ่อมระบบช่วงล่าง", "ซ่อมระบบไฟฟ้า", "อัปเดต Software OTA"] },
    { category: "EV Charging", items: ["EV Charging Station (AC/DC)", "บริการตรวจสอบแบตเตอรี่ EV"] },
    { category: "Body & Paint", items: ["ซ่อมตัวถังจากอุบัติเหตุ", "พ่นสีมาตรฐาน OEM", "ซ่อมรอยขีดข่วน/บุบ", "บริการประกันภัย"] },
  ],
  "Deepal": [
    { category: "EV Service", items: ["ตรวจเช็คตามระยะ Deepal EV Schedule", "EV Battery Health Check", "อัปเดต Software OTA", "ตรวจเช็คระบบ ADAS"] },
    { category: "EV Charging", items: ["EV Fast Charging (DC)", "EV Normal Charging (AC)", "บริการตรวจสอบแบตเตอรี่"] },
    { category: "Body & Paint", items: ["ซ่อมตัวถังจากอุบัติเหตุ", "พ่นสีมาตรฐาน OEM", "ซ่อมรอยขีดข่วน/บุบ", "บริการประกันภัย"] },
  ],
  "Kia": [
    { category: "บริการตรวจเช็ค", items: ["ตรวจเช็คตามระยะ Kia Service Schedule", "EV Battery Check", "Kia Warranty Check (7 ปี / 200,000 กม.)"] },
    { category: "บริการซ่อมบำรุง", items: ["เปลี่ยนถ่ายน้ำมันเครื่อง", "ซ่อมระบบ EV", "ซ่อมระบบช่วงล่าง", "ซ่อมระบบไฟฟ้า"] },
    { category: "ศูนย์ล้อและยาง", items: ["ถ่วงล้อ", "ตั้งศูนย์ล้อ", "เปลี่ยนยาง", "สลับยาง", "เจียรจานเบรค"] },
    { category: "Body & Paint", items: ["ซ่อมตัวถังจากอุบัติเหตุ", "พ่นสีมาตรฐาน OEM", "ซ่อมรอยขีดข่วน/บุบ", "บริการประกันภัย"] },
  ],
};

/** Map graphic image with loading skeleton — prevents layout shift */
function MapImage({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false);

  if (!url) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#F8FAFC]">
        <MapPin className="w-10 h-10 text-gray-300" />
      </div>
    );
  }

  // Optimize via Cloudinary: resize to 800px width + auto format + quality
  const optimizedUrl = url.includes("cloudinary.com")
    ? url.replace("/upload/", "/upload/f_auto,q_auto:good,w_800/")
    : url;

  return (
    <div className="relative bg-[#F8FAFC]" style={{ minHeight: 280 }}>
      {/* Skeleton loader — shown until image loads */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
          <Loader2 className="w-6 h-6 text-[#94A3B8] animate-spin" />
          <p className="text-xs text-[#94A3B8]">กำลังโหลดแผนที่...</p>
        </div>
      )}
      <img
        src={optimizedUrl}
        alt={`แผนที่ ${name}`}
        className={`w-full h-auto block transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default function ServiceLocator() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [filterBrand, setFilterBrand] = useState("ทั้งหมด");
  const [activeTab, setActiveTab] = useState<"map" | "info" | "services">("map");

  const brands = ["ทั้งหมด", "Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia", "GAC", "Lepas"];
  const filtered = filterBrand === "ทั้งหมด" ? branches : branches.filter(b => b.brand === filterBrand);
  const selected = branches.find((b) => b.id === selectedBranch);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
      {/* Header */}
      <div className="bg-[#0F172A] text-white py-14">
        <div className="container">
          <p className="text-[#0F172A] text-sm font-medium mb-2 tracking-wider uppercase">สาขาของเรา</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">ค้นหาสาขาและศูนย์บริการ</h1>
          <p className="text-white/70 max-w-xl">ช.เอราวัณ กรุ๊ป มี 7 สาขาครอบคลุมจังหวัดนครปฐมและสามพราน พร้อมให้บริการทั้งการขายและบริการหลังการขาย</p>
        </div>
      </div>

      <div className="container py-10">
        {/* Brand Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => { setFilterBrand(brand); setSelectedBranch(null); }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterBrand === brand
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#0F172A] hover:text-[#0F172A]"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Branch List */}
          <div className="lg:col-span-2 space-y-3">
            {filtered.map(branch => {
              const color = brandColors[branch.brand] ?? { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
              return (
                <button
                  key={branch.id}
                  onClick={() => { setSelectedBranch(branch.id === selectedBranch ? null : branch.id); setActiveTab("map"); }}
                  className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all hover:shadow-md ${
                    selectedBranch === branch.id
                      ? "border-[#0F172A] shadow-md"
                      : "border-[#E2E8F0]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border-0 ${color.bg} ${color.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                          {branch.brand}
                        </span>
                        {branch.isHQ && (
                          <span className="px-2 py-0.5 bg-[#0F172A]/10 text-[#475569] text-xs rounded-full font-medium">
                            สำนักงานใหญ่
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#0F172A] text-sm leading-snug">{branch.name}</h3>
                      <p className="text-[#64748B] text-xs mt-1 line-clamp-1">{branch.address}</p>
                      <p className="text-[#0F172A] text-xs font-medium mt-1">{branch.phone}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[#94A3B8] mt-1 ml-2 shrink-0 transition-transform ${selectedBranch === branch.id ? "rotate-90" : ""}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Branch Detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden sticky top-24">

                {/* ── Google Maps Direction — always visible, outside tabs ── */}
                <div className="px-4 pt-4 pb-3 border-b border-[#F1F5F9] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B] truncate">{selected.address}</p>
                  </div>
                  <a
                    href={selected.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    นำทาง
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#E2E8F0]">
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "map" ? "text-[#0F172A] border-b-2 border-[#0F172A]" : "text-[#64748B]"}`}
                  >
                    แผนที่
                  </button>
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "info" ? "text-[#0F172A] border-b-2 border-[#0F172A]" : "text-[#64748B]"}`}
                  >
                    ข้อมูลสาขา
                  </button>
                  <button
                    onClick={() => setActiveTab("services")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "services" ? "text-[#0F172A] border-b-2 border-[#0F172A]" : "text-[#64748B]"}`}
                  >
                    เมนูบริการ
                  </button>
                </div>

                <div className="overflow-hidden">
                  {activeTab === "map" ? (
                    <MapImage url={selected.graphicMapUrl} name={selected.name} />
                  ) : activeTab === "info" ? (
                    <div className="p-5">
                      <div className="flex items-start gap-2 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border-0 ${(brandColors[selected.brand] ?? { bg: "bg-gray-50", text: "text-gray-700" }).bg} ${(brandColors[selected.brand] ?? { bg: "bg-gray-50", text: "text-gray-700" }).text}`}>
                              {selected.brand}
                            </span>
                            {selected.isHQ && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">สำนักงานใหญ่</span>}
                          </div>
                          <h2 className="text-lg font-bold text-[#0F172A]">{selected.name}</h2>
                          {selected.note && (
                            <p className="text-xs text-[#64748B] mt-0.5 italic">{selected.note}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-5">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-[#0F172A] mt-0.5 shrink-0" />
                          <span className="text-[#475569] text-sm">{selected.address}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-[#0F172A] shrink-0" />
                          <a href={`tel:${selected.phone}`} className="text-[#0F172A] font-semibold text-sm hover:underline">
                            {selected.phone}
                          </a>
                          {selected.fax !== "-" && <span className="text-[#64748B] text-xs">โทรสาร: {selected.fax}</span>}
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-[#0F172A] mt-0.5 shrink-0" />
                          <span className="text-[#475569] text-sm">{selected.hours}</span>
                        </div>
                      </div>

                      {/* Nearby */}
                      {selected.nearby && (
                        <div className="mb-5">
                          <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">สถานที่ใกล้เคียง</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.nearby.map(n => (
                              <span key={n} className="px-2.5 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs">{n}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {selected.openingDate ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 text-xs font-semibold">
                          เปิดให้บริการเร็วๆ นี้ · {selected.openingDate}
                        </div>
                      ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <Link href={`/booking?branch=${selected.id}&type=test_drive`}>
                          <Button size="sm" className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs">
                            <Car className="w-3.5 h-3.5 mr-1" />
                            ทดลองขับ
                          </Button>
                        </Link>
                        <Link href={`/booking?branch=${selected.id}&type=service`}>
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            <Wrench className="w-3.5 h-3.5 mr-1" />
                            นัดบริการ
                          </Button>
                        </Link>
                        <a href={selected.lineUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="w-full text-xs border-[#06C755] text-[#06C755] hover:bg-[#06C755] hover:text-white">
                            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                            </svg>
                            LINE
                          </Button>
                        </a>
                      </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5">
                    <div className="space-y-4">
                      {(serviceMenuByBrand[selected.brand] ?? []).map(cat => (
                        <div key={cat.category}>
                          <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-4 h-0.5 bg-[#0F172A]" />
                            {cat.category}
                          </h4>
                          <ul className="space-y-1">
                            {cat.items.map(item => (
                              <li key={item} className="flex items-start gap-2 text-sm text-[#475569]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-[#E2E8F0]">
                        {selected.openingDate ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 text-xs font-semibold">
                            เปิดให้บริการเร็วๆ นี้ · {selected.openingDate}
                          </div>
                        ) : (
                        <Link href={`/booking?branch=${selected.id}&type=service`}>
                          <Button size="sm" className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs">
                            <Wrench className="w-3.5 h-3.5 mr-1.5" />
                            จองนัดหมายบริการ
                          </Button>
                        </Link>
                        )}
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] h-80 flex items-center justify-center text-center">
                <div>
                  <MapPin className="w-14 h-14 mx-auto mb-3 text-[#0F172A]/15" />
                  <h3 className="font-semibold text-[#0F172A] mb-1">เลือกสาขาเพื่อดูรายละเอียด</h3>
                  <p className="text-[#64748B] text-sm">คลิกที่สาขาทางซ้ายเพื่อดูข้อมูล แผนที่ และเมนูบริการ</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { value: "7", label: "สาขาทั่วนครปฐม" },
            { value: "6", label: "แบรนด์รถยนต์" },
            { value: "4", label: "ศูนย์ Body & Paint" },
            { value: "034-305-500", label: "Call Center" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 text-center">
              <div className="text-xl font-bold text-[#0F172A] mb-1">{stat.value}</div>
              <div className="text-[#64748B] text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
