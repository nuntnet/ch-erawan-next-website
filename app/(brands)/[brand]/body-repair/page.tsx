import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import BrandHero from "@/components/BrandHero";
import BrandServiceContent from "@/components/brands/BrandServiceContent";
import BrandSubNav from "@/components/brands/BrandSubNav";
import {
  BRAND_BY_SLUG,
  BRAND_SLUGS,
  isBrandSlug,
  type BrandSlug,
} from "@/lib/brandConfig";
import { getBranchesByBrand } from "@/lib/branchData";
import { getInsurancePartners, getFAQItems, getSocialLinksByBrand } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { faqPageJsonLd } from "@/lib/seo";
import {
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  FileText,
  Phone,
  MessageCircle,
  PaintBucket,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ brand: string }>;
}

export async function generateStaticParams() {
  return BRAND_SLUGS.map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: PageProps) {
  const { brand: slug } = await params;
  if (!isBrandSlug(slug)) return {};
  const brand = BRAND_BY_SLUG[slug as BrandSlug];
  return pageMetadata({
    title: `ศูนย์ซ่อมสี/ตัวถัง ${brand.displayName} — ช.เอราวัณ กรุ๊ป`,
    description: `ซ่อมสีและตัวถังรถ ${brand.displayName} มาตรฐานโรงงาน ช่างเทคนิคเฉพาะทาง 20 คน สีตรงรุ่น อุปกรณ์ครบ ที่ ช.เอราวัณ จ.นครปฐม`,
    path: `${brand.hubPath}/body-repair`,
  });
}

const repairSteps = [
  { step: "01", title: "ตรวจประเมินความเสียหาย", desc: "ผู้เชี่ยวชาญตรวจสอบและประเมินค่าซ่อมโดยละเอียด" },
  { step: "02", title: "อนุมัติและวางแผนงาน", desc: "ลูกค้าได้รับใบเสนอราคาพร้อมกำหนดเวลา" },
  { step: "03", title: "ซ่อมโครงสร้างตัวถัง", desc: "ปรับโครงสร้างด้วยเครื่องดัดตัวถังระบบ 3D" },
  { step: "04", title: "เตรียมพื้นผิวและพ่นสี", desc: "ห้องพ่นสีมาตรฐาน สีตรงรหัสโรงงาน" },
  { step: "05", title: "ตกแต่งและขัดเงา", desc: "ขัดเคลือบสีให้เงางามเหมือนใหม่" },
  { step: "06", title: "ตรวจสอบคุณภาพ", desc: "QC ทุกจุดก่อนส่งมอบรถ" },
];

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

export default async function BrandBodyRepairPage({ params }: PageProps) {
  const { brand: slug } = await params;
  if (!isBrandSlug(slug)) notFound();

  const brand = BRAND_BY_SLUG[slug as BrandSlug];
  const accentColor = brand.accentColor ?? "#0F172A";
  const brandBranches = getBranchesByBrand(brand.notionBrand);
  const bodyRepairBranch = brandBranches[0];

  const [insuranceList, faqItems, socialLinks] = await Promise.all([
    getInsurancePartners(true),
    getFAQItems(brand.notionBrand, "body-repair"),
    getSocialLinksByBrand(brand.notionBrand),
  ]);

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: brand.displayNameTh, path: brand.hubPath },
    { name: "ซ่อมสี/ตัวถัง", path: `${brand.hubPath}/body-repair` },
  ];

  // Prefer Notion-managed LINE link, fall back to static brand config
  const notionLineLink = socialLinks.find((s) => s.platform === "LINE");
  const lineUrl = notionLineLink?.url ?? brand.social?.line;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(faqItems.map(f => ({ question: f.question, answer: f.answer })))) }}
        />
      )}
      <div className="min-h-screen bg-[#F8FAFC] pt-[64px]">
        <BrandHero
          brand={brand}
          breadcrumbs={breadcrumbs}
          primaryCta={{
            label: "นัดซ่อมสี/ตัวถัง",
            href: `/booking?type=body_paint&brand=${brand.notionBrand}`,
          }}
          secondaryCta={{
            label: `ดูรถ ${brand.displayName}`,
            href: brand.hubPath,
          }}
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
                { num: "1", label: `ศูนย์มาตรฐาน ${brand.displayName}` },
                { num: "1 ปี", label: "รับประกันงานซ่อม" },
                { num: "100%", label: "สีตรงรหัสโรงงาน" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl lg:text-4xl font-bold" style={{ color: accentColor }}>
                    {s.num}
                  </div>
                  <div className="mt-1 text-sm text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ขั้นตอนการซ่อม */}
        <section className="container py-12 lg:py-16">
          <div className="text-center mb-10">
            <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: accentColor }}>
              มาตรฐานการซ่อม
            </p>
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

        {/* บริการที่รองรับ */}
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
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* บริษัทประกันที่รับซ่อม */}
        {insuranceList.length > 0 && (
          <section className="container py-12 lg:py-16">
            <div className="text-center mb-8">
              <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                พันธมิตรประกันภัย
              </p>
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
        )}

        {/* เอกสารสำหรับเคลมประกัน */}
        <section className="container py-12 lg:py-16">
          <div className="text-center mb-10">
            <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: accentColor }}>
              เตรียมก่อนมา
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">
              เอกสารที่ต้องนำมาวันแจ้งเคลมซ่อมสี-ตัวถัง
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-sm">
              เพื่อให้การดำเนินการเคลมเป็นไปอย่างรวดเร็ว กรุณาเตรียมเอกสารเหล่านี้ให้ครบก่อนเข้ารับบริการ
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {claimDocuments.map((doc, i) => (
              <div key={doc.title} className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accentColor}18` }}
                >
                  <FileText className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">เอกสารที่ {i + 1}</p>
                  <h3 className="font-semibold text-[#0F172A] text-sm leading-snug">{doc.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{doc.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            * เอกสารอาจแตกต่างกันตามเงื่อนไขของบริษัทประกันภัย — ทีมงานจะแจ้งรายละเอียดเพิ่มเติมเมื่อนัดหมาย
          </p>
        </section>

        {/* นัดหมายเข้าซ่อม */}
        <section className="bg-[#0F172A] py-12 lg:py-14">
          <div className="container max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: accentColor }}>
              ติดต่อเรา
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              นัดหมายเข้าซ่อมสี-ตัวถัง
            </h2>
            <p className="text-white/50 text-sm mb-8">
              เปิดให้บริการ จ–ศ 08:00–17:00 น. (ยกเว้นวันหยุดนักขัตฤกษ์)
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={`/booking?type=body_paint&brand=${brand.notionBrand}`}>
                <Button className="text-white border-0" style={{ backgroundColor: accentColor }}>
                  นัดหมายออนไลน์
                </Button>
              </Link>
              {bodyRepairBranch?.phone && (
                <a href={`tel:${bodyRepairBranch.phone}`}>
                  <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                    <Phone className="w-4 h-4 mr-2" />
                    {bodyRepairBranch.phone}
                  </Button>
                </a>
              )}
              {lineUrl && (
                <a href={lineUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    LINE {brand.displayName}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ตารางค่าใช้จ่าย */}
        <section className="container py-12 lg:py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                ค่าใช้จ่าย
              </p>
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
            <p className="text-xs text-gray-400 text-center mt-4">
              * ราคาขึ้นอยู่กับความเสียหายและเงื่อนไขกรมธรรม์ — ติดต่อเราเพื่อประเมินเบื้องต้นฟรี
            </p>
          </div>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="bg-gray-50 py-12 lg:py-16">
            <div className="container max-w-2xl">
              <div className="text-center mb-8">
                <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                  คำถามที่พบบ่อย
                </p>
                <h2 className="text-2xl font-bold text-[#0F172A]">
                  FAQ — ซ่อมสี/ตัวถัง {brand.displayName}
                </h2>
              </div>
              <div className="space-y-3">
                {faqItems.map((item) => (
                  <details
                    key={item.id}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none select-none hover:bg-gray-50 transition-colors">
                      <span className="font-semibold text-[#0F172A] text-sm leading-snug">
                        {item.question}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Notion CMS content — admin adds sections via /admin/service-content */}
        <Suspense fallback={null}>
          <BrandServiceContent brand={brand.notionBrand} page="body-repair" />
        </Suspense>

        {/* CTA */}
        <section className="bg-[#0F172A] py-12">
          <div className="container text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${accentColor}25` }}
            >
              <PaintBucket className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">พร้อมให้บริการซ่อมสี/ตัวถัง</h3>
            <p className="text-white/60 mb-6 text-sm">
              {bodyRepairBranch?.phone ? (
                <>
                  โทร{" "}
                  <a href={`tel:${bodyRepairBranch.phone}`} className="text-white underline">
                    {bodyRepairBranch.phone}
                  </a>{" "}
                  หรือ{" "}
                </>
              ) : null}
              นัดหมายออนไลน์ได้เลย
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={`/booking?type=body_paint&brand=${brand.notionBrand}`}>
                <Button className="text-white border-0" style={{ backgroundColor: accentColor }}>
                  นัดซ่อมสี/ตัวถัง
                </Button>
              </Link>
              <Link href={`${brand.hubPath}/service`}>
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
