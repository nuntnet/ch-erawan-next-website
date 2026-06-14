"use client";

import { useState } from "react";
import { getYearsLabel, getYearsOfExperience } from "@/lib/company";
import Image from "next/image";
import {
  CheckCircle, Phone, Mail, Building, DollarSign,
  Clock, ArrowUpRight, Users, TrendingUp, Shield, Gift,
  Wrench, Car, Calculator, Headphones, ChevronRight, MessageCircle,
} from "lucide-react";

// ───────────────────────────────────────────
// Data
// ───────────────────────────────────────────

const BRANCH_LABELS: Record<string, string> = {
  all:             "ทั้งหมด",
  mazda_npt:       "Mazda นครปฐม",
  mazda_salaya:    "Mazda ศาลายา",
  deepal_salaya:   "Deepal ศาลายา",
  ford_omnoi:      "Ford อ้อมใหญ่",
  mitsubishi_npt:  "Mitsubishi นครปฐม",
  gwm_npt:         "GWM นครปฐม",
  kia_sampran:     "Kia สามพราน",
  hq:              "สำนักงานใหญ่",
};

const benefits = [
  {
    icon: Shield,
    title: "สวัสดิการพื้นฐาน",
    items: ["ประกันสังคม", "เบี้ยขยันรายเดือน", "โบนัสประจำปี", "ค่าล่วงเวลา"],
  },
  {
    icon: TrendingUp,
    title: "การพัฒนาอาชีพ",
    items: ["อบรมจากผู้ผลิตรถยนต์โดยตรง", "เส้นทางความก้าวหน้าชัดเจน", "Mentoring จากผู้บริหาร"],
  },
  {
    icon: Clock,
    title: "วันหยุดและวันลา",
    items: ["ลาพักร้อน 6 วัน/ปี", "ลาป่วย 30 วัน/ปี", "ลากิจ 3 วัน/ปี", "วันหยุดนักขัตฤกษ์"],
  },
  {
    icon: Gift,
    title: "สิทธิพิเศษพนักงาน",
    items: ["ส่วนลดซื้อรถและซ่อมรถ", "ส่วนลดประกัน พ.ร.บ.", "กิจกรรม Team Building ประจำปี", "ของขวัญวันเกิดพนักงาน"],
  },
];

const jobCategories = [
  { id: "sales",   label: "ฝ่ายขาย",    icon: Car },
  { id: "service", label: "ฝ่ายบริการ", icon: Wrench },
  { id: "finance", label: "ฝ่ายบัญชี/การเงิน", icon: Calculator },
  { id: "support", label: "ฝ่ายสนับสนุน", icon: Headphones },
  { id: "mgmt",    label: "ผู้บริหาร",  icon: Users },
];

interface Job {
  title: string;
  code?: string;
  urgent?: boolean;
  category: string;
  branches: string[];
  salary: string;
  type: string;
  requirements: string[];
}

const jobListings: Job[] = [
  // ── ฝ่ายขาย ────────────────────────────────
  {
    title: "ที่ปรึกษาการขาย (Sales Consultant)",
    code: "SC",
    urgent: true,
    category: "sales",
    branches: ["mazda_npt", "mazda_salaya", "ford_omnoi", "mitsubishi_npt", "gwm_npt", "kia_sampran", "deepal_salaya"],
    salary: "ตามประสบการณ์ + commission",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวส. ขึ้นไป", "มีใจรักงานบริการ", "มีรถยนต์เป็นของตนเอง (จะพิจารณาเป็นพิเศษ)"],
  },
  {
    title: "ที่ปรึกษาประกันภัยรถยนต์",
    category: "sales",
    branches: ["mazda_npt", "mazda_salaya", "ford_omnoi", "gwm_npt"],
    salary: "ตามประสบการณ์ + commission",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวส. ขึ้นไป", "มีใบอนุญาตนายหน้าประกัน (ไม่บังคับ)", "ทักษะการนำเสนอดี"],
  },
  {
    title: "ผู้จัดการฝ่ายขาย (Sales Manager)",
    category: "sales",
    branches: ["mazda_npt", "ford_omnoi", "gwm_npt"],
    salary: "35,000 – 60,000 บาท",
    type: "งานประจำ",
    requirements: ["ปริญญาตรีขึ้นไป", "ประสบการณ์ฝ่ายขายรถยนต์ 3 ปีขึ้นไป", "มีทักษะบริหารทีม"],
  },

  // ── ฝ่ายบริการ ──────────────────────────────
  {
    title: "ช่างเทคนิค (Technician)",
    urgent: true,
    category: "service",
    branches: ["mazda_npt", "mazda_salaya", "ford_omnoi", "mitsubishi_npt", "gwm_npt", "kia_sampran"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวช./ปวส. สาขาช่างยนต์", "ประสบการณ์ซ่อมรถยนต์ (จะพิจารณาเป็นพิเศษ)", "มีความละเอียดรอบคอบ"],
  },
  {
    title: "ช่างเทคนิค EV & HEV",
    urgent: true,
    category: "service",
    branches: ["gwm_npt", "deepal_salaya", "kia_sampran"],
    salary: "ตามประสบการณ์ (EV Premium)",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวส. สาขาช่างไฟฟ้า/ช่างยนต์", "ยินดีรับการอบรม EV จากผู้ผลิต", "มีใบขับรถ"],
  },
  {
    title: "ช่างสีตัวถัง (Body & Paint Technician)",
    category: "service",
    branches: ["mazda_npt", "mazda_salaya", "ford_omnoi"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวช./ปวส. สาขาช่างยนต์/ช่างกลโรงงาน", "มีประสบการณ์งานสีหรือตัวถัง (จะพิจารณาเป็นพิเศษ)"],
  },
  {
    title: "ที่ปรึกษาบริการ (Service Advisor : SA)",
    category: "service",
    branches: ["mazda_npt", "mazda_salaya", "ford_omnoi", "mitsubishi_npt", "gwm_npt"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวส./ปริญญาตรี", "บุคลิกภาพดี มีใจรักบริการ", "ทักษะการสื่อสารเชิงเทคนิคกับลูกค้า"],
  },

  // ── ฝ่ายบัญชี/การเงิน ───────────────────────
  {
    title: "พนักงานบัญชี (Accountant)",
    category: "finance",
    branches: ["hq", "mazda_npt"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["ปริญญาตรี สาขาบัญชี", "ใช้โปรแกรมบัญชีได้", "มีความละเอียดรอบคอบ"],
  },
  {
    title: "พนักงานการเงิน / สินเชื่อ",
    category: "finance",
    branches: ["mazda_npt", "ford_omnoi", "gwm_npt"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวส./ปริญญาตรี สาขาการเงิน/บัญชี", "มีทักษะเจรจาต่อรอง"],
  },

  // ── ฝ่ายสนับสนุน ─────────────────────────────
  {
    title: "พนักงานต้อนรับ (Receptionist)",
    category: "support",
    branches: ["mazda_npt", "mazda_salaya", "gwm_npt", "ford_omnoi"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวส. ขึ้นไป", "บุคลิกดี ยิ้มแย้ม", "ภาษาอังกฤษพื้นฐาน"],
  },
  {
    title: "ธุรการและจัดซื้อ",
    category: "support",
    branches: ["hq", "mazda_npt"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["วุฒิ ปวส./ปริญญาตรี", "Microsoft Office ดี", "ละเอียดรอบคอบ"],
  },
  {
    title: "เจ้าหน้าที่ IT / Digital",
    category: "support",
    branches: ["hq"],
    salary: "ตามประสบการณ์",
    type: "งานประจำ",
    requirements: ["ปริญญาตรี สาขา IT/คอมพิวเตอร์", "ดูแลระบบและ Support ผู้ใช้งาน"],
  },

  // ── ผู้บริหาร ────────────────────────────────
  {
    title: "ผู้จัดการสาขา (Branch Manager)",
    category: "mgmt",
    branches: ["deepal_salaya", "kia_sampran"],
    salary: "50,000 บาทขึ้นไป",
    type: "งานประจำ",
    requirements: ["ปริญญาตรีขึ้นไป", "ประสบการณ์บริหารธุรกิจรถยนต์ 5 ปีขึ้นไป", "ทักษะ P&L Management"],
  },
];

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────

export default function Career() {
  const [activeBranch, setActiveBranch] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredJobs = jobListings.filter((job) => {
    const branchMatch = activeBranch === "all" || job.branches.includes(activeBranch);
    const catMatch = activeCategory === "all" || job.category === activeCategory;
    return branchMatch && catMatch;
  });

  const totalUrgent = filteredJobs.filter((j) => j.urgent).length;

  return (
    <div className="min-h-screen bg-white pt-[68px]">

      {/* ── Hero ── */}
      <div className="relative bg-[#0F172A] overflow-hidden min-h-[340px] flex items-center">
        <Image src="https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/ch-erawan/pages/career-hero-bg2" alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-[#0F172A]/60" />
        <div className="container relative z-10 py-16">
          <p className="text-[#C8102E] text-sm font-medium tracking-widest uppercase mb-3">Join Our Team</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">มาเป็นส่วนหนึ่งของทีมเรา</h1>
          <p className="text-white/60 max-w-xl leading-relaxed mb-6">
            ร่วมงานกับ ช.เอราวัณ ออโต้ กรุป ผู้จำหน่ายรถยนต์อย่างเป็นทางการ 6 แบรนด์ชั้นนำ
            {`ใน 7 สาขา จ.นครปฐม ด้วยประสบการณ์กว่า ${getYearsOfExperience()} ปี`}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-white/50">
            {["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"].map((b) => (
              <span key={b} className="bg-white/10 px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="bg-[#0C1C3E] py-8">
        <div className="container grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
          {[
            { num: getYearsLabel(), label: "ปีประสบการณ์" },
            { num: "7", label: "สาขาทั่วนครปฐม" },
            { num: "6", label: "แบรนด์รถยนต์" },
            { num: `${jobListings.length}+`, label: "ตำแหน่งที่เปิดรับ" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl lg:text-3xl font-bold text-[#C8102E]">{s.num}</div>
              <div className="text-sm text-white/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── สวัสดิการ ── */}
      <div className="container py-16">
        <div className="lg:grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">ทำไมต้องเรา</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-4">สวัสดิการและสิทธิประโยชน์</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              เราใส่ใจคุณภาพชีวิตของพนักงาน จัดสวัสดิการครอบคลุมทุกด้าน
              เพื่อให้ทุกคนเติบโตและมีความสุขในการทำงาน
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map(({ icon: Icon, title, items }) => (
                <div key={title} className="bg-[#F8FAFC] rounded-xl p-5 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-[#0C1C3E]/10 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-[#0C1C3E]" />
                  </div>
                  <h3 className="font-semibold text-[#0F172A] text-sm mb-2">{title}</h3>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 lg:mt-0 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/ch-erawan/pages/career-team-photo"
              alt="ทีมงาน ช.เอราวัณ ออโต้ กรุป"
              width={900}
              height={600}
              className="w-full h-[420px] object-cover"
            />
          </div>
        </div>
      </div>

      {/* ── ติดต่อสมัครงาน ── */}
      <div className="bg-[#F8FAFC] py-12">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">สนใจร่วมงานกับเรา</h2>
            <p className="text-gray-500 text-sm">ติดต่อฝ่ายบุคคลโดยตรง หรือส่ง Resume มาได้เลย</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <Phone className="w-5 h-5 text-[#C8102E]" />
              </div>
              <h3 className="font-semibold text-[#0F172A] mb-1">โทรฝ่ายบุคคล</h3>
              <p className="text-gray-400 text-xs mb-3">จันทร์–เสาร์ 08:30–17:00 น.</p>
              <a href="tel:099-212-1177" className="text-[#0F172A] font-medium text-sm hover:underline">099-212-1177</a>
              <p className="text-gray-500 text-xs mt-1">034-305-500 ต่อ 7 หรือ 127</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-[#06C755]/10 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5 text-[#06C755]" />
              </div>
              <h3 className="font-semibold text-[#0F172A] mb-1">LINE แผนก HR</h3>
              <p className="text-gray-400 text-xs mb-3">แชทสอบถามหรือส่ง Resume ได้เลย</p>
              <a href="https://lin.ee/ads1599i" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#06C755] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#05B04C] transition-colors">
                <MessageCircle className="w-4 h-4" />
                @ads1599i
              </a>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-[#C8102E]" />
              </div>
              <h3 className="font-semibold text-[#0F172A] mb-1">ส่ง Resume</h3>
              <p className="text-gray-400 text-xs mb-3">ส่งเอกสารสมัครงานได้เลย</p>
              <a href="mailto:cherawan.hr@gmail.com" className="text-[#0F172A] font-medium text-sm hover:underline">cherawan.hr@gmail.com</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── ตำแหน่งงาน ── */}
      <div className="container py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">โอกาสสำหรับคุณ</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">ตำแหน่งที่กำลังเปิดรับ</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            {jobListings.length} ตำแหน่ง ใน 7 สาขา — พร้อมโอกาสเติบโตในสายงานยานยนต์และบริการ
          </p>
        </div>

        {/* Filter: Category */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === "all" ? "bg-[#0F172A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ทุกแผนก
          </button>
          {jobCategories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === id ? "bg-[#0F172A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Filter: Branch */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {Object.entries(BRANCH_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveBranch(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeBranch === key
                  ? "bg-[#C8102E] text-white border-[#C8102E]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Job Count */}
        {filteredJobs.length > 0 && (
          <p className="text-center text-sm text-gray-400 mb-6">
            พบ {filteredJobs.length} ตำแหน่ง
            {totalUrgent > 0 && <span className="text-red-500 font-medium"> · ด่วน {totalUrgent} ตำแหน่ง</span>}
          </p>
        )}

        {/* Job Cards */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredJobs.map((job, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-[#0F172A]">{job.title}</h3>
                    {job.code && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-mono">{job.code}</span>
                    )}
                    {job.urgent && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">ด่วน!</span>
                    )}
                  </div>

                  {/* Branches */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.branches.map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        <Building className="w-3 h-3" />
                        {BRANCH_LABELS[b]}
                      </span>
                    ))}
                  </div>

                  {/* Requirements */}
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    {job.requirements.map((req) => (
                      <li key={req} className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {job.type}
                    </span>
                  </div>
                </div>

                <a
                  href="mailto:cherawan.hr@gmail.com"
                  className="shrink-0 flex items-center gap-1 text-sm font-medium text-[#C8102E] hover:underline"
                >
                  สมัคร
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">ไม่พบตำแหน่งงานที่ตรงกับเงื่อนไข</p>
            <p className="text-sm mt-1">ลองเปลี่ยน filter หรือส่ง Resume มาที่ cherawan.hr@gmail.com ได้เลย</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 bg-[#0C1C3E] rounded-2xl p-8 lg:p-10 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-2">ไม่เห็นตำแหน่งที่ใช่?</h3>
          <p className="text-white/60 text-sm mb-6">
            ส่ง Resume พร้อมระบุตำแหน่งที่สนใจมาให้เราได้เลย
            ทีม HR จะติดต่อกลับเมื่อมีตำแหน่งที่เหมาะสม
          </p>
          <a
            href="mailto:cherawan.hr@gmail.com?subject=สมัครงาน ช.เอราวัณ ออโต้ กรุป"
            className="inline-flex items-center gap-2 bg-[#C8102E] hover:bg-[#a00d25] text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            ส่ง Resume ทาง Email
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
