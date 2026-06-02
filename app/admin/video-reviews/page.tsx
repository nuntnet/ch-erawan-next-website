"use client";

import { useEffect, useState } from "react";
import { Video, Plus, Pencil, Trash2, Search, ExternalLink, Play, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { VideoReview } from "@/lib/notion-types";
import Pagination from "@/components/admin/Pagination";

const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"] as const;
const PLATFORMS = ["YouTube", "TikTok"] as const;
const SOURCES = ["own", "external"] as const;

const SOURCE_LABELS: Record<string, string> = {
  own: "ช่องเรา",
  external: "ช่องอื่น",
};

const SOURCE_COLORS: Record<string, string> = {
  own: "bg-emerald-50 text-emerald-700",
  external: "bg-gray-50 text-gray-600",
};

const BRAND_COLORS: Record<string, string> = {
  Mazda: "bg-red-50 text-red-700",
  Ford: "bg-blue-50 text-blue-700",
  Mitsubishi: "bg-orange-50 text-orange-700",
  GWM: "bg-yellow-50 text-yellow-700",
  Deepal: "bg-purple-50 text-purple-700",
  Kia: "bg-green-50 text-green-700",
};

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: "bg-red-100 text-red-800",
  TikTok: "bg-black/10 text-black",
};

type FormData = {
  title: string;
  brand: typeof BRANDS[number];
  platform: typeof PLATFORMS[number];
  source: typeof SOURCES[number];
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormData = {
  title: "", brand: "GWM", platform: "YouTube", source: "external",
  videoUrl: "", thumbnailUrl: "", description: "",
  isActive: true, sortOrder: 0,
};

/** Extract YouTube video ID */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function AdminVideoReviewsPage() {
  const [items, setItems] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const resetPage = () => setPage(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/video-reviews");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.title.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q);
    const matchBrand = brandFilter === "all" || v.brand === brandFilter;
    const matchPlatform = platformFilter === "all" || v.platform === platformFilter;
    const matchSource = sourceFilter === "all" || v.source === sourceFilter;
    return matchSearch && matchBrand && matchPlatform && matchSource;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (v: VideoReview) => {
    setEditingId(v.id);
    setForm({
      title: v.title,
      brand: v.brand as typeof BRANDS[number],
      platform: v.platform,
      source: (v.source || "external") as typeof SOURCES[number],
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl ?? "",
      description: v.description,
      isActive: v.isActive,
      sortOrder: v.sortOrder,
    });
    setFormOpen(true);
  };

  const handleToggle = async (v: VideoReview) => {
    await fetch("/api/admin/video-reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, isActive: !v.isActive }),
    });
    setItems((prev) => prev.map((x) => x.id === v.id ? { ...x, isActive: !x.isActive } : x));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("กรุณากรอกชื่อรีวิว"); return; }
    if (!form.videoUrl.trim()) { toast.error("กรุณาใส่ลิงก์วิดีโอ"); return; }
    setSaving(true);
    try {
      // Auto-fill YouTube thumbnail if not provided
      const finalThumbnail = form.thumbnailUrl || (
        form.platform === "YouTube"
          ? (() => { const id = getYouTubeId(form.videoUrl); return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : ""; })()
          : ""
      );

      const method = editingId ? "PATCH" : "POST";
      const body = editingId
        ? { id: editingId, ...form, thumbnailUrl: finalThumbnail || null }
        : { ...form, thumbnailUrl: finalThumbnail || null };

      const res = await fetch("/api/admin/video-reviews", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { toast.error("บันทึกไม่สำเร็จ"); return; }
      toast.success(editingId ? "อัพเดทแล้ว" : "เพิ่มรีวิวแล้ว");
      setFormOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/video-reviews?id=${deleteId}`, { method: "DELETE" });
    toast.success("ลบแล้ว");
    setDeleteId(null);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">วิดีโอรีวิว</h1>
            <p className="text-sm text-[#64748B]">{items.length} รายการ</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1E293B] transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรีวิว
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="ค้นหาชื่อรีวิว..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => { setBrandFilter(e.target.value); resetPage(); }}
          className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">— ทุกแบรนด์ —</option>
          {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={platformFilter}
          onChange={(e) => { setPlatformFilter(e.target.value); resetPage(); }}
          className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">— ทุก Platform —</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); resetPage(); }}
          className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">— ทุกแหล่ง —</option>
          <option value="own">ช่องเรา</option>
          <option value="external">ช่องอื่น</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#94A3B8]">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Video className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#94A3B8] text-sm">ไม่พบรีวิว</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                  <th className="text-left px-4 py-3 font-medium text-[#64748B]">รีวิว</th>
                  <th className="text-left px-4 py-3 font-medium text-[#64748B] hidden md:table-cell">แบรนด์</th>
                  <th className="text-left px-4 py-3 font-medium text-[#64748B] hidden sm:table-cell">Platform</th>
                  <th className="text-left px-4 py-3 font-medium text-[#64748B] hidden lg:table-cell">แหล่ง</th>
                  <th className="text-center px-4 py-3 font-medium text-[#64748B]">เผยแพร่</th>
                  <th className="text-right px-4 py-3 font-medium text-[#64748B]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((v) => {
                  const ytId = v.platform === "YouTube" ? getYouTubeId(v.videoUrl) : null;
                  const thumb = v.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
                  return (
                    <tr key={v.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-16 h-10 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="w-16 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <Play className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[#0F172A] truncate max-w-[200px] lg:max-w-[350px]">{v.title}</p>
                            {v.description && (
                              <p className="text-[#94A3B8] text-xs truncate max-w-[200px] lg:max-w-[350px]">{v.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BRAND_COLORS[v.brand] ?? "bg-gray-50 text-gray-700"}`}>
                          {v.brand}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[v.platform] ?? ""}`}>
                          {v.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[v.source] ?? SOURCE_COLORS.external}`}>
                          {SOURCE_LABELS[v.source] ?? "ช่องอื่น"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={v.isActive}
                          onCheckedChange={() => handleToggle(v)}
                          className="data-[state=checked]:bg-[#0F172A]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] transition-colors"
                            title="เปิดวิดีโอ">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button onClick={() => openEdit(v)}
                            className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(v.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-[#F1F5F9] px-4 py-3">
              <Pagination
                page={page}
                totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Form Dialog */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">
                {editingId ? "แก้ไขรีวิว" : "เพิ่มรีวิวใหม่"}
              </h3>
              <button onClick={() => setFormOpen(false)} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">ชื่อรีวิว *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" placeholder="ชื่อรีวิวรถ..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">แบรนด์ *</label>
                  <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value as typeof BRANDS[number] }))}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Platform *</label>
                  <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as typeof PLATFORMS[number] }))}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">แหล่งที่มา</label>
                  <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as typeof SOURCES[number] }))}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
                    <option value="own">ช่องเรา</option>
                    <option value="external">ช่องอื่น</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">URL วิดีโอ *</label>
                <input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
                  placeholder="https://youtube.com/watch?v=..." />
                {form.platform === "YouTube" && (
                  <p className="text-xs text-[#94A3B8] mt-1">Thumbnail YouTube จะถูกดึงอัตโนมัติ</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">URL Thumbnail (optional)</label>
                <input value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"
                  placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">คำอธิบาย</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm resize-none"
                  placeholder="คำอธิบายสั้นๆ..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">ลำดับ</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: +e.target.value }))}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                      className="data-[state=checked]:bg-[#0F172A]" />
                    <span className="text-sm text-[#64748B]">เผยแพร่</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-[#E2E8F0]">
              <button onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC]">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E293B] disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบรีวิวนี้?</AlertDialogTitle>
            <AlertDialogDescription>การกระทำนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
