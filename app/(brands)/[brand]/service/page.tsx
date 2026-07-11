import Link from "next/link";
import { notFound } from "next/navigation";
import BrandHero from "@/components/BrandHero";
import BrandSubNav from "@/components/brands/BrandSubNav";
import {
  BRAND_BY_SLUG,
  BRAND_SLUGS,
  isBrandSlug,
  type BrandSlug,
} from "@/lib/brandConfig";
import { getBranchesByBrand } from "@/lib/branchData";
import { getSocialLinksByBrand, getFAQItems } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { faqPageJsonLd } from "@/lib/seo";
import CallToAction from "@/components/CallToAction";
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Wrench,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
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
    title: `ศูนย์บริการ ${brand.displayName} — ช.เอราวัณ กรุ๊ป`,
    description: `ศูนย์บริการ ${brand.displayName} มาตรฐานโรงงาน ครบทุกบริการ พร้อมช่างผ่านการรับรอง ที่ ช.เอราวัณ จ.นครปฐม`,
    path: `${brand.hubPath}/service`,
  });
}

export default async function BrandServicePage({ params }: PageProps) {
  const { brand: slug } = await params;
  if (!isBrandSlug(slug)) notFound();

  const brand = BRAND_BY_SLUG[slug as BrandSlug];
  const [brandBranches, faqItems] = await Promise.all([
    Promise.resolve(getBranchesByBrand(brand.notionBrand)),
    getFAQItems(brand.notionBrand, "service"),
  ]);

  const accentColor = brand.accentColor ?? "#0F172A";

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: brand.displayNameTh, path: brand.hubPath },
    { name: "ศูนย์บริการ", path: `${brand.hubPath}/service` },
  ];

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
            label: "นัดบริการ",
            href: `/booking?type=service&brand=${brand.notionBrand}`,
          }}
          secondaryCta={{
            label: `ดูรถ ${brand.displayName}`,
            href: brand.hubPath,
          }}
          footer={
            <p className="text-white/75 text-sm">
              ศูนย์บริการมาตรฐาน {brand.displayName} • ช่างผ่านการรับรอง • อะไหล่แท้
            </p>
          }
        />

        <BrandSubNav brand={brand} currentSection="service" scrollPastHero />

        {/* ── สาขา ── */}
        {brandBranches.length > 0 && (
          <section className="py-14" style={{ backgroundColor: "#0F172A" }}>
            <div className="container">
              <div className="text-center mb-10">
                <p
                  className="text-sm font-medium uppercase tracking-wider mb-2"
                  style={{ color: accentColor }}
                >
                  ที่ตั้ง
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">
                  ศูนย์บริการ {brand.displayName} ช.เอราวัณ
                </h2>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {brandBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-7 hover:bg-white/[0.08] transition-colors"
                  >
                    <h3 className="text-lg font-bold text-white mb-4">{branch.name}</h3>
                    <div className="space-y-2.5 text-sm text-white/65 mb-5">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accentColor }} />
                        <span>{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                        <a
                          href={`tel:${branch.phone}`}
                          className="hover:text-white transition-colors"
                        >
                          {branch.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                        <span>{branch.hours}</span>
                      </div>
                    </div>
                    {branch.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {branch.services.map((svc) => (
                          <span
                            key={svc}
                            className="bg-white/10 text-white/75 text-xs px-2.5 py-1 rounded-full"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Link
                        href={`/booking?type=service&branch=${branch.id}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full text-white border-0"
                          style={{ backgroundColor: accentColor }}
                        >
                          นัดบริการ
                        </Button>
                      </Link>
                      <a
                        href={branch.lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-white/20 text-white bg-transparent hover:bg-white/10"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          LINE
                        </Button>
                      </a>
                    </div>
                    {branch.lat && branch.lng && (
                      <div className="mt-4 rounded-xl overflow-hidden h-44">
                        <iframe
                          src={`https://maps.google.com/maps?q=${branch.lat},${branch.lng}&z=16&output=embed&hl=th`}
                          width="100%"
                          height="100%"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`แผนที่ ${branch.name}`}
                          className="border-0 w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        {faqItems.length > 0 && (
          <section className="bg-gray-50 py-14">
            <div className="container max-w-3xl">
              <div className="text-center mb-10">
                <p
                  className="text-sm font-medium uppercase tracking-wider mb-2"
                  style={{ color: accentColor }}
                >
                  คำถามที่พบบ่อย
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">
                  FAQ — ศูนย์บริการ {brand.displayName}
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

        {/* ── CTA ── */}
        <section className="container py-14 text-center">
          <div className="max-w-md mx-auto">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Wrench className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              พร้อมดูแลรถ {brand.displayName} ของคุณ
            </h3>
            <p className="text-gray-500 mb-7 text-sm">
              นัดหมายล่วงหน้า รับบริการที่ศูนย์มาตรฐาน {brand.displayName} ช.เอราวัณ จ.นครปฐม
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={`/booking?type=service&brand=${brand.notionBrand}`}>
                <Button
                  className="text-white px-6"
                  style={{ backgroundColor: accentColor }}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  นัดบริการออนไลน์
                </Button>
              </Link>
              <Link href={brand.hubPath}>
                <Button variant="outline" className="px-6">
                  ดูรถ {brand.displayName}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <CallToAction
        brand={brand.displayName}
        heading={`ศูนย์บริการ ${brand.displayNameTh} ช.เอราวัณ`}
        description={`เช็คระยะ ซ่อมบำรุง อะไหล่แท้ ${brand.displayName} ที่ ช.เอราวัณ นครปฐม นัดออนไลน์สะดวก`}
      />
    </>
  );
}
