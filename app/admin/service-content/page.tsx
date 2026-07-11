"use client";

import { useEffect, useState } from "react";
import {
  Shield, Plus, Pencil, Trash2, Search, ExternalLink,
  FileText, ToggleLeft, ToggleRight, GripVertical, X, Check,
  HelpCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import type { FAQItem } from "@/lib/notion-types";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { InsurancePartner, ServicePageSection } from "@/lib/notion-types";

const BRANDS_INS = ["ทุกแบรนด์", "Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"] as const;
const BRANDS_SVC = ["GWM", "Mazda", "Ford", "Mitsubishi", "Deepal", "Kia"] as const;
const PAGES_SVC = ["body-repair", "service", "one-stop"] as const;
const PAGE_LABELS: Record<string, string> = { "body-repair": "ซ่อมสี/ตัวถัง", "service": "ศูนย์บริการ", "one-stop": "One Stop" };

// ── Insurance Partners ──────────────────────────────────────────────

function InsuranceTab() {
  const [items, setItems] = useState<InsurancePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState<typeof BRANDS_INS[number]>("ทุกแบรนด์");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<InsurancePartner | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<InsurancePartner | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/admin/insurance-partners").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(fetch_, []);

  const toggle = async (item: InsurancePartner, val: boolean) => {
    setBusyId(item.id);
    setItems(p => p.map(x => x.id === item.id ? { ...x, isActive: val } : x));
    try {
      await fetch("/api/admin/insurance-partners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, isActive: val }) });
      toast.success(val ? "เปิดใช้งาน" : "ปิดใช้งาน");
    } catch { setItems(p => p.map(x => x.id === item.id ? { ...x, isActive: !val } : x)); toast.error("เกิดข้อผิดพลาด"); }
    finally { setBusyId(null); }
  };

  const addNew = async () => {
    if (!newName.trim()) { toast.error("กรุณาใส่ชื่อ"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/insurance-partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim(), brand: newBrand }) });
      if (!res.ok) throw new Error();
      toast.success("เพิ่มบริษัทประกันแล้ว");
      setAdding(false); setNewName(""); fetch_();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!editing || !editName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/insurance-partners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, name: editName.trim() }) });
      toast.success("แก้ไขแล้ว");
      setEditing(null); fetch_();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleting) return;
    const id = deleting.id; setDeleting(null);
    try {
      await fetch(`/api/admin/insurance-partners?id=${id}`, { method: "DELETE" });
      setItems(p => p.filter(x => x.id !== id)); toast.success("ลบแล้ว");
    } catch { toast.error("ลบไม่สำเร็จ"); }
  };

  const filtered = items.filter(x => !search || x.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a2a50] transition-colors">
          <Plus className="w-4 h-4" /> เพิ่มบริษัทประกัน
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addNew()} placeholder="ชื่อบริษัทประกัน" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
          <select value={newBrand} onChange={e => setNewBrand(e.target.value as typeof BRANDS_INS[number])} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
            {BRANDS_INS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={addNew} disabled={saving} className="p-2 bg-[#0F172A] text-white rounded-lg hover:bg-[#1a2a50] disabled:opacity-50">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setAdding(false); setNewName(""); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-0 text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5 bg-gray-50/50 border-b border-gray-100">
            <div className="w-6" /><div>ชื่อบริษัทประกัน</div><div className="px-6 text-center">แบรนด์</div><div className="px-4 text-center">ใช้งาน</div><div className="px-4" />
          </div>
          {filtered.map((item) => (
            <div key={item.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-0 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
              <div className="px-2 text-gray-300"><GripVertical className="w-4 h-4" /></div>
              {editing?.id === item.id ? (
                <div className="flex items-center gap-2 py-2">
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }} className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none" />
                  <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="py-3 text-sm font-medium text-[#0F172A]">{item.name}</div>
              )}
              <div className="px-6 text-center">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.brand}</span>
              </div>
              <div className="px-4 flex justify-center">
                <Switch checked={item.isActive} disabled={busyId === item.id} onCheckedChange={v => toggle(item, v)} />
              </div>
              <div className="px-4 flex items-center gap-1">
                <button onClick={() => { setEditing(item); setEditName(item.name); }} className="p-1.5 text-gray-400 hover:text-[#0F172A] hover:bg-gray-100 rounded-lg">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleting(item)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-10 text-center text-sm text-gray-400">ไม่พบรายการ</div>}
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบบริษัทประกัน</AlertDialogTitle>
            <AlertDialogDescription>ลบ <strong>{deleting?.name}</strong>?</AlertDialogDescription>
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

// ── Service Sections ────────────────────────────────────────────────

function SectionsTab() {
  const [sections, setSections] = useState<ServicePageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", page: "body-repair" as typeof PAGES_SVC[number], brand: "GWM" as typeof BRANDS_SVC[number], sectionKey: "", sortOrder: 99 });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/admin/service-content").then(r => r.json()).then(d => setSections(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(fetch_, []);

  const addNew = async () => {
    if (!form.title.trim()) { toast.error("กรุณาใส่ชื่อ section"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/service-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success("เพิ่ม Section แล้ว — แก้ content ใน Notion ได้เลย");
      setAdding(false); fetch_();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  const togglePublish = async (s: ServicePageSection, val: boolean) => {
    setBusyId(s.id);
    setSections(p => p.map(x => x.id === s.id ? { ...x, isPublished: val } : x));
    try {
      await fetch("/api/admin/service-content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, isPublished: val }) });
      toast.success(val ? "เผยแพร่แล้ว" : "ซ่อนแล้ว");
    } catch { setSections(p => p.map(x => x.id === s.id ? { ...x, isPublished: !val } : x)); toast.error("เกิดข้อผิดพลาด"); }
    finally { setBusyId(null); }
  };

  const grouped = PAGES_SVC.reduce<Record<string, ServicePageSection[]>>((acc, p) => {
    acc[p] = sections.filter(s => s.page === p);
    return acc;
  }, {} as Record<string, ServicePageSection[]>);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a2a50] transition-colors">
          <Plus className="w-4 h-4" /> เพิ่ม Section
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-[#0F172A] text-sm">เพิ่ม Section ใหม่</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ชื่อ Section *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="เช่น บริษัทประกันที่รับซ่อม" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">หน้า</label>
              <select value={form.page} onChange={e => setForm(f => ({ ...f, page: e.target.value as typeof PAGES_SVC[number] }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                {PAGES_SVC.map(p => <option key={p} value={p}>{PAGE_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">แบรนด์</label>
              <select value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value as typeof BRANDS_SVC[number] }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                {BRANDS_SVC.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Section Key (optional)</label>
              <input value={form.sectionKey} onChange={e => setForm(f => ({ ...f, sectionKey: e.target.value }))} placeholder="เช่น gallery, process, faq" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ลำดับ</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            💡 หลังสร้างแล้ว ระบบจะสร้าง Notion page ให้ — แก้ content (ข้อความ + รูป) ได้ที่ Notion โดยตรง
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100">ยกเลิก</button>
            <button onClick={addNew} disabled={saving} className="px-4 py-2 text-sm font-medium bg-[#0F172A] text-white rounded-xl hover:bg-[#1a2a50] disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              สร้าง Section
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        Object.entries(grouped).map(([pageKey, items]) => (
          <div key={pageKey} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">{PAGE_LABELS[pageKey]} ({items.length} sections)</h3>
            </div>
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">ยังไม่มี sections — เพิ่มจากปุ่มด้านบน</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map(section => (
                  <div key={section.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#0F172A]">{section.title}</div>
                      {section.sectionKey && <div className="text-xs text-gray-400 mt-0.5 font-mono">{section.sectionKey}</div>}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{section.brand}</span>
                    <a
                      href={section.notionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline shrink-0 bg-blue-50 px-2.5 py-1.5 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      แก้ใน Notion
                    </a>
                    <Switch
                      checked={section.isPublished}
                      disabled={busyId === section.id}
                      onCheckedChange={v => togglePublish(section, v)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────

// ── FAQ Tab ─────────────────────────────────────────────────────────

// PAGE_LABELS defined at line 21 — reused here
const BRANDS_FAQ = ["GWM", "Mazda", "Ford", "Mitsubishi", "Deepal", "Kia", "ทุกแบรนด์"] as const;
const PAGES_FAQ = ["body-repair", "service"] as const;

type FAQForm = { question: string; answer: string; page: string; brand: string; isActive: boolean; sortOrder: number };
const EMPTY_FAQ: FAQForm = { question: "", answer: "", page: "body-repair", brand: "ทุกแบรนด์", isActive: true, sortOrder: 99 };

function FAQTab() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>(EMPTY_FAQ);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<FAQItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/admin/faq").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(fetch_, []);

  const openAdd = () => {
    setEditingId(null);
    // Filters can be "all" (not a valid FAQ value) — fall back to sane defaults.
    setForm({
      ...EMPTY_FAQ,
      page: pageFilter === "all" ? EMPTY_FAQ.page : (pageFilter as FAQForm["page"]),
      brand: brandFilter === "all" ? EMPTY_FAQ.brand : (brandFilter as FAQForm["brand"]),
    });
    setFormOpen(true);
  };
  const openEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setForm({ question: item.question, answer: item.answer, page: item.page, brand: item.brand, isActive: item.isActive, sortOrder: item.sortOrder });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) { toast.error("กรุณาใส่คำถามและคำตอบ"); return; }
    setSaving(true);
    try {
      const payload = editingId ? { id: editingId, ...form } : form;
      const res = await fetch("/api/admin/faq", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "อัปเดตแล้ว" : "เพิ่ม FAQ แล้ว");
      setFormOpen(false);
      fetch_();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  const toggle = async (item: FAQItem, val: boolean) => {
    setBusyId(item.id);
    setItems(p => p.map(x => x.id === item.id ? { ...x, isActive: val } : x));
    try {
      await fetch("/api/admin/faq", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, isActive: val }) });
      toast.success(val ? "เปิดใช้งาน" : "ซ่อนแล้ว");
    } catch { setItems(p => p.map(x => x.id === item.id ? { ...x, isActive: !val } : x)); toast.error("เกิดข้อผิดพลาด"); }
    finally { setBusyId(null); }
  };

  const del = async () => {
    if (!deleting) return;
    const id = deleting.id; setDeleting(null);
    try {
      await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
      setItems(p => p.filter(x => x.id !== id));
      toast.success("ลบแล้ว");
    } catch { toast.error("ลบไม่สำเร็จ"); }
  };

  const filtered = items.filter(x =>
    (brandFilter === "all" || x.brand === brandFilter) &&
    (pageFilter === "all" || x.page === pageFilter)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="all">— ทุกแบรนด์ —</option>
          {BRANDS_FAQ.filter(b => b !== "ทุกแบรนด์").map(b => <option key={b} value={b}>{b}</option>)}
          <option value="ทุกแบรนด์">ทุกแบรนด์ (ทั่วไป)</option>
        </select>
        <select value={pageFilter} onChange={e => setPageFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="all">— ทุกหน้า —</option>
          {PAGES_FAQ.map(p => <option key={p} value={p}>{PAGE_LABELS[p]}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} รายการ</span>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a2a50] transition-colors">
          <Plus className="w-4 h-4" /> เพิ่ม FAQ
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-2 text-gray-400 bg-white rounded-xl border border-gray-100">
          <HelpCircle className="w-8 h-8" />
          <p className="text-sm">ยังไม่มี FAQ</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {filtered.map(item => (
            <div key={item.id}>
              <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="mt-0.5 text-gray-400 hover:text-[#0F172A] transition-colors shrink-0">
                  {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">{item.question}</p>
                  {expandedId === item.id && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.answer}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{PAGE_LABELS[item.page] || item.page}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.brand}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch checked={item.isActive} disabled={busyId === item.id} onCheckedChange={v => toggle(item, v)} />
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-[#0F172A] hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleting(item)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#0F172A]">{editingId ? "แก้ไข FAQ" : "เพิ่ม FAQ ใหม่"}</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">แบรนด์</label>
                  <select value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {BRANDS_FAQ.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">หน้า</label>
                  <select value={form.page} onChange={e => setForm(f => ({ ...f, page: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    {PAGES_FAQ.map(p => <option key={p} value={p}>{PAGE_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">คำถาม *</label>
                <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} autoFocus
                  placeholder="เช่น ซ่อมสีรถใช้เวลานานแค่ไหน?"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">คำตอบ *</label>
                <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={4}
                  placeholder="คำตอบที่ชัดเจนและกระชับ"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">ลำดับ</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                    <span className="text-sm text-gray-600">{form.isActive ? "เผยแพร่" : "ซ่อน"}</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100">ยกเลิก</button>
              <button onClick={save} disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-[#0F172A] text-white rounded-xl hover:bg-[#1a2a50] disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <Check className="w-4 h-4" />
                {editingId ? "บันทึก" : "เพิ่ม FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ FAQ</AlertDialogTitle>
            <AlertDialogDescription>ลบ <strong>{deleting?.question}</strong>?</AlertDialogDescription>
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

export default function ServiceContentAdminPage() {
  const [tab, setTab] = useState<"insurance" | "sections" | "faq">("insurance");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Brand Web Content</h1>
        <p className="text-sm text-gray-500 mt-0.5">จัดการ content หน้า service และ body-repair</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: "insurance", label: "บริษัทประกัน", icon: Shield },
          { key: "faq",       label: "FAQ",           icon: HelpCircle },
          { key: "sections",  label: "Rich Sections",  icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as "insurance" | "sections" | "faq")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? "bg-white text-[#0F172A] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "insurance" ? <InsuranceTab /> : tab === "faq" ? <FAQTab /> : <SectionsTab />}
    </div>
  );
}
