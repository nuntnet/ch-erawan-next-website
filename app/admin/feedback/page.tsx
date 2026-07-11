"use client";

import { useEffect, useState } from "react";
import { MessageSquareWarning, Search, Phone, Mail, Car, Calendar, Building, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { CustomerFeedback } from "@/lib/notion-types";

const STATUS_COLORS: Record<CustomerFeedback["status"], { badge: string; dot: string }> = {
  "ใหม่":               { badge: "bg-red-50 text-red-700 border-red-200",    dot: "bg-red-500" },
  "กำลังดำเนินการ":    { badge: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  "แก้ไขแล้ว":         { badge: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
};

const TYPE_COLORS: Record<string, string> = {
  "ร้องเรียน": "bg-red-50 text-red-700",
  "ชมเชย":     "bg-green-50 text-green-700",
  "เสนอแนะ":  "bg-blue-50 text-blue-700",
};

const STATUSES: CustomerFeedback["status"][] = ["ใหม่", "กำลังดำเนินการ", "แก้ไขแล้ว"];

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchItems = () => {
    setLoading(true);
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const updateStatus = async (item: CustomerFeedback, status: CustomerFeedback["status"]) => {
    setBusyId(item.id);
    setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status } : x));
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`อัปเดตสถานะเป็น "${status}"`);
    } catch {
      setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: item.status } : x));
      toast.error("อัปเดตไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.phone.includes(q) || item.branch.toLowerCase().includes(q) || item.message.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || item.type === typeFilter;
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const newCount = items.filter((i) => i.status === "ใหม่").length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0F172A]">Feedback</h1>
            {newCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {newCount} ใหม่
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} รายการทั้งหมด</p>
        </div>
        <a
          href="/feedback"
          target="_blank"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          ดูหน้า Feedback →
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ เบอร์ ข้อความ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 w-64"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
        >
          <option value="all">ทุกประเภท</option>
          <option value="ร้องเรียน">ร้องเรียน</option>
          <option value="ชมเชย">ชมเชย</option>
          <option value="เสนอแนะ">เสนอแนะ</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
        >
          <option value="all">ทุกสถานะ</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-gray-400 bg-white rounded-xl border border-gray-100">
          <MessageSquareWarning className="w-10 h-10" />
          <p className="text-sm">ยังไม่มี Feedback</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const { badge, dot } = STATUS_COLORS[item.status] ?? STATUS_COLORS["ใหม่"];
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Summary row */}
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${dot}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-[#0F172A]">{item.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-400">{item.brand} · {item.branch}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{item.message}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />{item.department}
                      </span>
                      {item.serviceDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.serviceDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                        </span>
                      )}
                      {item.licensePlate && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />{item.licensePlate}
                        </span>
                      )}
                      <span className="text-gray-300">·</span>
                      <span>
                        {new Date(item.submittedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Status badge + expand */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${badge}`}>
                      {item.status}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-4">
                    {/* Contact */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                        <Phone className="w-4 h-4" />{item.phone}
                      </a>
                      {item.email && (
                        <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                          <Mail className="w-4 h-4" />{item.email}
                        </a>
                      )}
                    </div>

                    {/* Full message */}
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </div>

                    {/* Status actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">อัปเดตสถานะ:</span>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={busyId === item.id || item.status === s}
                          onClick={() => updateStatus(item, s)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                            item.status === s
                              ? STATUS_COLORS[s].badge + " cursor-default"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
