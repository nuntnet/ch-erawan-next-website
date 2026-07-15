"use client";

import { useEffect, useState } from "react";
import { Calendar, Search, ChevronDown, Phone, Mail, FileText, Car, MapPin, Clock, MessageSquare, Shield, AlertTriangle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import type { Appointment } from "@/lib/notion-types";

type SpsStatus = { id: number; success: boolean; createdAt: number };

const TYPE_LABEL: Record<string, string> = {
  test_drive: "ทดลองขับ",
  service: "บริการหลังการขาย",
  body_paint: "ซ่อมสีตัวถัง",
  insurance_quote: "ประกันภัย",
};

const STATUS_OPTIONS = [
  { value: "pending",   label: "รอดำเนินการ" },
  { value: "confirmed", label: "ยืนยันแล้ว" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending:   "bg-amber-50 border-amber-200 text-amber-700",
    confirmed: "bg-blue-50 border-blue-200 text-blue-700",
    completed: "bg-emerald-50 border-emerald-200 text-emerald-700",
    cancelled: "bg-red-50 border-red-200 text-red-600",
  };
  return map[status] ?? "bg-gray-50 border-gray-200 text-gray-600";
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-700 whitespace-pre-line break-words">{value}</p>
      </div>
    </div>
  );
}

export default function AdminAppointments() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [spsStatus, setSpsStatus] = useState<Record<string, SpsStatus>>({});
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchSpsStatus = (list: Appointment[]) => {
    const ids = list.filter(a => a.type === "service").map(a => a.id);
    if (ids.length === 0) return;
    fetch(`/api/admin/appointments/sps-status?ids=${ids.join(",")}`)
      .then(r => r.json())
      .then(data => setSpsStatus(data && typeof data === "object" ? data : {}))
      .catch(() => {});
  };

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/appointments")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAppointments(list);
        fetchSpsStatus(list);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRetry = async (apt: Appointment) => {
    const status = spsStatus[apt.id];
    if (!status) return;
    setRetryingId(apt.id);
    try {
      const res = await fetch(`/api/admin/sps-log/${status.id}/retry`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message ?? "ส่งซ้ำสำเร็จ");
      } else {
        toast.error(json.message ?? json.error ?? "ส่งซ้ำไม่สำเร็จ");
      }
      fetchSpsStatus(appointments);
    } catch {
      toast.error("เกิดข้อผิดพลาดขณะส่งซ้ำ");
    } finally {
      setRetryingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: Appointment["status"]) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success("อัปเดตสถานะสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = appointments.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.customerName.toLowerCase().includes(q) || a.customerPhone.includes(search);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">นัดหมาย</h1>
        <p className="text-sm text-gray-500 mt-0.5">จัดการนัดหมายทดลองขับและบริการ</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ / เบอร์โทร..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
          <option value="all">ทุกประเภท</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
          <option value="all">ทุกสถานะ</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Calendar className="w-10 h-10" />
            <p className="text-sm">ไม่มีนัดหมาย</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              {/* Header mirrors the flex layout of each body row (which is a single
                  colSpan cell) so columns line up. */}
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th colSpan={6} className="p-0">
                  <div className="flex items-center text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="px-5 py-3 flex-1 min-w-0">ลูกค้า</div>
                    <div className="px-5 py-3 w-32 shrink-0">ประเภท</div>
                    <div className="px-5 py-3 flex-1 min-w-0">รถยนต์ / สาขา</div>
                    <div className="px-5 py-3 w-32 shrink-0">วันที่นัด</div>
                    <div className="px-5 py-3 w-36 shrink-0">สถานะ</div>
                    <div className="px-3 py-3 w-10 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(apt => {
                const isExpanded = expandedId === apt.id;
                const sps = apt.type === "service" ? spsStatus[apt.id] : undefined;
                const spsFailed = sps && !sps.success;
                return (
                  <tr key={apt.id} className="group">
                    <td colSpan={6} className="p-0">
                      <div
                        className="flex items-center hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                      >
                        <div className="px-5 py-4 flex-1 min-w-0" style={{ width: "auto" }}>
                          <p className="text-sm font-medium text-[#0F172A]">{apt.customerName}</p>
                          <p className="text-xs text-gray-400">{apt.customerPhone}</p>
                        </div>
                        <div className="px-5 py-4 w-32 shrink-0 space-y-1">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {TYPE_LABEL[apt.type] ?? apt.type}
                          </span>
                          {spsFailed && (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <span className="flex items-center gap-1 text-[10px] font-medium text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                ส่ง SPS ไม่สำเร็จ
                              </span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRetry(apt)}
                                  disabled={retryingId === apt.id}
                                  title="ลองส่งใหม่เข้า SPS"
                                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                >
                                  <RotateCw className={`w-3 h-3 ${retryingId === apt.id ? "animate-spin" : ""}`} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="px-5 py-4 flex-1 min-w-0">
                          <p className="text-sm text-gray-600">{apt.carModel || "—"}</p>
                          {apt.branch && <p className="text-xs text-gray-400">{apt.branch}</p>}
                        </div>
                        <div className="px-5 py-4 w-32 shrink-0 text-sm text-gray-600">
                          {apt.preferredDate
                            ? new Date(apt.preferredDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
                            : "—"}
                          {apt.preferredTime && <span className="text-xs text-gray-400 ml-1">{apt.preferredTime}</span>}
                        </div>
                        <div className="px-5 py-4 w-36 shrink-0" onClick={e => e.stopPropagation()}>
                          <select
                            value={apt.status}
                            disabled={updating === apt.id}
                            onChange={e => handleStatusChange(apt.id, e.target.value as Appointment["status"])}
                            className={`text-xs font-medium px-2 py-1 rounded-lg border focus:outline-none cursor-pointer disabled:opacity-60 ${statusClass(apt.status)}`}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div className="px-3 py-4 w-10 shrink-0">
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 bg-gray-50/70 border-t border-gray-100">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                            <DetailItem icon={Phone} label="เบอร์โทร" value={apt.customerPhone} />
                            <DetailItem icon={Mail} label="อีเมล" value={apt.customerEmail} />
                            <DetailItem icon={Car} label="รุ่นรถ" value={apt.carModel} />
                            <DetailItem icon={MapPin} label="สาขา" value={apt.branch} />
                            <DetailItem icon={Calendar} label="วันที่ต้องการ" value={apt.preferredDate ? new Date(apt.preferredDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : undefined} />
                            <DetailItem icon={Clock} label="เวลา" value={apt.preferredTime} />
                            <DetailItem icon={MessageSquare} label="หมายเหตุ" value={apt.notes} />
                            <DetailItem icon={FileText} label="รายละเอียดความเสียหาย" value={apt.damageDescription} />
                            <DetailItem icon={Shield} label="บริษัทประกัน" value={apt.insuranceCompany} />
                            <DetailItem icon={Car} label="ทะเบียนรถ" value={apt.vehicleRegistration} />
                            <DetailItem icon={Shield} label="ประเภทความคุ้มครอง" value={apt.coverageType} />
                            <DetailItem icon={Calendar} label="วันที่ส่ง" value={apt.submittedAt ? new Date(apt.submittedAt).toLocaleString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : undefined} />
                          </div>
                        </div>
                      )}
                    </td>
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
