"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2, Shield, Ban, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type User = { id: string; name: string | null; email: string; role: string | null; banned: boolean | null; createdAt: string | null };
const ROLES = ["admin", "editor", "user"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        toast.error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ", {
          description: res.status === 403 ? "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" : `เกิดข้อผิดพลาด (${res.status})`,
        });
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const openCreate = () => { setEditingId(null); setForm({ name: "", email: "", password: "", role: "user" }); setFormOpen(true); };
  const openEdit = (u: User) => { setEditingId(u.id); setForm({ name: u.name ?? "", email: u.email, password: "", role: u.role ?? "user" }); setFormOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name: form.name, role: form.role }) });
        if (!res.ok) { toast.error("อัพเดทไม่สำเร็จ"); return; }
        toast.success("อัพเดทผู้ใช้สำเร็จ");
      } else {
        if (!form.email || !form.password) { toast.error("กรุณากรอก email และ password"); return; }
        const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form) });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toast.error(data?.error === "User already exists. Use another email."
            ? "อีเมลนี้มีผู้ใช้อยู่แล้วในระบบ"
            : data?.error || "สร้างผู้ใช้ไม่สำเร็จ");
          return;
        }
        toast.success("สร้างผู้ใช้สำเร็จ");
      }
      setFormOpen(false); load();
    } finally { setSaving(false); }
  };

  const handleToggleBan = async (u: User) => {
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, banned: !u.banned }) });
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, banned: !x.banned } : x));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/users?id=${deleteId}`, { method: "DELETE" });
    toast.success("ลบผู้ใช้แล้ว"); setDeleteId(null); load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-[#0F172A]">จัดการผู้ใช้</h1><p className="text-sm text-[#64748B]">{users.length} ผู้ใช้</p></div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1E293B]">
          <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ / email..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loading ? <div className="py-16 text-center text-[#94A3B8]">กำลังโหลด...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">ชื่อ</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">Email</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">Role</th>
              <th className="text-center px-4 py-3 font-medium text-[#64748B]">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium text-[#64748B]">จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3"><div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold">{(u.name ?? u.email)[0].toUpperCase()}</div>
                    <span className="font-medium text-[#0F172A]">{u.name ?? "—"}</span>
                  </div></td>
                  <td className="px-4 py-3 text-[#64748B]">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-red-50 text-red-700" : u.role === "editor" ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-700"}`}>{u.role ?? "user"}</span></td>
                  <td className="px-4 py-3 text-center">
                    {u.banned ? <span className="text-xs text-red-500 font-medium">ถูกระงับ</span> : <span className="text-xs text-green-600 font-medium">ปกติ</span>}
                  </td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#64748B]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleToggleBan(u)} className="p-1.5 hover:bg-orange-50 rounded-lg text-orange-400" title={u.banned ? "ปลดระงับ" : "ระงับผู้ใช้"}><Ban className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">{editingId ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</h3>
              <button onClick={() => setFormOpen(false)} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-[#0F172A] mb-1.5">ชื่อ</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!!editingId}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm disabled:opacity-50" /></div>
              {!editingId && <div><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" placeholder="อย่างน้อย 8 ตัว" /></div>}
              <div><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select></div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-[#E2E8F0]">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC]">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E293B] disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader>
          <AlertDialogTitle>ลบผู้ใช้นี้?</AlertDialogTitle>
          <AlertDialogDescription>การกระทำนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">ลบ</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
