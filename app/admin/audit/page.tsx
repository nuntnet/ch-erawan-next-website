"use client";

import { useEffect, useState } from "react";
import { ScrollText, Filter } from "lucide-react";

type Log = { id: number; userId: string; userName: string | null; action: string; resource: string; resourceId: string | null; details: string | null; createdAt: number };

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "สร้าง", color: "bg-green-50 text-green-700" },
  update: { label: "แก้ไข", color: "bg-blue-50 text-blue-700" },
  delete: { label: "ลบ", color: "bg-red-50 text-red-700" },
  login: { label: "เข้าสู่ระบบ", color: "bg-gray-50 text-gray-700" },
  invite: { label: "เชิญ", color: "bg-purple-50 text-purple-700" },
  ban: { label: "ระงับ", color: "bg-orange-50 text-orange-700" },
  role_change: { label: "เปลี่ยนบทบาท", color: "bg-amber-50 text-amber-700" },
};
const RESOURCES = ["all", "car", "blog", "user", "promotion", "appointment", "feedback", "story"];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [resource, setResource] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (resource !== "all") params.set("resource", resource);
      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) setLogs(await res.json());
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [days, resource]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center"><ScrollText className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-[#0F172A]">Audit Log</h1><p className="text-sm text-[#64748B]">บันทึกการใช้งานระบบ</p></div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
          <option value={7}>7 วันล่าสุด</option>
          <option value={30}>30 วันล่าสุด</option>
          <option value={90}>90 วันล่าสุด</option>
        </select>
        <select value={resource} onChange={(e) => setResource(e.target.value)} className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
          {RESOURCES.map((r) => <option key={r} value={r}>{r === "all" ? "ทุกประเภท" : r}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loading ? <div className="py-16 text-center text-[#94A3B8]">กำลังโหลด...</div> : logs.length === 0 ? (
          <div className="py-16 text-center"><ScrollText className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" /><p className="text-[#94A3B8] text-sm">ยังไม่มี log</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">เวลา</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">ผู้ใช้</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">การกระทำ</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">ประเภท</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">รายละเอียด</th>
            </tr></thead>
            <tbody>
              {logs.map((log) => {
                const actionMeta = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-50 text-gray-700" };
                const ts = new Date(typeof log.createdAt === "number" ? log.createdAt * 1000 : log.createdAt);
                let details = "";
                try { const d = JSON.parse(log.details ?? "{}"); details = Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(", "); } catch {}
                return (
                  <tr key={log.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{ts.toLocaleDateString("th-TH")} {ts.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">{log.userName ?? log.userId.slice(0,8)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionMeta.color}`}>{actionMeta.label}</span></td>
                    <td className="px-4 py-3 text-[#64748B]">{log.resource}{log.resourceId ? ` #${log.resourceId.slice(0,8)}` : ""}</td>
                    <td className="px-4 py-3 text-[#94A3B8] text-xs max-w-[200px] truncate">{details || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
