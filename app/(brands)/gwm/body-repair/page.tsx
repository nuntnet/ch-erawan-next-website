import Link from "next/link";
import { Suspense } from "react";
import BrandHero from "@/components/BrandHero";
import BrandServiceContent from "@/components/brands/BrandServiceContent";
import BrandSubNav from "@/components/brands/BrandSubNav";
import { BRAND_BY_SLUG } from "@/lib/brandConfig";
import { getBranchesByBrand } from "@/lib/branchData";
import { getInsurancePartners, getFAQItems } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { CheckCircle2, ChevronRight, FileText, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "ศูนย์ซ่อมสี/ตัวถังมาตรฐาน GWM — ช.เอราวัณ",
  description:
    "ซ่อมสีและตัวถังรถ GWM มาตรฐานโรงงาน ช่างเทคนิคเฉพาะทาง 20 คน สีตรงรุ่น อุปกรณ์ครบ ที่ ช.เอราวัณ นครปฐม",
  path: "/gwm/body-repair",
});

const repairSteps = [
  { step: "01", title: "ตรวจประเมินความเสียหาย", desc: "ผู้เชี่ยวชาญตรวจสอบและประเมินค่าซ่อมโดยละเอียด" },
  { step: "02", title: "อนุมัติและวางแผนงาน", desc: "ลูกค้าได้รับใบเสนอราคาพร้อมกำหนดเวลา" },
  { step: "03", title: "ซ่อมโครงสร้างตัวถัง", desc: "ปรับโครงสร้างด้วยเครื่องดัดตัวถังระบบ 3D" },
  { step: "04", title: "เตรียมพื้นผิวและพ่นสี", desc: "ห้องพ่นสีมาตรฐาน สีตรงรหัสโรงงาน GWM" },
  { step: "05", title: "ตกแต่งและขัดเงา", desc: "ขัดเคลือบสีให้เงางามเหมือนใหม่" },
  { step: "06", title: "ตรวจสอบคุณภาพ", desc: "QC ทุกจุดก่อนส่งมอบรถ" },
];

// Insurance partners ดึงจาก Notion (admin จัดการได้จาก /admin/service-content)

const claimDocuments = [
  { title: "ใบแจ้งหนี้หรือใบกลมอร์ฟ", desc: "เอกสารแจ้งความเสียหายจากบริษัทประกัน" },
  { title: "สำเนาใบอนุญาตขับขี่", desc: "ของผู้ขับขี่และเจ้าของรถ" },
  { title: "สำเนาทะเบียนรถ", desc: "หน้า-หลัง พร้อมรับรองสำเนา" },
  { title: "สำเนาเอกสารประกันภัย", desc: "กรมธรรม์ประกันภัยที่มีผล" },
  { title: "สำเนาบัตรประชาชน", desc: "ของเจ้าของรถหรือผู้ได้รับมอบอำนาจ" },
  { title: "สำเนาบัญชีธนาคาร", desc: "สำหรับรับเงินค่าสินไหม (ถ้ามี)" },
];

const priceTable = [
  { item: "ค่าแรงซ่อม", insurance: true, selfPay: true },
  { item: "ค่าสีและวัสดุ", insurance: true, selfPay: true },
  { item: "ค่าน้ำ / สาร degreaser", insurance: false, selfPay: true },
  { item: "ค่าอะไหล่ทั่วไป", insurance: true, selfPay: true },
  { item: "ค่าบริการขัดเงาและเคลือบ", insurance: false, selfPay: true },
  { item: "ค่าประเมินความเสียหาย", insurance: true, selfPay: false },
];

// FAQ ดึงจาก Notion (จัดการที่ /admin/service-content → tab FAQ)

export default async function GwmBodyRepairPage() {
  const brand = BRAND_BY_SLUG.gwm;
  const gwmBranches = getBranchesByBrand("GWM");
  const bodyRepairBranch = gwmBranches[0];
  const [insuranceList, faqItems] = await Promise.all([
    getInsurancePartners(true),
    getFAQItems("GWM", "body-repair"),
  ]);

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: "GWM", path: "/gwm" },
    { name: "ซ่อมสี/ตัวถัง", path: "/gwm/body-repair" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <div className="min-h-screen bg-[#F8FAFC] pt-[64px]">
        <BrandHero
          brand={brand}
          breadcrumbs={breadcrumbs}
          primaryCta={{ label: "นัดซ่อมสี/ตัวถัง", href: "/booking?type=body_paint&brand=GWM" }}
          secondaryCta={{ label: "ดูรถ GWM", href: "/gwm" }}
          footer={
            <p className="text-white/75 text-sm">
              ช่างเทคนิคเฉพาะทาง 20 คน • ห้องพ่นสีมาตรฐาน • รับประกัน 1 ปี
            </p>
          }
        />

        <BrandSubNav brand={brand} currentSection="body-repair" scrollPastHero />

        {/* Stats */}
        <section className="bg-[#0F172A] py-10">
          <div className="container">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
              {[
                { num: "20", label: "ช่างเทคนิคเฉพาะทาง" },
                { num: "1", label: "ศูนย์มาตรฐาน GWM" },
                { num: "1 ปี", label: "รับประกันงานซ่อม" },
                { num: "100%", label: "สีตรงรหัสโรงงาน" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl lg:text-4xl font-bold text-[#C8102E]">{s.num}</div>
                  <div className="mt-1 text-sm text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ขั้นตอนการซ่อม */}
        <section className="container py-12 lg:py-16">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">มาตรฐานการซ่อม</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">ขั้นตอนการซ่อมสี/ตัวถัง</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {repairSteps.map((s) => (
              <div key={s.step} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="text-2xl font-black text-gray-100 shrink-0 w-10">{s.step}</div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* บริการซ่อมที่รองรับ */}
        <section className="bg-gray-50 py-12 lg:py-16">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#0F172A]">บริการที่รองรับ</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "ซ่อมสีรถทั้งคัน / บางส่วน",
                  "ซ่อมตัวถังและโครงสร้าง",
                  "เคาะดึงรอยบุบ PDR",
                  "ซ่อมกระจกและชิ้นส่วนพลาสติก",
                  "เคลือบแก้ว / เคลือบซีรามิก",
                  "ซ่อมหลังอุบัติเหตุ (มีเอกสารเคลม)",
                  "เปลี่ยนสีรถทั้งคัน",
                  "ซ่อมตามการรับประกันโรงงาน",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#C8102E] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* บริษัทประกันที่รับซ่อม */}
        <section className="container py-12 lg:py-16">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">พันธมิตรประกันภัย</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">บริษัทประกันภัยที่รับซ่อม</h2>
            <p className="mt-3 text-gray-500 text-sm max-w-lg mx-auto">
              ศูนย์ซ่อมสี-ตัวถัง ช.เอราวัณ รับซ่อมประกันจากบริษัทประกันภัยชั้นนำทุกราย
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {insuranceList.map((ins) => (
              <span
                key={ins.id}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {ins.name}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            * รับซ่อมประกันทุกบริษัท — ติดต่อเราหากไม่พบบริษัทของท่านในรายการ
          </p>
        </section>

        {/* เอกสารสำหรับเคลมประกัน */}
        <section className="container py-12 lg:py-16">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">เตรียมก่อนมา</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">เอกสารที่ต้องนำมาวันแจ้งเคลมซ่อมสี-ตัวถัง</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-sm">เพื่อให้การดำเนินการเคลมเป็นไปอย่างรวดเร็ว กรุณาเตรียมเอกสารเหล่านี้ให้ครบก่อนเข้ารับบริการ</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {claimDocuments.map((doc, i) => (
              <div key={doc.title} className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#C8102E]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">เอกสารที่ {i + 1}</p>
                  <h3 className="font-semibold text-[#0F172A] text-sm leading-snug">{doc.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{doc.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">* เอกสารอาจแตกต่างกันตามเงื่อนไขของบริษัทประกันภัย — ทีมงานจะแจ้งรายละเอียดเพิ่มเติมเมื่อนัดหมาย</p>
        </section>

        {/* นัดหมายเข้าซ่อม */}
        <section className="bg-[#0F172A] py-12 lg:py-14">
          <div className="container max-w-2xl text-center">
            <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-3">ติดต่อเรา</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              นัดหมายเข้าซ่อมสี-ตัวถัง
            </h2>
            <p className="text-white/50 text-sm mb-8">
              เปิดให้บริการ จ–ศ 08:00–17:00 น. (ยกเว้นวันหยุดนักขัตฤกษ์)
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/booking?type=body_paint&brand=GWM">
                <Button className="bg-[#C8102E] hover:bg-[#a00d25] text-white border-0">
                  นัดหมายออนไลน์
                </Button>
              </Link>
              <a href="tel:034-219-000">
                <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                  <Phone className="w-4 h-4 mr-2" />
                  034-219-000
                </Button>
              </a>
              <a href="https://line.me/R/ti/p/@gwmch.erawan" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  @gwmch.erawan
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* ตารางราคา */}
        <section className="container py-12 lg:py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-[#C8102E] uppercase tracking-wider mb-2">ค่าใช้จ่าย</p>
              <h2 className="text-2xl font-bold text-[#0F172A]">ค่าใช้จ่ายที่เกี่ยวข้อง</h2>
              <p className="text-sm text-gray-500 mt-2">เปรียบเทียบค่าใช้จ่ายระหว่างการเคลมประกันภัยและจ่ายเอง</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 bg-[#0F172A] text-white text-sm font-semibold">
                <div className="px-5 py-3 col-span-1">รายการ</div>
                <div className="px-4 py-3 text-center border-l border-white/10">ประกันภัย</div>
                <div className="px-4 py-3 text-center border-l border-white/10">จ่ายเอง</div>
              </div>
              {priceTable.map((row, i) => (
                <div key={row.item} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <div className="px-5 py-3 text-gray-700 col-span-1">{row.item}</div>
                  <div className="px-4 py-3 text-center border-l border-gray-100">
                    {row.insurance
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                      : <span className="text-gray-300 text-lg">×</span>}
                  </div>
                  <div className="px-4 py-3 text-center border-l border-gray-100">
                    {row.selfPay
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                      : <span className="text-gray-300 text-lg">×</span>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">* ราคาขึ้นอยู่กับความเสียหายและเงื่อนไขกรมธรรม์ — ติดต่อเราเพื่อประเมินเบื้องต้นฟรี</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="container py-12 lg:py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0F172A]">คำถามที่พบบ่อย</h2>
            </div>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-[#0F172A] mb-2">{item.question}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notion CMS content — admin adds sections via /admin/service-content */}
        <Suspense fallback={null}>
          <BrandServiceContent brand="GWM" page="body-repair" />
        </Suspense>

        {/* CTA */}
        <section className="bg-[#0F172A] py-12">
          <div className="container text-center">
            <h3 className="text-2xl font-bold text-white mb-3">พร้อมให้บริการซ่อมสี/ตัวถัง</h3>
            <p className="text-white/60 mb-6">
              {bodyRepairBranch?.phone && (
                <>โทร <a href={`tel:${bodyRepairBranch.phone}`} className="text-white underline">{bodyRepairBranch.phone}</a> หรือ</>
              )}{" "}
              นัดหมายออนไลน์ได้เลย
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/booking?type=body_paint&brand=GWM">
                <Button className="bg-[#C8102E] hover:bg-[#a00d25] text-white border-0">
                  นัดซ่อมสี/ตัวถัง
                </Button>
              </Link>
              <Link href="/gwm/service">
                <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                  ศูนย์บริการทั้งหมด
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
