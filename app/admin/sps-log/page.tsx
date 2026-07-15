"use client";

import { Fragment, useEffect, useState } from "react";
import { Send, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import { toast } from "sonner";

type SpsLog = {
  id: number;
  branch: string;
  branchId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  requestPayload: string | null;
  responseStatus: number | null;
  responseBody: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: number;
};

const BRANCHES = [
  "all",
  "มาสด้า ช.เอราวัณ นครปฐม",
  "มาสด้า ช.เอราวัณ ศาลายา",
  "ฟอร์ด ช.เอราวัณ อ้อมใหญ่",
  "ฟอร์ด ช.เอราวัณ นครปฐม",
  "มิตซูบิชิ ช.เอราวัณ นครปฐม",
  "GWM ช.เอราวัณ นครปฐม",
  "Deepal ช.เอราวัณ ศาลายา",
  "Kia ช.เอราวัณ นครปฐม",
];

export default function AdminSpsLogPage() {
  const [logs, setLogs] = useState<SpsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (branch !== "all") params.set("branch", branch);
      if (status !== "all") params.set("success", status === "success" ? "true" : "false");
      const res = await fetch(`/api/admin/sps-log?${params}`);
      if (res.ok) setLogs(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [days, branch, status]);

  const handleRetry = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/sps-log/${id}/retry`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message ?? "ส่งซ้ำสำเร็จ");
      } else {
        toast.error(json.message ?? json.error ?? "ส่งซ้ำไม่สำเร็จ");
      }
      await load();
    } catch {
      toast.error("เกิดข้อผิดพลาดขณะส่งซ้ำ");
    } finally {
      setRetryingId(null);
    }
  };

  const failedCount = logs.filter((l) => !l.success).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">SPS Booking Log</h1>
            <p className="text-sm text-[#64748B]">
              บันทึกการส่งนัดหมายบริการไปยังระบบ SPS — {logs.length} รายการ
              {failedCount > 0 ? ` · ${failedCount} รายการล้มเหลว` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
          <option value={7}>7 วันล่าสุด</option>
          <option value={30}>30 วันล่าสุด</option>
          <option value={90}>90 วันล่าสุด</option>
        </select>
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
          {BRANCHES.map((b) => <option key={b} value={b}>{b === "all" ? "ทุกสาขา" : b}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm">
          <option value="all">ทุกสถานะ</option>
          <option value="success">สำเร็จ</option>
          <option value="failed">ล้มเหลว</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#94A3B8]">กำลังโหลด...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Send className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#94A3B8] text-sm">ยังไม่มี log</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <th className="text-left px-4 py-3 font-medium text-[#64748B]">เวลา</th>
                <th className="text-left px-4 py-3 font-medium text-[#64748B]">สาขา</th>
                <th className="text-left px-4 py-3 font-medium text-[#64748B]">ลูกค้า</th>
                <th className="text-left px-4 py-3 font-medium text-[#64748B]">วันที่นัด</th>
                <th className="text-left px-4 py-3 font-medium text-[#64748B]">สถานะ</th>
                <th className="text-left px-4 py-3 font-medium text-[#64748B]" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const ts = new Date(typeof log.createdAt === "number" ? log.createdAt * 1000 : log.createdAt);
                const isOpen = expanded === log.id;
                let prettyPayload = log.requestPayload;
                try {
                  if (log.requestPayload) prettyPayload = JSON.stringify(JSON.parse(log.requestPayload), null, 2);
                } catch {}
                return (
                  <Fragment key={log.id}>
                    <tr
                      className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">
                        {ts.toLocaleDateString("th-TH")} {ts.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-[#0F172A]">{log.branch}</td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {log.customerName ?? "—"}{log.customerPhone ? ` · ${log.customerPhone}` : ""}
                      </td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">
                        {log.preferredDate ?? "—"} {log.preferredTime ?? ""}
                      </td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">สำเร็จ</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">
                              ล้มเหลว{log.responseStatus ? ` (${log.responseStatus})` : ""}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleRetry(log.id, e)}
                              disabled={retryingId === log.id}
                              className="flex items-center gap-1 text-xs font-medium text-[#0F172A] hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                              <RotateCw className={`w-3.5 h-3.5 ${retryingId === log.id ? "animate-spin" : ""}`} />
                              ลองส่งใหม่
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8]">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-[#0F172A] mb-1">
                                ข้อมูลที่ส่งไป SPS (branch_id: {log.branchId ?? "—"})
                              </p>
                              <pre className="bg-white border border-[#E2E8F0] rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                                {prettyPayload || "—"}
                              </pre>
                            </div>
                            <div>
                              <p className="font-semibold text-[#0F172A] mb-1">
                                คำตอบจาก SPS{log.responseStatus ? ` (HTTP ${log.responseStatus})` : ""}
                              </p>
                              <pre className="bg-white border border-[#E2E8F0] rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                                {log.errorMessage ? `Error: ${log.errorMessage}` : (log.responseBody || "—")}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
