"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, ArrowRight, Fuel, Gauge, Calendar } from "lucide-react";
import type { Car } from "@/lib/notion-types";
import { cldUrl } from "@/lib/cloudinary";

const brands = ["ทั้งหมด", "Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"];
const types = [
  { value: "all", label: "ทุกประเภท" },
  { value: "suv", label: "SUV" },
  { value: "sedan", label: "Sedan" },
  { value: "pickup", label: "Pickup" },
  { value: "ev", label: "EV" },
  { value: "mpv", label: "MPV" },
  { value: "hatchback", label: "Hatchback" },
];

const fuelLabel: Record<string, string> = {
  petrol: "เบนซิน", diesel: "ดีเซล", hybrid: "ไฮบริด", electric: "ไฟฟ้า",
};

export default function CarsFilter({ cars }: { cars: Car[] }) {
  const searchParams = useSearchParams();
  const urlBrand = searchParams.get("brand");
  const urlCondition = searchParams.get("condition");

  const [selectedBrand, setSelectedBrand] = useState(urlBrand || "ทั้งหมด");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState(
    urlCondition === "used" ? "used" : urlCondition === "new" ? "new" : "all"
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return cars.filter((car) => {
      if (selectedBrand !== "ทั้งหมด" && car.brand !== selectedBrand) return false;
      if (selectedType !== "all" && car.type !== selectedType) return false;
      if (selectedCondition !== "all" && car.condition !== selectedCondition) return false;
      if (search && !`${car.brand} ${car.model}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [cars, selectedBrand, selectedType, selectedCondition, search]);

  return (
    <div className="container py-8 lg:py-12">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-500">กรองผลลัพธ์</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหารุ่นรถ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-gray-200 focus:border-[#0F172A]"
            />
          </div>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="border-gray-200" aria-label="เลือกแบรนด์">
              <SelectValue placeholder="แบรนด์" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="border-gray-200" aria-label="เลือกประเภทรถ">
              <SelectValue placeholder="ประเภทรถ" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Condition toggle (new / used) */}
        <div className="mt-4 flex items-center gap-2">
          {[
            { value: "all", label: "ทั้งหมด" },
            { value: "new", label: "รถใหม่" },
            { value: "used", label: "รถมือสอง" },
          ].map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setSelectedCondition(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCondition === c.value
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6">
        พบ <span className="font-semibold text-[#0F172A]">{filtered.length}</span> รุ่น
      </p>

      {/* Car Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((car) => (
          <Link key={car.id} href={`/cars/${car.slug || car.id}`}>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
              {/* Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative img-shimmer">
                {car.imageUrls[0] ? (
                  <img
                    src={cldUrl(car.imageUrls[0])}
                    alt={`${car.brand} ${car.model}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-bold">
                    {car.brand[0]}
                  </div>
                )}
                {/* Brand + condition — bottom-left */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge className="bg-[#0F172A]/80 text-white text-xs backdrop-blur-sm border-0">
                    {car.brand}
                  </Badge>
                  {car.condition === "used" && (
                    <Badge className="bg-amber-500/90 text-white text-xs border-0">มือสอง</Badge>
                  )}
                </div>

                {/* Status badges — top-right */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                  {car.navNew && (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      ใหม่
                    </span>
                  )}
                  {car.navFeatured && (
                    <span className="bg-[#DD5259] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      แนะนำ
                    </span>
                  )}
                  {car.isBestSeller && !car.navFeatured && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      ขายดี
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h2 className="font-bold text-[#0F172A] text-lg mb-1">
                  {car.brand} {car.model}
                </h2>
                <p className="text-gray-400 text-sm mb-3">{car.year}</p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
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
                  {car.transmission && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {car.transmission === "auto" ? "อัตโนมัติ" : "ธรรมดา"}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {car.priceMin > 0 && (
                      <p className="text-[#0F172A] font-bold text-lg">
                        ฿{car.priceMin.toLocaleString()}
                        {car.priceMax > car.priceMin && (
                          <span className="text-sm font-normal text-gray-400">
                            {" "}– {car.priceMax.toLocaleString()}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="text-[#0F172A] hover:bg-gray-50 gap-1">
                    ดูรายละเอียด <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <p className="font-semibold text-[#0F172A] mb-1">ไม่พบรถที่ตรงกับเงื่อนไข</p>
          <p className="text-sm text-gray-500 mb-5">ลองปรับตัวกรอง หรือดูรถทั้งหมดอีกครั้ง</p>
          <button
            type="button"
            onClick={() => { setSelectedBrand("ทั้งหมด"); setSelectedType("all"); setSelectedCondition("all"); setSearch(""); }}
            className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}
