"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "@/components/admin/ImageUploader";
import type { Car, CarInput } from "@/lib/notion-types";

const BRANDS: Car["brand"][] = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"];
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
  { value: "hybrid", label: "ไฮบริด" },
  { value: "electric", label: "ไฟฟ้า" },
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

interface CarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: Car | null;
  onSaved: () => void;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20";
const labelClass = "text-sm font-medium text-gray-700 mb-1 block";

export default function CarForm({ open, onOpenChange, car, onSaved }: CarFormProps) {
  const [form, setForm] = useState<CarInput>(emptyCar);
  const [specRows, setSpecRows] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const base: CarInput = car
        ? { ...car }
        : { ...emptyCar, year: new Date().getFullYear() };
      setForm(base);
      setSpecRows(
        Object.entries(base.specs ?? {}).map(([key, value]) => ({
          key,
          value: Array.isArray(value) ? value.join(", ") : String(value ?? ""),
        }))
      );
    }
  }, [open, car]);

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
      // Preserve numeric values as numbers
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
      if (!res.ok) throw new Error();
      toast.success(car ? "บันทึกการแก้ไขสำเร็จ" : "เพิ่มรถสำเร็จ");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">
            {car ? "แก้ไขรถยนต์" : "เพิ่มรถยนต์"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {car ? `แก้ไขข้อมูล ${car.name}` : "กรอกข้อมูลรถยนต์ใหม่"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>ชื่อรถ *</label>
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>รุ่น (Model) *</label>
              <input className={inputClass} value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>สภาพ</label>
              <select className={inputClass} value={form.condition} onChange={(e) => set("condition", e.target.value as Car["condition"])}>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>ราคาเริ่มต้น (฿)</label>
              <input type="number" className={inputClass} value={form.priceMin} onChange={(e) => set("priceMin", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>ราคาสูงสุด (฿)</label>
              <input type="number" className={inputClass} value={form.priceMax} onChange={(e) => set("priceMax", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>ขนาดเครื่องยนต์</label>
              <input className={inputClass} value={form.engineSize} onChange={(e) => set("engineSize", e.target.value)} placeholder="2.0L" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input className={inputClass} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto จากรุ่น" />
            </div>
            <div>
              <label className={labelClass}>ลิงก์วิดีโอ (YouTube)</label>
              <input className={inputClass} value={form.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value || null)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className={labelClass}>รายละเอียด</label>
            <textarea className={`${inputClass} min-h-[80px]`} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          {/* Specs key-value editor */}
          <div>
            <label className={labelClass}>สเปค (Specs)</label>
            <div className="space-y-2">
              {specRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="หัวข้อ เช่น แรงม้า"
                    value={row.key}
                    onChange={(e) => {
                      const next = [...specRows];
                      next[i] = { ...next[i], key: e.target.value };
                      setSpecRows(next);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="ค่า เช่น 170 แรงม้า"
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
          </div>

          <ImageUploader
            label="รูปภาพรถ"
            multiple
            value={form.imageUrls}
            onChange={(urls) => set("imageUrls", urls)}
          />

          <div className="flex flex-wrap items-start gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer" title="แสดง/ซ่อนรถบนเว็บไซต์">
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
              <span>เผยแพร่</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer" title="แสดงในหน้าแรก section รถแนะนำ + badge ขายดี">
              <Switch checked={form.isBestSeller} onCheckedChange={(v) => set("isBestSeller", v)} />
              <span className="flex flex-col leading-tight">
                <span>ขายดี</span>
                <span className="text-[10px] text-gray-400">แสดงหน้า Home</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer" title="แสดงใน Mega Nav + badge แนะนำ">
              <Switch checked={form.navFeatured} onCheckedChange={(v) => set("navFeatured", v)} />
              <span className="flex flex-col leading-tight">
                <span>แนะนำ</span>
                <span className="text-[10px] text-blue-400">mega nav</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer" title="แสดงใน Mega Nav + badge ใหม่">
              <Switch checked={form.navNew} onCheckedChange={(v) => set("navNew", v)} />
              <span className="flex flex-col leading-tight">
                <span>ใหม่</span>
                <span className="text-[10px] text-blue-400">mega nav</span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#1a2a50] transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {car ? "บันทึก" : "เพิ่มรถ"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
