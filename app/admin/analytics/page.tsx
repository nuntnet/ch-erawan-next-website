"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Car, Calendar, Mail, TrendingUp, Eye, BarChart2, Clock, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BRAND_COLORS: Record<string, string> = {
  Mazda: "#CC0000", Ford: "#003B95", Mitsubishi: "#CC0000",
  GWM: "#1C3F6E", Deepal: "#00A9CE", Kia: "#05141F",
};

type AnalyticsData = {
  counts: Record<string, number>;
  topCars: { brand: string | null; model: string | null; count: number }[];
  topBrands: { brand: string | null; count: number }[];
  daily: { date: string; event: string; count: number }[];
  recent: { id: number; event: string; path: string | null; brand: string | null; model: string | null; createdAt: number }[];
};

const EVENT_LABELS: Record<string, string> = {
  car_view: "ดูรถ", booking: "นัดทดลองขับ", contact: "ติดต่อ", search: "ค้นหา",
};
const EVENT_ICONS: Record<string, typeof Car> = {
  car_view: Car, booking: Calendar, contact: Mail, search: TrendingUp,
};
const EVENT_COLORS: Record<string, string> = {
  car_view: "#0F172A", booking: "#DD5259", contact: "#3B82F6", search: "#10B981",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Car; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#0F172A]">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function timeAgo(value: number | string | Date) {
  // createdAt arrives as an ISO string over JSON (Drizzle timestamp → Date → JSON),
  // but may also be a Date or unix-seconds number. Normalize all three to ms.
  let ms: number;
  if (value instanceof Date) ms = value.getTime();
  else if (typeof value === "string") ms = Date.parse(value);
  else ms = value > 1e12 ? value : value * 1000; // seconds vs ms heuristic
  if (!Number.isFinite(ms)) return "—";
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const DAYS_OPTIONS = [7, 14, 30, 90];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  async function load(d: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${d}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(days); }, [days]);

  // Build daily chart data (last 14 days)
  const chartData = (() => {
    if (!data) return [];
    const byDate: Record<string, Record<string, number>> = {};
    for (const row of data.daily) {
      if (!byDate[row.date]) byDate[row.date] = {};
      byDate[row.date][row.event] = (byDate[row.date][row.event] ?? 0) + Number(row.count);
    }
    return Object.entries(byDate).map(([date, evts]) => ({ date: date.slice(5), ...evts }));
  })();

  const counts = data?.counts ?? {};

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">ข้อมูลการใช้งานเว็บไซต์</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${days === d ? "bg-white text-[#0F172A] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => load(days)} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Vercel Analytics link */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1e293b] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-white/60" />
          <div>
            <p className="text-white font-medium text-sm">Vercel Analytics</p>
            <p className="text-white/50 text-xs">Page views, unique visitors, Web Vitals, referrers</p>
          </div>
        </div>
        <a
          href="https://vercel.com/ch-erawan/ch-erawanwebsite/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          เปิด Dashboard →
        </a>
      </div>

      {/* Event count cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Business Events — {days} วันล่าสุด
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["car_view", "booking", "contact", "search"] as const).map(ev => (
            <StatCard
              key={ev}
              label={EVENT_LABELS[ev]}
              value={counts[ev] ?? 0}
              icon={EVENT_ICONS[ev]}
              color={EVENT_COLORS[ev]}
            />
          ))}
        </div>
      </div>

      {/* Daily activity chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Activity รายวัน</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={8} barGap={2}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(v: number, name: string) => [v, EVENT_LABELS[name] ?? name]}
              />
              {(["car_view", "booking", "contact"] as const).map(ev => (
                <Bar key={ev} dataKey={ev} fill={EVENT_COLORS[ev]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top cars */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-[#0F172A]">รถที่ดูมากที่สุด</h2>
          </div>
          {data?.topCars.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
          <div className="space-y-2">
            {data?.topCars.slice(0, 8).map((car, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 text-xs text-gray-400 text-right shrink-0">{i + 1}</span>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: BRAND_COLORS[car.brand ?? ""] ?? "#94a3b8" }}
                />
                <span className="text-sm text-[#0F172A] flex-1 truncate">{car.brand} {car.model}</span>
                <span className="text-sm font-semibold text-gray-700 shrink-0">{Number(car.count).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top brands */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-[#0F172A]">แบรนด์ที่สนใจมากที่สุด</h2>
          </div>
          {data?.topBrands.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
          <div className="space-y-3">
            {data?.topBrands.map((row, i) => {
              const max = data.topBrands[0]?.count ?? 1;
              const pct = Math.round((Number(row.count) / Number(max)) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#0F172A]">{row.brand}</span>
                    <span className="text-sm text-gray-500">{Number(row.count).toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: BRAND_COLORS[row.brand ?? ""] ?? "#94a3b8" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-[#0F172A]">กิจกรรมล่าสุด</h2>
        </div>
        {data?.recent.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
        <div className="space-y-1">
          {data?.recent.map((row) => {
            const Icon = EVENT_ICONS[row.event] ?? Eye;
            return (
              <div key={row.id} className="flex items-center gap-3 py-1.5 text-sm">
                <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-[#0F172A] w-20 shrink-0">{EVENT_LABELS[row.event] ?? row.event}</span>
                <span className="text-gray-500 flex-1 truncate">{row.model ? `${row.brand} ${row.model}` : row.path}</span>
                <span className="text-gray-400 text-xs shrink-0">{timeAgo(row.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
