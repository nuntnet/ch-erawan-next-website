"use client";

import { useState } from "react";
import { useTrackEvent } from "@/hooks/useTrack";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { Calendar, ArrowLeft, ChevronLeft, ChevronRight, Calculator, Share2, Zap, Gauge, Ruler, BatteryCharging, Star, ChevronRight as ArrowRight } from "lucide-react";
import type { Car } from "@/lib/notion-types";
import { BRAND_BY_NOTION } from "@/lib/brandConfig";

// Human-readable Thai labels for spec keys
const SPEC_LABELS: Record<string, string> = {
  engine: "เครื่องยนต์",
  displacement_cc: "ความจุกระบอกสูบ (cc)",
  horsepower: "กำลังสูงสุด",
  power_kw: "กำลัง (kW)",
  torque_nm: "แรงบิดสูงสุด (Nm)",
  battery_capacity_kwh: "ความจุแบตเตอรี่ (kWh)",
  battery_type: "ชนิดแบตเตอรี่",
  charging_ac_kw: "ชาร์จ AC (kW)",
  charging_dc_kw: "ชาร์จ DC สูงสุด (kW)",
  ev_range_km: "พิสัยทำการ EV (กม.)",
  drive_type: "ระบบขับเคลื่อน",
  length_mm: "ความยาว (มม.)",
  width_mm: "ความกว้าง (มม.)",
  height_mm: "ความสูง (มม.)",
  wheelbase_mm: "ระยะฐานล้อ (มม.)",
  weight_kg: "น้ำหนักรถ (กก.)",
  fuel_tank_l: "ถังน้ำมัน (ลิตร)",
  acceleration_0_100: "0–100 กม./ชม. (วินาที)",
  max_speed_kmh: "ความเร็วสูงสุด (กม./ชม.)",
  seats: "จำนวนที่นั่ง",
  towing_kg: "น้ำหนักลากจูงสูงสุด (กก.)",
  cylinders: "จำนวนสูบ",
  valves: "จำนวนวาล์ว",
  motor_type: "ชนิดมอเตอร์",
  motor_power_ps: "กำลังมอเตอร์ (PS)",
  motor_torque_nm: "แรงบิดมอเตอร์ (Nm)",
  combined_power_ps: "กำลังรวม (PS)",
  combined_torque_nm: "แรงบิดรวม (Nm)",
  transmission_gears: "จำนวนเกียร์",
  ground_clearance_mm: "ความสูงใต้ท้อง (มม.)",
  cargo_volume_l: "ปริมาตรห้องเก็บสัมภาระ (ลิตร)",
};

const SPEC_GROUPS = [
  {
    title: "เครื่องยนต์ / มอเตอร์",
    icon: Gauge,
    keys: ["engine", "displacement_cc", "cylinders", "horsepower", "power_kw", "torque_nm", "combined_power_ps", "combined_torque_nm", "motor_type", "motor_power_ps", "motor_torque_nm", "drive_type"],
  },
  {
    title: "แบตเตอรี่ / ไฟฟ้า",
    icon: BatteryCharging,
    keys: ["battery_capacity_kwh", "battery_type", "charging_ac_kw", "charging_dc_kw", "ev_range_km"],
  },
  {
    title: "สมรรถนะ",
    icon: Zap,
    keys: ["acceleration_0_100", "max_speed_kmh", "towing_kg"],
  },
  {
    title: "ขนาดตัวถัง",
    icon: Ruler,
    keys: ["length_mm", "width_mm", "height_mm", "wheelbase_mm", "weight_kg", "ground_clearance_mm", "fuel_tank_l", "cargo_volume_l", "seats"],
  },
];

/** Shared features bullet list — used in both overview and specs tabs */
function FeaturesList({ features, className = "" }: { features?: string[]; className?: string }) {
  if (!Array.isArray(features) || features.length === 0) return null;
  return (
    <div className={`bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-[#0F172A]" />
        <span className="font-semibold text-[#0F172A] text-sm">จุดเด่น</span>
      </div>
      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DD5259] mt-1.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const fuelLabel: Record<string, string> = {
  petrol: "เบนซิน", diesel: "ดีเซล", hybrid: "ไฮบริด", electric: "ไฟฟ้า",
};

export default function CarDetailClient({ car, relatedCars = [] }: { car: Car; relatedCars?: Car[] }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [downPayment, setDownPayment] = useState(20);
  const [loanTerm, setLoanTerm] = useState(60);

  useTrackEvent("car_view", { path: `/cars/${car.slug || car.id}`, brand: car.brand, model: car.model });

  const basePrice = car.priceMin || 1000000;
  const downAmount = Math.round(basePrice * downPayment / 100);
  const loanAmount = basePrice - downAmount;
  const monthlyRate = 0.0265 / 12;
  const monthlyPayment = Math.round(
    loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm) /
    (Math.pow(1 + monthlyRate, loanTerm) - 1)
  );

  const images = car.imageUrls;
  const brandMeta = BRAND_BY_NOTION[car.brand as keyof typeof BRAND_BY_NOTION];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
          <Link href="/cars" className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
            <ArrowLeft className="w-4 h-4" /> ค้นหารถยนต์
          </Link>
          <span>/</span>
          <span className="text-[#0F172A] font-medium">{car.brand} {car.model}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images & Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] mb-6">
              <div className="aspect-[16/9] bg-gray-100 relative">
                {images.length > 0 ? (
                  <Image
                    src={images[currentImage]}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl font-bold">
                    {car.brand[0]}
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage(Math.max(0, currentImage - 1))}
                      aria-label="ภาพก่อนหน้า"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImage(Math.min(images.length - 1, currentImage + 1))}
                      aria-label="ภาพถัดไป"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      aria-label={`ดูรูปที่ ${i + 1}`}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 ${i === currentImage ? "border-[#0F172A]" : "border-transparent"}`}
                    >
                      <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
                  <TabsTrigger value="specs">สเปค</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  {/* Spec badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <Badge className="bg-[#0F172A] text-white border-0">
                      {car.condition === "new" ? "รถใหม่" : "รถใช้แล้ว"}
                    </Badge>
                    {car.fuelType && <Badge variant="outline">{fuelLabel[car.fuelType] ?? car.fuelType}</Badge>}
                    {car.transmission && <Badge variant="outline">{car.transmission === "auto" ? "อัตโนมัติ" : "ธรรมดา"}</Badge>}
                    {car.engineSize && <Badge variant="outline">{car.engineSize}</Badge>}
                    {car.year > 0 && <Badge variant="outline">ปี {car.year}</Badge>}
                  </div>

                  {/* Description — Safari-safe split (no lookbehind) */}
                  {car.description ? (
                    <div className="space-y-3 text-[#475569] text-sm leading-relaxed">
                      {car.description
                        .split("\n")
                        .flatMap((line) => line.split(/[.。]\s+/).map((s, i, arr) => i < arr.length - 1 ? s + "." : s))
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((para, i) => <p key={i}>{para}</p>)
                      }
                    </div>
                  ) : (
                    <p className="text-[#475569] text-sm leading-relaxed">
                      {car.brand} {car.model} รถยนต์คุณภาพสูงจาก ช.เอราวัณ กรุ๊ป พร้อมบริการหลังการขายครบวงจร
                    </p>
                  )}

                  {/* Key features — shared component (same in specs tab) */}
                  <FeaturesList features={car.specs.features as string[]} className="mt-5" />
                </TabsContent>
                <TabsContent value="specs">
                  {Object.keys(car.specs).length > 0 ? (
                    <div className="space-y-6">
                      {/* Features highlight — reuse shared component */}
                      <FeaturesList features={car.specs.features as string[]} />

                      {/* Grouped spec rows */}
                      {SPEC_GROUPS.map((group) => {
                        const rows = group.keys
                          .filter((k) => {
                            const v = car.specs[k];
                            return v !== undefined && v !== null && v !== 0 && v !== "";
                          })
                          .map((k) => ({ key: k, label: SPEC_LABELS[k] ?? k, value: car.specs[k] }));
                        if (rows.length === 0) return null;
                        const Icon = group.icon;
                        return (
                          <div key={group.title}>
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className="w-4 h-4 text-[#64748B]" />
                              <span className="text-sm font-semibold text-[#0F172A]">{group.title}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                              {rows.map(({ key, label, value }) => (
                                <div key={key} className="flex justify-between py-2 border-b border-[#F1F5F9]">
                                  <span className="text-[#64748B] text-sm">{label}</span>
                                  <span className="font-medium text-[#0F172A] text-sm text-right ml-4">
                                    {typeof value === "number" ? value.toLocaleString() : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Any extra keys not in groups */}
                      {(() => {
                        const usedKeys = new Set([...SPEC_GROUPS.flatMap(g => g.keys), "features", "description"]);
                        const extras = Object.entries(car.specs).filter(([k]) => !usedKeys.has(k));
                        if (extras.length === 0) return null;
                        return (
                          <div>
                            <div className="text-sm font-semibold text-[#0F172A] mb-3">ข้อมูลเพิ่มเติม</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                              {extras.map(([k, v]) => (
                                <div key={k} className="flex justify-between py-2 border-b border-[#F1F5F9]">
                                  <span className="text-[#64748B] text-sm">{SPEC_LABELS[k] ?? k}</span>
                                  <span className="font-medium text-[#0F172A] text-sm text-right ml-4">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-[#64748B] text-sm">ไม่มีข้อมูลสเปค</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right: Price & Actions */}
          <div className="space-y-5">
            {/* Price Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="text-xs text-[#64748B] mb-1">
                {brandMeta ? (
                  <>
                    {brandMeta.displayNameTh}
                    <span className="text-[#94A3B8]"> · {brandMeta.displayName}</span>
                  </>
                ) : (
                  car.brand
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-3">{car.model}</h1>
              <div className="text-[#0F172A] font-bold text-2xl mb-1">
                ฿{car.priceMin.toLocaleString()}
                {car.priceMax > car.priceMin && ` – ฿${car.priceMax.toLocaleString()}`}
              </div>
              <p className="text-xs text-[#64748B] mb-5">ราคาเริ่มต้น (ยังไม่รวมค่าใช้จ่ายอื่น)</p>
              <div className="space-y-3">
                <Link href={`/booking?type=test_drive&car=${car.model}`}>
                  <Button className="w-full bg-[#0F172A] hover:bg-[#0B1120] text-white font-semibold">
                    <Calendar className="w-4 h-4 mr-2" />
                    นัดหมายทดลองขับ
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full text-[#64748B]"
                  onClick={() => navigator.share?.({ title: `${car.brand} ${car.model}`, url: window.location.href })}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  แชร์รถคันนี้
                </Button>
              </div>
            </div>

            {/* Financing Calculator */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calculator className="w-5 h-5 text-[#0F172A]" />
                <h3 className="font-semibold text-[#0F172A]">คำนวณสินเชื่อเบื้องต้น</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#64748B]">เงินดาวน์</span>
                    <span className="font-semibold text-[#0F172A]">{downPayment}% (฿{downAmount.toLocaleString()})</span>
                  </div>
                  <Slider value={[downPayment]} onValueChange={(v) => setDownPayment(v[0]!)} min={10} max={50} step={5} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#64748B]">ระยะเวลาผ่อน</span>
                    <span className="font-semibold text-[#0F172A]">{loanTerm} เดือน</span>
                  </div>
                  <Slider value={[loanTerm]} onValueChange={(v) => setLoanTerm(v[0]!)} min={24} max={84} step={12} className="w-full" />
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] mb-1">ผ่อนชำระประมาณ</div>
                  <div className="text-2xl font-bold text-[#0F172A]">฿{monthlyPayment.toLocaleString()} / เดือน</div>
                  <div className="text-xs text-[#64748B] mt-1">ยอดกู้ ฿{loanAmount.toLocaleString()} · ดอกเบี้ย 2.65%</div>
                </div>
                <p className="text-[10px] text-[#64748B] leading-relaxed">
                  * ตัวเลขนี้เป็นการประมาณการเบื้องต้นเท่านั้น ยอดผ่อนจริงขึ้นอยู่กับเงื่อนไขสินเชื่อของแต่ละธนาคาร
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Cars ── */}
      {relatedCars.length > 0 && (
        <div className="container py-12 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-1">รุ่นอื่นจาก {car.brand}</p>
              <h2 className="text-lg font-bold text-[#0F172A]">รุ่นที่อาจสนใจ</h2>
            </div>
            <Link href={`/cars?brand=${car.brand}`} className="text-sm text-[#DD5259] font-medium hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedCars.map((rc) => (
              <Link key={rc.id} href={`/cars/${rc.slug || rc.id}`} className="group bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Thumbnail */}
                <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden">
                  {rc.imageUrls[0] ? (
                    <Image
                      src={rc.imageUrls[0]}
                      alt={rc.model}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 text-3xl font-bold">
                      {rc.brand[0]}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">{rc.brand}</p>
                  <p className="font-semibold text-[#0F172A] text-sm leading-snug mt-0.5 line-clamp-2">{rc.model}</p>
                  {rc.priceMin > 0 && (
                    <p className="text-[#DD5259] font-bold text-sm mt-1.5">฿{rc.priceMin.toLocaleString()}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
