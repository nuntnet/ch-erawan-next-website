"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  ThumbsUp, ThumbsDown, Lightbulb, CheckCircle2,
  Phone, MessageCircle, ChevronRight, AlertCircle,
} from "lucide-react";
import { sanitizePhone, isValidPhone, isValidEmail, PHONE_ERROR, EMAIL_ERROR } from "@/lib/form-validation";

const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"] as const;

const BRANCHES_BY_BRAND: Record<string, string[]> = {
  Mazda:      ["Mazda ช.เอราวัณ นครปฐม", "Mazda ช.เอราวัณ ศาลายา"],
  Ford:       ["Ford ช.เอราวัณ อ้อมใหญ่"],
  Mitsubishi: ["Mitsubishi ช.เอราวัณ นครปฐม"],
  GWM:        ["GWM ช.เอราวัณ นครปฐม"],
  Deepal:     ["Deepal ช.เอราวัณ ศาลายา"],
  Kia:        ["Kia ช.เอราวัณ นครปฐม"],
};

const DEPARTMENTS = ["ฝ่ายขาย", "ศูนย์บริการ", "ซ่อมสีตัวถัง", "ประกันภัย", "อื่นๆ"];

const FEEDBACK_TYPES = [
  { value: "ร้องเรียน", label: "ร้องเรียน / แจ้งปัญหา", icon: ThumbsDown, color: "text-red-600", bg: "bg-red-50 border-red-200", activeBg: "bg-red-600 border-red-600 text-white" },
  { value: "ชมเชย",    label: "ชมเชย / ขอบคุณ",       icon: ThumbsUp,   color: "text-green-600", bg: "bg-green-50 border-green-200", activeBg: "bg-green-600 border-green-600 text-white" },
  { value: "เสนอแนะ", label: "เสนอแนะ / ข้อคิดเห็น",  icon: Lightbulb,  color: "text-blue-600",  bg: "bg-blue-50 border-blue-200",  activeBg: "bg-blue-600 border-blue-600 text-white" },
] as const;

function FeedbackForm() {
  const params = useSearchParams();
  const initialBrand = params.get("brand") ?? "";
  const initialBranch = params.get("branch") ?? "";

  const [type, setType] = useState<"ร้องเรียน" | "ชมเชย" | "เสนอแนะ">("ร้องเรียน");
  const [brand, setBrand] = useState(initialBrand);
  const [branch, setBranch] = useState(initialBranch);
  const [department, setDepartment] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const branches = brand ? (BRANCHES_BY_BRAND[brand] ?? []) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidPhone(phone)) { setError(PHONE_ERROR); return; }
    if (email && !isValidEmail(email)) { setError(EMAIL_ERROR); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/submit/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, brand, branch, department, name, phone, email, licensePlate, serviceDate, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
      setSubmitted(true);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-[68px] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-2">ขอบคุณสำหรับ Feedback</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            เราได้รับข้อความของคุณแล้ว ทีมงานจะตรวจสอบและติดต่อกลับภายใน
            <span className="font-semibold text-[#0F172A]"> 24 ชั่วโมง</span>
            <br />สำหรับกรณีเร่งด่วน กรุณาโทร{" "}
            <a href="tel:0944133555" className="text-[#DD5259] font-semibold underline">094-413-3555</a>
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="block w-full py-3 px-4 bg-[#0F172A] text-white rounded-xl text-sm font-medium hover:bg-[#1a2a50] transition-colors text-center"
            >
              กลับหน้าแรก
            </Link>
            <button
              onClick={() => setSubmitted(false)}
              className="block w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ส่ง Feedback อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
      {/* Header */}
      <div className="bg-[#0F172A] py-12 lg:py-16">
        <div className="container max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#DD5259]/20 text-[#FF8B8B] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <AlertCircle className="w-3.5 h-3.5" />
            ศูนย์ร้องเรียนทันใจ
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">แนะนำ–ติชม</h1>
          <p className="text-white/60 leading-relaxed max-w-xl">
            เราพร้อมรับฟังและแก้ไขทุกปัญหาโดยเร็วที่สุด
            Feedback ของคุณช่วยให้เราพัฒนาบริการได้ดียิ่งขึ้น
          </p>

          {/* Urgent hotline */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="tel:0944133555"
              className="inline-flex items-center gap-2 bg-[#DD5259] hover:bg-[#c0404a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              094-413-3555 (เร่งด่วน)
            </a>
            <a
              href="https://line.me/R/ti/p/@mazdach.erawan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#06C755] hover:bg-[#05a847] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              LINE Official
            </a>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container max-w-3xl py-12">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Feedback Type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <label className="block text-sm font-bold text-[#0F172A] mb-4">ประเภท Feedback *</label>
            <div className="grid grid-cols-3 gap-3">
              {FEEDBACK_TYPES.map(({ value, label, icon: Icon, bg, activeBg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    type === value ? activeBg : `${bg} text-gray-600 hover:opacity-80`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand + Branch + Department */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">ข้อมูลบริการ</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">แบรนด์ *</label>
                <select
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); setBranch(""); }}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                >
                  <option value="">เลือกแบรนด์</option>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">สาขา *</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  disabled={!brand}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">เลือกสาขา</option>
                  {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">แผนก *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                >
                  <option value="">เลือกแผนก</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">วันที่รับบริการ</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">ทะเบียนรถ</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="เช่น กข 1234 นครปฐม"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">ข้อมูลติดต่อกลับ</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ชื่อ นามสกุล"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                  required
                  placeholder="0XX-XXX-XXXX"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <label className="block text-sm font-bold text-[#0F172A] mb-3">
              รายละเอียด *
              <span className="text-gray-400 font-normal ml-1 text-xs">
                {type === "ร้องเรียน" ? "(อธิบายปัญหาที่พบให้ชัดเจน)" : type === "ชมเชย" ? "(บอกเราว่าคุณประทับใจอะไร)" : "(ข้อเสนอแนะเพื่อพัฒนาบริการ)"}
              </span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              rows={5}
              placeholder={
                type === "ร้องเรียน"
                  ? "อธิบายปัญหาที่พบ เช่น วันที่ เวลา พนักงานที่เกี่ยวข้อง รายละเอียดของปัญหา..."
                  : type === "ชมเชย"
                  ? "บอกเราว่าคุณประทับใจบริการหรือพนักงานท่านไหน..."
                  : "เสนอแนะสิ่งที่คุณอยากให้เราพัฒนาหรือปรับปรุง..."
              }
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{message.length} ตัวอักษร (ขั้นต่ำ 10)</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0F172A] hover:bg-[#1a2a50] disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                ส่ง Feedback
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            ข้อมูลของคุณจะถูกเก็บเป็นความลับ ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
          </p>
        </form>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] pt-[68px]" />}>
      <FeedbackForm />
    </Suspense>
  );
}
