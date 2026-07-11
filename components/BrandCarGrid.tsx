import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Fuel, Gauge, Calendar } from "lucide-react";
import type { Car } from "@/lib/notion-types";
import { BRAND_IMAGES } from "@/lib/brandImages";

const fuelLabel: Record<string, string> = {
  petrol: "เบนซิน",
  diesel: "ดีเซล",
  hybrid: "ไฮบริด",
  electric: "ไฟฟ้า",
};

function carImageSrc(car: Car): string {
  const primary = car.imageUrls?.[0]?.trim();
  if (primary) return primary;
  return BRAND_IMAGES[car.brand] ?? BRAND_IMAGES.default;
}

interface BrandCarGridProps {
  cars: Car[];
  emptyMessage?: string;
}

export default function BrandCarGrid({
  cars,
  emptyMessage = "ยังไม่มีรุ่นรถในหมวดนี้ — ติดต่อเราเพื่อสอบถามรุ่นที่พร้อมจำหน่าย",
}: BrandCarGridProps) {
  if (cars.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => {
        const href = `/cars/${car.slug || car.id}`;
        const imgSrc = carImageSrc(car);

        return (
          <Link key={car.id} href={href} className="group block h-full">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative img-shimmer">
                {/* Native img avoids next/image hostname errors for dynamic Notion URLs */}
                <img
                  src={imgSrc}
                  alt={`${car.brand} ${car.model}`}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                {car.isBestSeller && (
                  <Badge className="absolute top-3 left-3 bg-[#0F172A] text-white text-[10px] font-semibold px-2.5 py-1 border-0">
                    แนะนำ
                  </Badge>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-1">
                  {car.brand}
                </p>
                <h3 className="font-bold text-[#0F172A] text-lg mb-2 group-hover:text-[#DD5259] transition-colors">
                  {car.model}
                </h3>
                {car.priceMin > 0 && (
                  <p className="text-lg font-bold text-[#0F172A] mb-3">
                    ฿{car.priceMin.toLocaleString()}
                    <span className="text-xs font-normal text-gray-400 ml-1">เริ่มต้น</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                  {car.year > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {car.year}
                    </span>
                  )}
                  {car.fuelType && (
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" />
                      {fuelLabel[car.fuelType] ?? car.fuelType}
                    </span>
                  )}
                  {car.engineSize && (
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {car.engineSize}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center text-sm font-medium text-[#0F172A] group-hover:text-[#DD5259] transition-colors mt-auto">
                  ดูรายละเอียด
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
