"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquare, Phone, Search } from "lucide-react";
import type { ContactSubmission } from "@/lib/notion-types";

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/contacts")
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const branches = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.branch && set.add(c.branch));
    return Array.from(set);
  }, [contacts]);

  const filtered = contacts.filter((c) => {
    if (branchFilter !== "all" && c.branch !== branchFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(search) ||
        c.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#131F3C]">ข้อความติดต่อ</h1>
        <p className="text-sm text-gray-500 mt-0.5">ข้อความจากลูกค้าผ่านฟอร์มติดต่อเรา</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ / อีเมล / เบอร์ / ข้อความ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#131F3C]/20"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none"
        >
          <option value="all">ทุกสาขา</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <MessageSquare className="w-10 h-10" />
            <p className="text-sm">ยังไม่มีข้อความติดต่อ</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-48">ลูกค้า</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">ข้อความ</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-28">สาขา</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-28">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors align-top">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-[#131F3C]">{c.name}</p>
                    <div className="text-xs text-gray-400 space-y-0.5 mt-1">
                      {c.phone && (
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</p>
                      )}
                      {c.email && (
                        <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-pre-wrap">{c.message}</td>
                  <td className="px-5 py-4">
                    {c.branch ? (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">{c.branch}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {c.submittedAt
                      ? new Date(c.submittedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
