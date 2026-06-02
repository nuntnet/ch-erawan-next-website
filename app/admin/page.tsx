"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Car,
  Mail,
  MessageSquare,
  MessageSquareWarning,
  RefreshCw,
  Share2,
  Shield,
  Tag,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type {
  Appointment,
  BlogPost,
  BrandSocialLink,
  Car as CarType,
  ContactSubmission,
  CustomerFeedback,
  CustomerStory,
  InsurancePartner,
  Promotion,
  ServicePageSection,
} from "@/lib/notion-types";
import {
  BRANDS,
  computeActivitySummary,
  computeAppointmentStats,
  computeBlogStats,
  computeBrandContentStats,
  computeCarStats,
  computeContactStats,
  computeFeedbackStats,
  computePromotionStats,
  computeStoryStats,
  type BrandName,
} from "@/lib/admin-dashboard-stats";

function RevalidateButton() {
  const [loading, setLoading] = useState(false);

  async function handleRevalidate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success("รีเฟรชเว็บไซต์แล้ว", {
        description: "หน้าเว็บสาธารณะจะดึงข้อมูลล่าสุดจาก Notion ในการเข้าชมครั้งถัดไป",
      });
    } catch {
      toast.error("รีเฟรชไม่สำเร็จ", { description: "กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRevalidate}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-[#131F3C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f2d52] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "กำลังรีเฟรช..." : "รีเฟรชเว็บไซต์"}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "รอดำเนินการ", className: "bg-amber-100 text-amber-700" },
    confirmed: { label: "ยืนยันแล้ว", className: "bg-blue-100 text-blue-700" },
    completed: { label: "เสร็จสิ้น", className: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "ยกเลิก", className: "bg-red-100 text-red-600" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
  loading,
  alert,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href?: string;
  loading?: boolean;
  alert?: boolean;
}) {
  const inner = (
    <div
      className={`bg-white rounded-xl border p-5 transition-shadow ${
        alert ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"
      } ${href ? "hover:shadow-md cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-[#131F3C] mt-1">
            {loading ? (
              <span className="inline-block w-10 h-7 bg-gray-100 animate-pulse rounded" />
            ) : (
              value
            )}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function MiniStat({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-[#131F3C]">
        {loading ? <span className="inline-block w-6 h-5 bg-gray-200 animate-pulse rounded" /> : value}
      </p>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color = "bg-[#131F3C]",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 truncate pr-2">{label}</span>
        <span className="font-medium text-[#131F3C] shrink-0">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const APPOINTMENT_TYPE_LABELS: Record<Appointment["type"], string> = {
  test_drive: "ทดลองขับ",
  service: "บริการ",
  body_paint: "ซ่อมสีตัวถัง",
  insurance_quote: "ใบเสนอราคาประกัน",
};

const BLOG_CATEGORY_LABELS: Record<BlogPost["category"], string> = {
  review: "รีวิว",
  tips: "เคล็ดลับ",
  news: "ข่าวสาร",
  promotion: "โปรโมชั่น",
  csr: "CSR",
};

const BRAND_COLORS: Record<BrandName, string> = {
  Mazda: "bg-red-500",
  Ford: "bg-blue-600",
  Mitsubishi: "bg-red-600",
  GWM: "bg-slate-700",
  Deepal: "bg-cyan-600",
  Kia: "bg-orange-500",
};

async function fetchJson<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stories, setStories] = useState<CustomerStory[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [serviceSections, setServiceSections] = useState<ServicePageSection[]>([]);
  const [insurancePartners, setInsurancePartners] = useState<InsurancePartner[]>([]);
  const [socialLinks, setSocialLinks] = useState<BrandSocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJson<Appointment>("/api/admin/appointments"),
      fetchJson<CustomerStory>("/api/admin/stories"),
      fetchJson<CarType>("/api/admin/cars"),
      fetchJson<BlogPost>("/api/admin/blog"),
      fetchJson<ContactSubmission>("/api/admin/contacts"),
      fetchJson<CustomerFeedback>("/api/admin/feedback"),
      fetchJson<Promotion>("/api/admin/promotions"),
      fetchJson<ServicePageSection>("/api/admin/service-content"),
      fetchJson<InsurancePartner>("/api/admin/insurance-partners"),
      fetchJson<BrandSocialLink>("/api/admin/social-links"),
    ])
      .then(([apts, strs, crs, pts, cts, fb, promos, sections, partners, links]) => {
        setAppointments(apts);
        setStories(strs);
        setCars(crs);
        setPosts(pts);
        setContacts(cts);
        setFeedback(fb);
        setPromotions(promos);
        setServiceSections(sections);
        setInsurancePartners(partners);
        setSocialLinks(links);
      })
      .finally(() => setLoading(false));
  }, []);

  const carStats = useMemo(() => computeCarStats(cars), [cars]);
  const appointmentStats = useMemo(() => computeAppointmentStats(appointments), [appointments]);
  const storyStats = useMemo(() => computeStoryStats(stories), [stories]);
  const blogStats = useMemo(() => computeBlogStats(posts), [posts]);
  const contactStats = useMemo(() => computeContactStats(contacts), [contacts]);
  const feedbackStats = useMemo(() => computeFeedbackStats(feedback), [feedback]);
  const promotionStats = useMemo(() => computePromotionStats(promotions), [promotions]);
  const brandContentStats = useMemo(
    () => computeBrandContentStats(serviceSections, insurancePartners, socialLinks),
    [serviceSections, insurancePartners, socialLinks],
  );
  const activity = useMemo(
    () => computeActivitySummary(appointments, contacts, stories, feedback),
    [appointments, contacts, stories, feedback],
  );

  const actionItems = [
    { label: "นัดหมายรอดำเนินการ", value: appointmentStats.pending, href: "/admin/appointments" },
    { label: "รีวิวรอตรวจสอบ", value: storyStats.pending, href: "/admin/stories" },
    { label: "Feedback ใหม่", value: feedbackStats.newCount, href: "/admin/feedback" },
    { label: "รถไม่มีรูป", value: carStats.missingGallery, href: "/admin/cars" },
    { label: "บทความแบบร่าง", value: blogStats.draft, href: "/admin/blog" },
  ].filter((item) => item.value > 0);

  const maxBrandCars = Math.max(...BRANDS.map((b) => carStats.byBrand[b]), 1);
  const maxActivity = Math.max(activity.appointments, activity.contacts, activity.stories, activity.feedback, 1);

  const topBranches = Object.entries(contactStats.byBranch)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#131F3C]">ภาพรวม</h1>
          <p className="text-sm text-gray-500 mt-1">สรุปข้อมูลทั้งหมดของระบบ ch-erawan-next</p>
        </div>
        <RevalidateButton />
      </div>

      {/* Action required */}
      {!loading && actionItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-900">ต้องดำเนินการ</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {actionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-200 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
              >
                {item.label}
                <span className="bg-amber-500 text-white rounded-full px-1.5 min-w-[1.25rem] text-center">
                  {item.value}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="รถยนต์"
          value={carStats.total}
          sub={`${carStats.active} แสดงผล · ${carStats.inactive} ปิด`}
          icon={Car}
          color="bg-emerald-50 text-emerald-600"
          href="/admin/cars"
          loading={loading}
        />
        <StatCard
          label="บทความ"
          value={blogStats.published}
          sub={`${blogStats.draft} แบบร่าง · ทั้งหมด ${blogStats.total}`}
          icon={BookOpen}
          color="bg-blue-50 text-blue-600"
          href="/admin/blog"
          loading={loading}
        />
        <StatCard
          label="นัดหมาย"
          value={appointmentStats.total}
          sub={`${appointmentStats.pending} รอดำเนินการ · 7 วัน ${appointmentStats.last7Days}`}
          icon={Calendar}
          color="bg-orange-50 text-orange-600"
          href="/admin/appointments"
          loading={loading}
          alert={appointmentStats.pending > 0}
        />
        <StatCard
          label="รีวิวลูกค้า"
          value={storyStats.total}
          sub={`${storyStats.pending} รอตรวจ · ${storyStats.approved} อนุมัติ`}
          icon={MessageSquare}
          color="bg-purple-50 text-purple-600"
          href="/admin/stories"
          loading={loading}
          alert={storyStats.pending > 0}
        />
        <StatCard
          label="ข้อความติดต่อ"
          value={contactStats.total}
          sub={`${contactStats.last7Days} ใน 7 วันที่ผ่านมา`}
          icon={Mail}
          color="bg-rose-50 text-rose-600"
          href="/admin/contacts"
          loading={loading}
        />
        <StatCard
          label="Feedback"
          value={feedbackStats.total}
          sub={`${feedbackStats.newCount} ใหม่ · ${feedbackStats.inProgress} กำลังดำเนินการ`}
          icon={MessageSquareWarning}
          color="bg-red-50 text-red-600"
          href="/admin/feedback"
          loading={loading}
          alert={feedbackStats.newCount > 0}
        />
        <StatCard
          label="โปรโมชั่น"
          value={promotionStats.runningNow}
          sub={`${promotionStats.active} เปิดใช้ · ทั้งหมด ${promotionStats.total}`}
          icon={Tag}
          color="bg-indigo-50 text-indigo-600"
          href="/admin/promotions"
          loading={loading}
        />
        <StatCard
          label="Brand Content"
          value={brandContentStats.serviceSections.published}
          sub={`${brandContentStats.serviceSections.total} sections · ${brandContentStats.insurancePartners.active} ประกัน`}
          icon={Wrench}
          color="bg-teal-50 text-teal-600"
          href="/admin/service-content"
          loading={loading}
        />
      </div>

      {/* Secondary car & content metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStat label="รถใหม่" value={carStats.newCondition} loading={loading} />
        <MiniStat label="รถมือสอง" value={carStats.usedCondition} loading={loading} />
        <MiniStat label="Best Seller" value={carStats.bestSeller} loading={loading} />
        <MiniStat label="Nav แนะนำ" value={carStats.navFeatured} loading={loading} />
        <MiniStat label="Nav ใหม่" value={carStats.navNew} loading={loading} />
        <MiniStat label="รูปเดียว/ไม่มีรูป" value={carStats.missingGallery + carStats.singleImageOnly} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity last 7 days */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-[#131F3C]">กิจกรรม 7 วัน</h2>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <BarRow label="นัดหมาย" value={activity.appointments} max={maxActivity} color="bg-orange-500" />
              <BarRow label="ติดต่อเรา" value={activity.contacts} max={maxActivity} color="bg-rose-500" />
              <BarRow label="รีวิวลูกค้า" value={activity.stories} max={maxActivity} color="bg-purple-500" />
              <BarRow label="Feedback" value={activity.feedback} max={maxActivity} color="bg-red-500" />
              <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">
                รวม {activity.total} รายการใหม่
              </p>
            </div>
          )}
        </div>

        {/* Cars by brand */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">รถตามแบรนด์</h2>
            <Link href="/admin/cars" className="text-xs text-blue-600 hover:underline">จัดการ →</Link>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {BRANDS.map((brand) => (
                <BarRow
                  key={brand}
                  label={`${brand} (${carStats.activeByBrand[brand]} แสดง)`}
                  value={carStats.byBrand[brand]}
                  max={maxBrandCars}
                  color={BRAND_COLORS[brand]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Appointment breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">สถานะนัดหมาย</h2>
            <Link href="/admin/appointments" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="รอดำเนินการ" value={appointmentStats.pending} />
                <MiniStat label="ยืนยันแล้ว" value={appointmentStats.confirmed} />
                <MiniStat label="เสร็จสิ้น" value={appointmentStats.completed} />
                <MiniStat label="ยกเลิก" value={appointmentStats.cancelled} />
              </div>
              <div className="pt-2 border-t border-gray-50 space-y-2">
                <p className="text-xs font-medium text-gray-500">ตามประเภท</p>
                {(Object.keys(APPOINTMENT_TYPE_LABELS) as Appointment["type"][]).map((type) => (
                  <BarRow
                    key={type}
                    label={APPOINTMENT_TYPE_LABELS[type]}
                    value={appointmentStats.byType[type]}
                    max={appointmentStats.total || 1}
                    color="bg-orange-400"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blog categories */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">บทความตามหมวด</h2>
            <Link href="/admin/blog" className="text-xs text-blue-600 hover:underline">จัดการ →</Link>
          </div>
          {loading ? (
            <div className="py-6 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {(Object.keys(BLOG_CATEGORY_LABELS) as BlogPost["category"][]).map((cat) => (
                <BarRow
                  key={cat}
                  label={BLOG_CATEGORY_LABELS[cat]}
                  value={blogStats.byCategory[cat]}
                  max={blogStats.total || 1}
                  color="bg-blue-500"
                />
              ))}
              <p className="text-xs text-gray-400 pt-2">
                เผยแพร่ใหม่ 7 วัน: {blogStats.last7Days} บทความ
              </p>
            </div>
          )}
        </div>

        {/* Promotions by brand */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">โปรโมชั่นตามแบรนด์</h2>
            <Link href="/admin/promotions" className="text-xs text-blue-600 hover:underline">จัดการ →</Link>
          </div>
          {loading ? (
            <div className="py-6 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {BRANDS.map((brand) => (
                <BarRow
                  key={brand}
                  label={brand}
                  value={promotionStats.byBrand[brand]}
                  max={Math.max(...BRANDS.map((b) => promotionStats.byBrand[b]), 1)}
                  color={BRAND_COLORS[brand]}
                />
              ))}
              <p className="text-xs text-gray-400 pt-2">
                กำลังรัน: {promotionStats.runningNow} · ปิดใช้: {promotionStats.inactive}
              </p>
            </div>
          )}
        </div>

        {/* Brand content & social */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-[#131F3C] mb-4">Brand Web & โซเชียล</h2>
          {loading ? (
            <div className="py-6 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/admin/service-content" className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Wrench className="h-4 w-4" />
                  Service Sections
                </div>
                <span className="text-sm font-semibold text-[#131F3C]">
                  {brandContentStats.serviceSections.published}/{brandContentStats.serviceSections.total} เผยแพร่
                </span>
              </Link>
              <Link href="/admin/service-content" className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Shield className="h-4 w-4" />
                  บริษัทประกัน
                </div>
                <span className="text-sm font-semibold text-[#131F3C]">
                  {brandContentStats.insurancePartners.active}/{brandContentStats.insurancePartners.total} เปิดใช้
                </span>
              </Link>
              <Link href="/admin/social-links" className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Share2 className="h-4 w-4" />
                  Social Links
                </div>
                <span className="text-sm font-semibold text-[#131F3C]">
                  {brandContentStats.socialLinks.active}/{brandContentStats.socialLinks.total} เปิดใช้
                </span>
              </Link>
              {topBranches.length > 0 && (
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-2">ติดต่อตามสาขา (Top 5)</p>
                  <div className="space-y-1.5">
                    {topBranches.map(([branch, count]) => (
                      <div key={branch} className="flex justify-between text-xs">
                        <span className="text-gray-600 truncate pr-2">{branch}</span>
                        <span className="font-medium text-[#131F3C]">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">นัดหมายล่าสุด</h2>
            <Link href="/admin/appointments" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีนัดหมาย</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#131F3C] truncate">{apt.customerName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {APPOINTMENT_TYPE_LABELS[apt.type]} · {apt.carModel || apt.branch} · {apt.customerPhone}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">รีวิวรอตรวจสอบ</h2>
            <Link href="/admin/stories" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : storyStats.pending === 0 ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="text-sm text-gray-400">ไม่มีรีวิวรอตรวจสอบ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stories.filter((s) => s.status === "pending").slice(0, 5).map((story) => (
                <div key={story.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#131F3C] truncate">{story.customerName}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{story.story}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: story.rating }).map((_, i) => (
                      <span key={i} className="text-amber-400 text-xs">★</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">ข้อความติดต่อล่าสุด</h2>
            <Link href="/admin/contacts" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อความ</p>
          ) : (
            <div className="space-y-3">
              {contacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#131F3C] truncate">{contact.name}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">{contact.branch || "—"}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{contact.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#131F3C]">Feedback ใหม่</h2>
            <Link href="/admin/feedback" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#131F3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : feedbackStats.newCount === 0 ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="text-sm text-gray-400">ไม่มี Feedback ใหม่</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.filter((f) => f.status === "ใหม่").slice(0, 5).map((item) => (
                <div key={item.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#131F3C] truncate">{item.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 shrink-0">{item.type}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                    {item.brand} · {item.branch} · {item.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
