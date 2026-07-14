"use client";

import { useState } from "react";
import {
  CheckCircle, Building, DollarSign, Clock, ArrowUpRight, Users,
  Wrench, Car, Calculator, Headphones, ChevronRight, Mail,
} from "lucide-react";

export const BRANCH_LABELS: Record<string, string> = {
  all:             "ทั้งหมด",
  mazda_npt:       "Mazda นครปฐม",
  mazda_salaya:    "Mazda ศาลายา",
  deepal_salaya:   "Deepal ศาลายา",
  ford_omnoi:      "Ford อ้อมใหญ่",
  mitsubishi_npt:  "Mitsubishi นครปฐม",
  gwm_npt:         "GWM นครปฐม",
  kia_sampran:     "Kia นครปฐม",
  hq:              "สำนักงานใหญ่",
};

const jobCategories = [
  { id: "sales",   label: "ฝ่ายขาย",    icon: Car },
  { id: "service", label: "ฝ่ายบริการ", icon: Wrench },
  { id: "finance", label: "ฝ่ายบัญชี/การเงิน", icon: Calculator },
  { id: "support", label: "ฝ่ายสนับสนุน", icon: Headphones },
  { id: "mgmt",    label: "ผู้บริหาร",  icon: Users },
];

export interface JobCard {
  title: string;
  code?: string | null;
  urgent?: boolean;
  category: string;
  branches: string[];
  salary: string;
  type: string;
  requirements: string[];
}

export function JobsSection({ jobs }: { jobs: JobCard[] }) {
  const [activeBranch, setActiveBranch] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredJobs = jobs.filter((job) => {
    const branchMatch = activeBranch === "all" || job.branches.includes(activeBranch);
    const catMatch = activeCategory === "all" || job.category === activeCategory;
    return branchMatch && catMatch;
  });

  const totalUrgent = filteredJobs.filter((j) => j.urgent).length;

  return (
    <>
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
                      {BRANCH_LABELS[b] ?? b}
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
      <div className="mt-14 bg-[#0F172A] rounded-2xl p-8 lg:p-10 text-center max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-white mb-2">ไม่เห็นตำแหน่งที่ใช่?</h3>
        <p className="text-white/60 text-sm mb-6">
          ส่ง Resume พร้อมระบุตำแหน่งที่สนใจมาให้เราได้เลย
          ทีม HR จะติดต่อกลับเมื่อมีตำแหน่งที่เหมาะสม
        </p>
        <a
          href="mailto:cherawan.hr@gmail.com?subject=สมัครงาน ช.เอราวัณ กรุ๊ป"
          className="inline-flex items-center gap-2 bg-[#C8102E] hover:bg-[#a00d25] text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <Mail className="w-4 h-4" />
          ส่ง Resume ทาง Email
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </>
  );
}
