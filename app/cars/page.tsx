import { Suspense } from "react";
import { getActiveCars } from "@/lib/notion";
import CarsFilter from "./CarsFilter";
import { pageMetadata } from "@/lib/site";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "รถยนต์ใหม่ทุกแบรนด์ ราคาดีที่สุด นครปฐม | ช.เอราวัณ",
  description:
    "รถยนต์ใหม่ราคาโรงงาน Mazda, Ford, Mitsubishi, GWM, Deepal, Kia ที่นครปฐม ผ่อนเริ่มต้นหมื่นกว่าบาท/เดือน จอง test drive ฟรีได้เลย",
  path: "/cars",
});

export default async function CarsPage() {
  const cars = await getActiveCars();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
      {/* Header */}
      <div className="bg-[#0F172A] text-white py-16 lg:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-white/40 text-sm font-medium tracking-wider uppercase mb-3">Vehicle Lineup</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">ค้นหารถยนต์</h1>
            <p className="text-white/50 text-base lg:text-lg leading-relaxed">
              รถยนต์ใหม่และรถมือสองคุณภาพจาก 8 แบรนด์ชั้นนำ — Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="container py-12 text-center text-gray-400">กำลังโหลด...</div>}>
        <CarsFilter cars={cars} />
      </Suspense>
    </div>
  );
}
