"use client";

import { useEffect, useState } from "react";
import { Share2, Plus, Pencil, Trash2, ExternalLink, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BrandSocialLink } from "@/lib/notion-types";

const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"] as const;
const PLATFORMS = ["Facebook", "TikTok", "YouTube", "LINE", "Instagram"] as const;

const PLATFORM_COLORS: Record<string, string> = {
  Facebook: "bg-blue-50 text-blue-700",
  TikTok: "bg-gray-100 text-gray-700",
  YouTube: "bg-red-50 text-red-700",
  LINE: "bg-green-50 text-green-700",
  Instagram: "bg-pink-50 text-pink-700",
};

const BRAND_COLORS: Record<string, string> = {
  Mazda: "bg-red-50 text-red-700",
  Ford: "bg-blue-50 text-blue-700",
  Mitsubishi: "bg-orange-50 text-orange-700",
  GWM: "bg-yellow-50 text-yellow-700",
  Deepal: "bg-purple-50 text-purple-700",
  Kia: "bg-green-50 text-green-700",
};

type FormData = { brand: typeof BRANDS[number]; platform: typeof PLATFORMS[number]; url: string; isActive: boolean };
const EMPTY: FormData = { brand: "GWM", platform: "Facebook", url: "", isActive: true };

export default function AdminSocialLinksPage() {
  const [items, setItems] = useState<BrandSocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<BrandSocialLink | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/admin/social-links").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(fetch_, []);

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setFormOpen(true); };
  const openEdit = (item: BrandSocialLink) => {
    setEditingId(item.id);
    setForm({ brand: item.brand as typeof BRANDS[number], platform: item.platform, url: item.url, isActive: item.isActive });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.url) { toast.error("กรุณาใส่ URL"); return; }
    setSaving(true);
    try {
      const payload = editingId ? { id: editingId, ...form } : form;
      const res = await fetch("/api/admin/social-links", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "อัปเดตแล้ว" : "เพิ่มแล้ว");
      setFormOpen(false);
      fetch_();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  const toggle = async (item: BrandSocialLink, val: boolean) => {
    setBusyId(item.id);
    setItems(p => p.map(x => x.id === item.id ? { ...x, isActive: val } : x));
    try {
      await fetch("/api/admin/social-links", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, isActive: val }) });
      toast.success(val ? "เปิดใช้งาน" : "ปิดใช้งาน");
    } catch { setItems(p => p.map(x => x.id === item.id ? { ...x, isActive: !val } : x)); toast.error("เกิดข้อผิดพลาด"); }
    finally { setBusyId(null); }
  };

  const del = async () => {
    if (!deleting) return;
    const id = deleting.id; setDeleting(null);
    try {
      await fetch(`/api/admin/social-links?id=${id}`, { method: "DELETE" });
      setItems(p => p.filter(x => x.id !== id));
      toast.success("ลบแล้ว");
    } catch { toast.error("ลบไม่สำเร็จ"); }
  };

  // Group by brand
  const filtered = brandFilter === "all" ? items : items.filter(x => x.brand === brandFilter);
  const grouped = BRANDS.reduce<Record<string, BrandSocialLink[]>>((acc, b) => {
    acc[b] = filtered.filter(x => x.brand === b);
    return acc;
  }, {} as Record<string, BrandSocialLink[]>);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Social Links</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการ social media ของแต่ละแบรนด์</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a2a50] transition-colors">
          <Plus className="w-4 h-4" /> เพิ่ม Link
        </button>
      </div>

      {/* Brand filter */}
      <div className="flex flex-wrap gap-2">
        {["all", ...BRANDS].map(b => (
          <button key={b} onClick={() => setBrandFilter(b)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              brandFilter === b ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            {b === "all" ? "ทุกแบรนด์" : b}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {BRANDS.filter(b => brandFilter === "all" || brandFilter === b).map(brand => {
            const links = grouped[brand] ?? [];
            return (
              <div key={brand} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Brand header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BRAND_COLORS[brand] ?? "bg-gray-100 text-gray-600"}`}>{brand}</span>
                  <span className="text-xs text-gray-400">{links.length} ช่องทาง · {links.filter(l => l.isActive).length} ใช้งานอยู่</span>
                </div>

                {links.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">ยังไม่มี social links — กด "+ เพิ่ม Link"</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {links.map(item => (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${PLATFORM_COLORS[item.platform] ?? "bg-gray-100 text-gray-600"}`}>
                          {item.platform}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{item.url}</p>
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <Switch checked={item.isActive} disabled={busyId === item.id} onCheckedChange={v => toggle(item, v)} />
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-[#0F172A] hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleting(item)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#0F172A]">{editingId ? "แก้ไข" : "เพิ่ม"} Social Link</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">แบรนด์</label>
                  <select value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value as typeof BRANDS[number] }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Platform</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as typeof PLATFORMS[number] }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">URL *</label>
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://www.facebook.com/..." autoFocus
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                <span className="text-sm text-gray-600">{form.isActive ? "ใช้งาน (แสดงบนเว็บ)" : "ปิดใช้งาน"}</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100">ยกเลิก</button>
              <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#0F172A] text-white rounded-xl hover:bg-[#1a2a50] disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <Check className="w-4 h-4" />
                {editingId ? "บันทึก" : "เพิ่ม"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Social Link</AlertDialogTitle>
            <AlertDialogDescription>ลบ <strong>{deleting?.brand} {deleting?.platform}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={del} className="bg-red-600 hover:bg-red-700 text-white">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
