import { getYearsLabel, getYearsOfExperience } from "@/lib/company";
import { listOpenJobPostings } from "@/lib/jobs";
import Image from "next/image";
import { CheckCircle, Phone, Mail, Clock, TrendingUp, Shield, Gift, MessageCircle } from "lucide-react";
import { JobsSection, type JobCard } from "./JobsSection";

export const revalidate = 0; // always reflect the latest push from CATS

// ───────────────────────────────────────────
// Data
// ───────────────────────────────────────────

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

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────

export default async function Career() {
  const openJobs = await listOpenJobPostings();
  const jobListings: JobCard[] = openJobs.map((j) => ({
    title: j.title,
    code: j.code,
    urgent: j.urgent,
    category: j.category,
    branches: j.branches,
    salary: j.salary ?? "ตามประสบการณ์",
    type: j.employmentType ?? "งานประจำ",
    requirements: j.requirements,
  }));

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
            ร่วมงานกับ ช.เอราวัณ กรุ๊ป ผู้จำหน่ายรถยนต์อย่างเป็นทางการ 8 แบรนด์ชั้นนำ
            {`ใน 9 สาขา จ.นครปฐม ด้วยประสบการณ์กว่า ${getYearsOfExperience()} ปี`}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-white/50">
            {["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia", "GAC", "Lepas"].map((b) => (
              <span key={b} className="bg-white/10 px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="bg-[#0F172A] py-8">
        <div className="container grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
          {[
            { num: getYearsLabel(), label: "ปีประสบการณ์" },
            { num: "9", label: "สาขาทั่วนครปฐม" },
            { num: "8", label: "แบรนด์รถยนต์" },
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
                  <div className="w-9 h-9 rounded-lg bg-[#0F172A]/10 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-[#0F172A]" />
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
              alt="ทีมงาน ช.เอราวัณ กรุ๊ป"
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
              <a href="https://line.me/R/ti/p/@ads1599i" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#06C755] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#05a847] transition-colors">
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
            {jobListings.length} ตำแหน่ง ใน 9 สาขา — พร้อมโอกาสเติบโตในสายงานยานยนต์และบริการ
          </p>
        </div>

        <JobsSection jobs={jobListings} />
      </div>
    </div>
  );
}
