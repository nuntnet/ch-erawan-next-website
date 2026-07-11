"use client";

import { useEffect, useState } from "react";
import { Check, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import type { CustomerStory } from "@/lib/notion-types";

const STATUS_TABS = [
  { value: "pending",  label: "รอตรวจสอบ" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "rejected", label: "ปฏิเสธ" },
] as const;

type Tab = typeof STATUS_TABS[number]["value"];

export default function AdminStories() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [stories, setStories] = useState<CustomerStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchStories = (status: Tab) => {
    setLoading(true);
    fetch(`/api/admin/stories?status=${status}`)
      .then(r => r.json())
      .then(data => setStories(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStories(activeTab); }, [activeTab]);

  const moderate = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      const res = await fetch("/api/admin/stories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error();
      setStories(prev => prev.filter(s => s.id !== id));
      toast.success(action === "approve" ? "อนุมัติสำเร็จ" : "ปฏิเสธสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">รีวิวลูกค้า</h1>
        <p className="text-sm text-gray-500 mt-0.5">ตรวจสอบและอนุมัติรีวิวจากลูกค้า</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.value
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
          <MessageSquare className="w-10 h-10" />
          <p className="text-sm">ไม่มีรีวิวในหมวดนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map(story => (
            <div key={story.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-[#0F172A]">{story.customerName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{story.carModel || "—"}</p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < story.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{story.story}</p>

              {(story.customerEmail || story.customerPhone) && (
                <div className="text-xs text-gray-400 space-y-0.5 border-t border-gray-50 pt-2">
                  {story.customerPhone && <p>📞 {story.customerPhone}</p>}
                  {story.customerEmail && <p>✉️ {story.customerEmail}</p>}
                </div>
              )}

              <p className="text-xs text-gray-300">
                {new Date(story.submittedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              {activeTab === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => moderate(story.id, "approve")}
                    disabled={acting === story.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" />
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => moderate(story.id, "reject")}
                    disabled={acting === story.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5" />
                    ปฏิเสธ
                  </button>
                </div>
              )}
              {activeTab === "approved" && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  เผยแพร่บนเว็บแล้ว
                </div>
              )}
              {activeTab === "rejected" && (
                <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                  <X className="w-3.5 h-3.5" />
                  ปฏิเสธแล้ว
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
