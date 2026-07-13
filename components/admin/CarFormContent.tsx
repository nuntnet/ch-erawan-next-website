"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "@/components/admin/ImageUploader";
import type { Car, CarInput } from "@/lib/notion-types";

const BRANDS: Car["brand"][] = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia", "GAC", "Lepas"];
const TYPES: { value: Car["type"]; label: string }[] = [
  { value: "sedan", label: "ซีดาน" },
  { value: "suv", label: "เอสยูวี" },
  { value: "pickup", label: "กระบะ" },
  { value: "hatchback", label: "แฮทช์แบ็ก" },
  { value: "mpv", label: "เอ็มพีวี" },
  { value: "ev", label: "รถยนต์ไฟฟ้า" },
  { value: "other", label: "อื่นๆ" },
];
const CONDITIONS: { value: Car["condition"]; label: string }[] = [
  { value: "new", label: "รถใหม่" },
  { value: "used", label: "รถมือสอง" },
];
const TRANSMISSIONS: { value: Car["transmission"]; label: string }[] = [
  { value: "auto", label: "อัตโนมัติ" },
  { value: "manual", label: "ธรรมดา" },
];
const FUEL_TYPES: { value: Car["fuelType"]; label: string }[] = [
  { value: "petrol", label: "เบนซิน" },
  { value: "diesel", label: "ดีเซล" },
  { value: "hybrid", label: "ไฮบริด (HEV)" },
  { value: "phev", label: "ปลั๊กอินไฮบริด (PHEV)" },
  { value: "electric", label: "ไฟฟ้า (BEV)" },
];

const emptyCar: CarInput = {
  name: "",
  brand: "Mazda",
  model: "",
  year: new Date().getFullYear(),
  type: "sedan",
  condition: "new",
  priceMin: 0,
  priceMax: 0,
  engineSize: "",
  transmission: "auto",
  fuelType: "petrol",
  description: "",
  specs: {},
  imageUrls: [],
  videoUrl: null,
  isActive: true,
  isBestSeller: false,
  sortOrder: 0,
  navFeatured: false,
  navNew: false,
  slug: "",
};

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20";
const labelClass = "text-sm font-medium text-gray-700 mb-1 block";

interface CarFormContentProps {
  /** Existing car data for edit mode; undefined = create mode */
  car?: Car | null;
  /** Called after successful save */
  onSaved?: () => void;
}

export default function CarFormContent({ car, onSaved }: CarFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<CarInput>(
    car ? { ...car } : { ...emptyCar, year: new Date().getFullYear() }
  );
  const [specRows, setSpecRows] = useState<{ key: string; value: string }[]>(() =>
    Object.entries((car?.specs ?? {})).map(([key, value]) => ({
      key,
      value: Array.isArray(value) ? value.join(", ") : String(value ?? ""),
    }))
  );
  const [saving, setSaving] = useState(false);

  // Sync if car prop changes (e.g. loaded async)
  useEffect(() => {
    if (car) {
      setForm({ ...car });
      setSpecRows(
        Object.entries(car.specs ?? {}).map(([key, value]) => ({
          key,
          value: Array.isArray(value) ? value.join(", ") : String(value ?? ""),
        }))
      );
    }
  }, [car?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof CarInput>(key: K, value: CarInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.model.trim()) {
      toast.error("กรุณากรอกชื่อรถและรุ่น");
      return;
    }
    const specs: Record<string, string | number | string[]> = {};
    for (const { key, value } of specRows) {
      if (!key.trim()) continue;
      const trimmed = value.trim();
      if (trimmed !== "" && !isNaN(Number(trimmed))) {
        specs[key.trim()] = Number(trimmed);
      } else {
        specs[key.trim()] = trimmed;
      }
    }
    const payload: CarInput = {
      ...form,
      specs,
      slug: form.slug.trim() || form.model.trim().toLowerCase().replace(/\s+/g, "-"),
      videoUrl: form.videoUrl || null,
    };

    setSaving(true);
    try {
      const res = car
        ? await fetch("/api/admin/cars", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: car.id, data: payload }),
          })
        : await fetch("/api/admin/cars", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("API error:", errBody);
        toast.error(`Error: ${JSON.stringify(errBody)}`);
        return;
      }
      toast.success(car ? "บันทึกการแก้ไขสำเร็จ" : "เพิ่มรถสำเร็จ");
      onSaved?.();
      router.push("/admin/cars");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/cars")}
          className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">
            {car ? `แก้ไข: ${car.name}` : "เพิ่มรถยนต์ใหม่"}
          </h1>
          <p className="text-sm text-[#64748B]">
            {car ? "แก้ไขข้อมูลรถในฐานข้อมูล" : "กรอกข้อมูลรถยนต์รุ่นใหม่"}
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
        {/* ── Basic info ── */}
        <section>
          <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-4">ข้อมูลพื้นฐาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ชื่อรถ *</label>
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น Mazda CX-5 2025" />
            </div>
            <div>
              <label className={labelClass}>รุ่น (Model) *</label>
              <input className={inputClass} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="เช่น CX-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className={labelClass}>แบรนด์</label>
              <select className={inputClass} value={form.brand} onChange={(e) => set("brand", e.target.value as Car["brand"])}>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>ปี</label>
              <input type="number" className={inputClass} value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>ประเภท</label>
              <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as Car["type"])}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>สภาพ</label>
              <select className={inputClass} value={form.condition} onChange={(e) => set("condition", e.target.value as Car["condition"])}>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className={labelClass}>เกียร์</label>
              <select className={inputClass} value={form.transmission} onChange={(e) => set("transmission", e.target.value as Car["transmission"])}>
                {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>เชื้อเพลิง</label>
              <select className={inputClass} value={form.fuelType} onChange={(e) => set("fuelType", e.target.value as Car["fuelType"])}>
                {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>ขนาดเครื่องยนต์</label>
              <input className={inputClass} value={form.engineSize} onChange={(e) => set("engineSize", e.target.value)} placeholder="2.0L" />
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="border-t border-[#F1F5F9] pt-5">
          <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-4">ราคา & URL</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>ราคาเริ่มต้น (฿)</label>
              <input type="number" className={inputClass} value={form.priceMin} onChange={(e) => set("priceMin", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>ราคาสูงสุด (฿)</label>
              <input type="number" className={inputClass} value={form.priceMax} onChange={(e) => set("priceMax", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input className={inputClass} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto จากรุ่น" />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>ลิงก์วิดีโอ (YouTube)</label>
            <input className={inputClass} value={form.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value || null)} placeholder="https://youtube.com/watch?v=..." />
          </div>
        </section>

        {/* ── Description ── */}
        <section className="border-t border-[#F1F5F9] pt-5">
          <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-4">รายละเอียด</h2>
          <textarea
            className={`${inputClass} min-h-[100px]`}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="รายละเอียดรถ จุดเด่น ข้อมูลทั่วไป..."
          />
        </section>

        {/* ── Specs ── */}
        <section className="border-t border-[#F1F5F9] pt-5">
          <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-4">สเปค (Specs)</h2>
          <div className="space-y-2">
            {specRows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="หัวข้อ เช่น horsepower"
                  value={row.key}
                  onChange={(e) => {
                    const next = [...specRows];
                    next[i] = { ...next[i], key: e.target.value };
                    setSpecRows(next);
                  }}
                />
                <input
                  className={inputClass}
                  placeholder="ค่า เช่น 170"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...specRows];
                    next[i] = { ...next[i], value: e.target.value };
                    setSpecRows(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSpecRows(specRows.filter((_, j) => j !== i))}
                  className="shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSpecRows([...specRows, { key: "", value: "" }])}
              className="flex items-center gap-1.5 text-sm text-[#0F172A] font-medium hover:underline"
            >
              <Plus className="w-4 h-4" /> เพิ่มสเปค
            </button>
          </div>
        </section>

        {/* ── Images ── */}
        <section className="border-t border-[#F1F5F9] pt-5">
          <ImageUploader
            label="รูปภาพรถ"
            multiple
            value={form.imageUrls}
            onChange={(urls) => set("imageUrls", urls)}
          />
        </section>

        {/* ── Flags ── */}
        <section className="border-t border-[#F1F5F9] pt-5">
          <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-4">การแสดงผล</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
              <span className="text-sm text-gray-700">เผยแพร่</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={form.isBestSeller} onCheckedChange={(v) => set("isBestSeller", v)} />
              <div>
                <p className="text-sm text-gray-700">ขายดี</p>
                <p className="text-[10px] text-gray-400">แสดงหน้า Home</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={form.navFeatured} onCheckedChange={(v) => set("navFeatured", v)} />
              <div>
                <p className="text-sm text-gray-700">แนะนำ</p>
                <p className="text-[10px] text-blue-400">mega nav</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={form.navNew} onCheckedChange={(v) => set("navNew", v)} />
              <div>
                <p className="text-sm text-gray-700">ใหม่</p>
                <p className="text-[10px] text-blue-400">mega nav</p>
              </div>
            </label>
          </div>
        </section>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/admin/cars")}
          className="px-5 py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-xl transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#1E293B] transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {car ? "บันทึกการแก้ไข" : "เพิ่มรถยนต์"}
        </button>
      </div>
    </div>
  );
}
