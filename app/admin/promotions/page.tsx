"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Pencil, Trash2, Search, ExternalLink, Calendar, X, Filter } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Promotion } from "@/lib/notion-types";

const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia", "GAC", "Lepas"] as const;
const BRAND_COLORS: Record<string, string> = {
  Mazda: "bg-red-50 text-red-700",
  Ford: "bg-blue-50 text-blue-700",
  Mitsubishi: "bg-orange-50 text-orange-700",
  GWM: "bg-yellow-50 text-yellow-700",
  Deepal: "bg-purple-50 text-purple-700",
  Kia: "bg-green-50 text-green-700",
};

type FormData = {
  title: string;
  brand: typeof BRANDS[number];
  coverImageUrl: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

const EMPTY_FORM: FormData = {
  title: "", brand: "GWM", coverImageUrl: "", linkUrl: "",
  startDate: "", endDate: "", isActive: true,
};

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const resetPage = () => setPage(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Promotion | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPromos = () => {
    setLoading(true);
    fetch("/api/admin/promotions")
      .then((r) => r.json())
      .then((d) => setPromos(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPromos(); }, []);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      brand: p.brand as typeof BRANDS[number],
      coverImageUrl: p.coverImageUrl ?? "",
      linkUrl: p.linkUrl ?? "",
      startDate: p.startDate ?? "",
      endDate: p.endDate ?? "",
      isActive: p.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("กรุณาใส่ชื่อโปรโมชั่น"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        coverImageUrl: form.coverImageUrl || null,
        linkUrl: form.linkUrl || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        ...(editingId ? { id: editingId } : {}),
      };
      const res = await fetch("/api/admin/promotions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "อัปเดตโปรโมชั่นแล้ว" : "เพิ่มโปรโมชั่นแล้ว");
      setFormOpen(false);
      fetchPromos();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Promotion, value: boolean) => {
    setBusyId(p.id);
    setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: value } : x));
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isActive: value, title: p.title, brand: p.brand }),
      });
      if (!res.ok) throw new Error();
      toast.success(value ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว");
    } catch {
      setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !value } : x));
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    setDeleting(null);
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPromos((prev) => prev.filter((p) => p.id !== id));
      toast.success("ลบโปรโมชั่นแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "—";

  const filtered = promos.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q);
    const matchBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchActive = activeFilter === "all" || (activeFilter === "active" ? p.isActive : !p.isActive);
    return matchSearch && matchBrand && matchActive;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = promos.filter((p) => p.isActive).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">โปรโมชั่น</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {promos.length} รายการทั้งหมด · {activeCount} ใช้งานอยู่
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a2a50] transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มโปรโมชั่น
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาโปรโมชั่น..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 w-64"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => { setBrandFilter(e.target.value); resetPage(); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
        >
          <option value="all">ทุกแบรนด์</option>
          {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); resetPage(); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
        >
          <option value="all">ทั้งใช้งานและปิด</option>
          <option value="active">ใช้งานอยู่</option>
          <option value="inactive">ปิดใช้งาน</option>
        </select>
        {(search || brandFilter !== "all" || activeFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setBrandFilter("all"); setActiveFilter("all"); resetPage(); }}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <Filter className="w-3.5 h-3.5" /> ล้าง filter
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} รายการ</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Tag className="w-10 h-10" />
            <p className="text-sm">ไม่พบโปรโมชั่น</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">ชื่อโปรโมชั่น</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider w-28">แบรนด์</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider w-48">ช่วงเวลา</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3 uppercase tracking-wider w-24">ใช้งาน</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="text-sm font-medium text-[#0F172A] line-clamp-1">{p.title}</span>
                    </div>
                    {p.linkUrl && (
                      <a href={p.linkUrl} target="_blank" rel="noopener noreferrer"
                        className="ml-6 text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-3 h-3" />
                        {p.linkUrl.slice(0, 40)}...
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BRAND_COLORS[p.brand] ?? "bg-gray-100 text-gray-600"}`}>
                      {p.brand}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {fmt(p.startDate)} – {fmt(p.endDate)}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <Switch
                      checked={p.isActive}
                      disabled={busyId === p.id}
                      onCheckedChange={(v) => toggleActive(p, v)}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)}
                        className="p-2 text-gray-400 hover:text-[#0F172A] hover:bg-gray-100 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleting(p)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingId ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่นใหม่"}
              </h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">ชื่อโปรโมชั่น *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="เช่น HAVAL H6 HEV ดาวน์ 0% ผ่อน 84 เดือน"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
              {/* Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">แบรนด์</label>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value as typeof BRANDS[number] }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                  >
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                    />
                    <span className="text-sm text-gray-600">{form.isActive ? "ใช้งาน" : "ปิดใช้งาน"}</span>
                  </label>
                </div>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">วันเริ่มต้น</label>
                  <input type="date" value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">วันสิ้นสุด</label>
                  <input type="date" value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
                </div>
              </div>
              {/* Cover Image */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">URL รูปภาพ (Cloudinary)</label>
                <input type="text" value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
              </div>
              {/* Link */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Link (ไม่บังคับ)</label>
                <input type="url" value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-[#0F172A] text-white rounded-xl hover:bg-[#1a2a50] transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editingId ? "บันทึก" : "เพิ่มโปรโมชั่น"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโปรโมชั่น</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ <strong>{deleting?.title}</strong> ออกจากระบบ? ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
