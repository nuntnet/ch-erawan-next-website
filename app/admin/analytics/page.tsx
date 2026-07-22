"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Car, Calendar, Mail, TrendingUp, Eye, Clock, RefreshCw, MessageSquare, Phone, Smartphone, Monitor, Link2,
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

type ChannelRow = { channel: string; sessions: number; users: number };
type SourceRow = { source: string; medium: string; campaign: string | null; sessions: number };
type LandingPageRow = { path: string; sessions: number; bounceRate: number };
type VehicleRow = { slug: string; label: string; views: number };
type DeviceRow = { device: string; sessions: number };
type LeadCounts = { form: number; line: number; call: number };
type FunnelStepResult = { name: string; users: number; completionRate: number };
type FunnelResult = { key: string; label: string; steps: FunnelStepResult[] };

type BrandClicks = { brand: string; clicks: number };
type Ga4Data = {
  configured: boolean;
  channels: ChannelRow[];
  topSources: SourceRow[];
  landingPages: LandingPageRow[];
  topVehicles: VehicleRow[];
  deviceBreakdown: DeviceRow[];
  leadCounts: LeadCounts;
  lineByBrand: BrandClicks[];
  funnels: FunnelResult[];
};

type SearchKeywordRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
type PageKeywords = { page: string; clicks: number; impressions: number; keywords: SearchKeywordRow[] };
type GscData = { configured: boolean; topKeywords: SearchKeywordRow[]; pages: PageKeywords[] };

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

const TABS = [
  { id: "overview", label: "ภาพรวม" },
  { id: "vehicles", label: "รถยนต์" },
  { id: "traffic", label: "Traffic" },
  { id: "funnel", label: "Customer Journey" },
  { id: "seo", label: "SEO" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [ga4, setGa4] = useState<Ga4Data | null>(null);
  const [gsc, setGsc] = useState<GscData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  async function load(d: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${d}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function loadGa4(d: number) {
    try {
      const res = await fetch(`/api/admin/analytics/ga4?days=${d}`);
      setGa4(await res.json());
    } catch {
      setGa4(null);
    }
  }

  async function loadGsc(d: number) {
    try {
      const res = await fetch(`/api/admin/analytics/gsc?days=${d}`);
      setGsc(await res.json());
    } catch {
      setGsc(null);
    }
  }

  useEffect(() => { load(days); loadGa4(days); loadGsc(days); }, [days]);

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

      {/* Category tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${activeTab === t.id ? "bg-white text-[#0F172A] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* GA4 not configured banner — shown regardless of tab since it affects most of them */}
      {ga4 && !ga4.configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ยังไม่ได้ตั้งค่า GA4 — ดู <code className="font-mono">specs/env-vars.md</code>
        </div>
      )}

      {/* ===== ภาพรวม ===== */}
      {activeTab === "overview" && (
      <>
      {/* Lead counts */}
      {ga4?.configured && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Leads — {days} วันล่าสุด
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="จองผ่านฟอร์ม" value={ga4.leadCounts.form} icon={Calendar} color="#0F172A" />
            <StatCard label="ทัก LINE" value={ga4.leadCounts.line} icon={MessageSquare} color="#06C755" />
            <StatCard label="โทรศัพท์" value={ga4.leadCounts.call} icon={Phone} color="#3B82F6" />
          </div>
          {/* Per-brand LINE breakdown (needs "brand" custom dimension in GA4) */}
          {ga4.lineByBrand.length > 0 && (
            <div className="mt-3 bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-[#06C755]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">ทัก LINE แยกตามแบรนด์</h3>
              </div>
              <div className="space-y-2.5">
                {ga4.lineByBrand.map((b, i) => {
                  const max = ga4.lineByBrand[0]?.clicks ?? 1;
                  const pct = max > 0 ? Math.round((b.clicks / max) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-[#0F172A]">{b.brand}</span>
                        <span className="font-semibold text-gray-700">{b.clicks.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#06C755]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
      </>
      )}

      {/* ===== รถยนต์ ===== */}
      {activeTab === "vehicles" && (
      <>
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

      {ga4?.configured && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">รถที่มีคนสนใจมากที่สุด (จาก Google Analytics)</h2>
          {ga4.topVehicles.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
          <div className="space-y-2">
            {ga4.topVehicles.map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[#0F172A] truncate">{v.label}</span>
                <span className="font-semibold text-gray-700 shrink-0 ml-2">{v.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      {/* ===== Traffic ===== */}
      {activeTab === "traffic" && ga4?.configured && (
      <>
          {/* Traffic Sources */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Traffic Sources</h2>
              {ga4.channels.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
              <div className="space-y-2">
                {ga4.channels.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#0F172A]">{c.channel}</span>
                    <span className="font-semibold text-gray-700">{c.sessions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Top Sources / Campaigns</h2>
              {ga4.topSources.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
              <div className="space-y-2">
                {ga4.topSources.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#0F172A] truncate">
                      {s.source} / {s.medium}
                      {s.campaign && <span className="text-gray-400"> · {s.campaign}</span>}
                    </span>
                    <span className="font-semibold text-gray-700 shrink-0 ml-2">{s.sessions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Device split */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Mobile vs Desktop</h2>
            {ga4.deviceBreakdown.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>}
            <div className="space-y-3">
              {ga4.deviceBreakdown.map((d, i) => {
                const max = ga4.deviceBreakdown[0]?.sessions ?? 1;
                const pct = Math.round((d.sessions / max) * 100);
                const Icon = d.device === "mobile" ? Smartphone : Monitor;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="flex items-center gap-1.5 text-[#0F172A]"><Icon className="w-3.5 h-3.5" />{d.device}</span>
                      <span className="text-gray-500">{d.sessions.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0F172A] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Landing Pages — GA4's Data API has no exits/entrances metrics (those
              are Universal Analytics-only), so this shows landing page + bounce
              rate instead, the closest GA4-native equivalent. */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-4">หน้า Landing Page ยอดนิยม</h2>
            {ga4.landingPages.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">หน้า</th>
                    <th className="pb-2 font-medium text-right">Sessions</th>
                    <th className="pb-2 font-medium text-right">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4.landingPages.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-[#0F172A] truncate max-w-[240px]">{p.path}</td>
                      <td className="py-2 text-right text-gray-600">{p.sessions.toLocaleString()}</td>
                      <td className="py-2 text-right text-gray-600">{p.bounceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </>
      )}

      {/* ===== Customer Journey ===== */}
      {activeTab === "funnel" && ga4?.configured && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Funnel — เส้นทางสำคัญ</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {ga4.funnels.map((f) => {
              const maxUsers = f.steps[0]?.users ?? 1;
              return (
                <div key={f.key} className="bg-white rounded-xl border border-gray-100 p-5">
                  <p className="text-sm font-semibold text-[#0F172A] mb-4">{f.label}</p>
                  {f.steps.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
                  ) : (
                    <div className="space-y-3">
                      {f.steps.map((s, i) => {
                        const pct = maxUsers > 0 ? Math.round((s.users / maxUsers) * 100) : 0;
                        const prevUsers = i > 0 ? f.steps[i - 1].users : null;
                        // Step-over-step conversion — literally s.users ÷ prevUsers, so the
                        // label can say exactly what's being divided by what. GA4's own
                        // completionRate is cumulative-from-step-1 instead, which reads as an
                        // unlabeled bare "(33%)" and doesn't answer "where do people drop off."
                        const stepConversion = prevUsers && prevUsers > 0 ? Math.round((s.users / prevUsers) * 1000) / 10 : null;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1 text-xs">
                              <span className="text-[#0F172A]">{s.name}</span>
                              <span className="text-gray-500">
                                {s.users.toLocaleString()} คน
                                {stepConversion !== null && (
                                  <span className="ml-1.5 font-medium text-[#0F172A]">
                                    · ต่อจากขั้นก่อนหน้า {stepConversion}%
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#DD5259] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            {i === 0 && (
                              <p className="text-[10px] text-gray-400 mt-1">จุดเริ่มต้นของเส้นทางนี้</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SEO ===== */}
      {activeTab === "seo" && (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          คำค้นหา Google Search — {days} วันล่าสุด
        </h2>
        {gsc && !gsc.configured ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            ยังไม่ได้ตั้งค่า Search Console API — ดู <code className="font-mono">specs/env-vars.md</code>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top keywords across the whole site */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-1">คำค้นหายอดนิยม (ทั้งเว็บ)</h3>
              <p className="text-xs text-gray-400 mb-4">คำที่คนพิมพ์ค้นหาใน Google แล้วเห็น/คลิกเข้าเว็บเรา — รวมทุกหน้า ไม่แยกว่าเข้าหน้าไหน</p>
              {(gsc?.topKeywords.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  ยังไม่มีข้อมูล — GSC เพิ่งเริ่มเก็บ ต้องรอ Google index (โดยปกติ ~2-4 สัปดาห์ และมี delay 2-3 วันเสมอ)
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-medium">คำค้นหา</th>
                      <th className="pb-2 font-medium text-right">คลิก</th>
                      <th className="pb-2 font-medium text-right">แสดง</th>
                      <th className="pb-2 font-medium text-right">CTR</th>
                      <th className="pb-2 font-medium text-right">อันดับ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gsc!.topKeywords.map((k, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 text-[#0F172A] truncate max-w-[280px]">{k.query}</td>
                        <td className="py-2 text-right font-medium text-gray-700">{k.clicks.toLocaleString()}</td>
                        <td className="py-2 text-right text-gray-500">{k.impressions.toLocaleString()}</td>
                        <td className="py-2 text-right text-gray-500">{k.ctr.toFixed(1)}%</td>
                        <td className="py-2 text-right text-gray-500">{k.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Per-page keyword breakdown — "which keyword landed on which page", made
                explicit with a Landing Page label + icon and a labeled mini-table per
                page, instead of an unlabeled page-header + bare keyword rows. */}
            {(gsc?.pages.length ?? 0) > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">คำค้นหาที่พาเข้าแต่ละหน้า</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    แต่ละการ์ดด้านล่าง = 1 หน้าในเว็บเรา (Landing Page) — ตารางข้างในคือคำค้นหาที่คนพิมพ์ใน Google แล้วคลิกเข้ามาที่หน้านั้นโดยตรง
                  </p>
                </div>
                {gsc!.pages.slice(0, 12).map((p, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">Landing Page</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[#0F172A] truncate max-w-[60%]">
                        {p.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        รวม {p.clicks.toLocaleString()} คลิก · {p.impressions.toLocaleString()} ครั้งที่แสดงผล
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] text-gray-400 border-b border-gray-100">
                          <th className="pb-1.5 font-medium">คำค้นหาที่พาเข้าหน้านี้</th>
                          <th className="pb-1.5 font-medium text-right">คลิก</th>
                          <th className="pb-1.5 font-medium text-right">อันดับเฉลี่ย</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.keywords.map((k, j) => (
                          <tr key={j} className="border-b border-gray-50 last:border-0">
                            <td className="py-1.5 text-gray-600 truncate max-w-[220px]">{k.query}</td>
                            <td className="py-1.5 text-right font-medium text-gray-700">{k.clicks.toLocaleString()}</td>
                            <td className="py-1.5 text-right text-gray-500">{k.position.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
