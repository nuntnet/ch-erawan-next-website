import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { GEELY_MODELS, getGeelyModel, geelyModelPath, geelyStartingPrice } from "@/lib/geelyModels";
import { BRAND_BY_SLUG } from "@/lib/brandConfig";
import Ga4PageSignals from "@/components/Ga4PageSignals";
import { breadcrumbJsonLd, pageMetadata, canonicalUrl } from "@/lib/site";

const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`;

interface PageProps {
  params: Promise<{ model: string }>;
}

export function generateStaticParams() {
  return GEELY_MODELS.map((m) => ({ model: m.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { model: slug } = await params;
  const model = getGeelyModel(slug);
  if (!model) return {};
  return pageMetadata({
    title: `GEELY ${model.name} ราคา เริ่มต้น ${baht(geelyStartingPrice(model))} | GEELY รัชดา ช.เอราวัณ`,
    description: `GEELY ${model.name} — ${model.summary} ราคาเริ่มต้น ${baht(geelyStartingPrice(model))} นัดทดลองขับได้ที่ GEELY ช.เอราวัณ รัชดา ถนนรัชดาภิเษก เขตบางซื่อ กรุงเทพฯ`,
    path: geelyModelPath(model.slug),
    openGraphImage: model.image.src,
  });
}

export default async function GeelyModelPage({ params }: PageProps) {
  const { model: slug } = await params;
  const model = getGeelyModel(slug);
  if (!model) notFound();

  const brand = BRAND_BY_SLUG.geely;
  const others = GEELY_MODELS.filter((m) => m.slug !== model.slug);
  const crumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: brand.displayNameTh, path: brand.hubPath },
    { name: model.name, path: geelyModelPath(model.slug) },
  ];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `GEELY ${model.name}`,
    brand: { "@type": "Brand", name: "GEELY" },
    description: model.summary,
    image: canonicalUrl(model.image.src),
    url: canonicalUrl(geelyModelPath(model.slug)),
    offers: model.trims.map((t) => ({
      "@type": "Offer",
      name: `${model.name} ${t.name}`,
      price: t.msrp,
      priceCurrency: "THB",
      availability: "https://schema.org/InStock",
      seller: { "@type": "AutoDealer", name: "GEELY ช.เอราวัณ รัชดา" },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <Ga4PageSignals
        pageType="model_detail"
        item={{ itemId: `geely-${model.slug}`, itemName: model.name, itemBrand: "Geely", itemCategory: "new_car", price: geelyStartingPrice(model) }}
      />
      <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
        <div className="container py-8 lg:py-12">
          <nav aria-label="breadcrumb" className="text-sm text-gray-400">
            <Link href="/" className="hover:text-[#0F172A]">หน้าแรก</Link> /{" "}
            <Link href={brand.hubPath} className="hover:text-[#0F172A]">{brand.displayNameTh}</Link> /{" "}
            <span className="text-gray-600">{model.name}</span>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-b from-slate-50 to-slate-200">
              <Image
                src={model.image.src}
                alt={model.image.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={model.image.kind === "photo" ? "object-cover object-[75%_75%]" : "object-contain p-8"}
              />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-[#3B8BEB]">GEELY</p>
              <h1 className="mt-1 text-3xl font-bold text-[#0F172A] lg:text-4xl">{model.name}</h1>
              <p className="mt-2 text-gray-500">{model.summary}</p>
              <p className="mt-5 text-sm text-gray-500">
                ราคาเริ่มต้น <span className="text-2xl font-bold text-[#0F172A]">{baht(geelyStartingPrice(model))}</span>
              </p>

              <ul className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                {model.trims.map((t) => (
                  <li key={t.name} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-gray-700">{model.name} {t.name}</span>
                    <span className="font-semibold text-[#0F172A]">{baht(t.msrp)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-400">
                ราคาป้ายแนะนำรวมภาษีมูลค่าเพิ่ม อาจเปลี่ยนแปลงตามโปรโมชั่นและเงื่อนไขของผู้ผลิต
              </p>

              <Link
                href={`/booking?type=test_drive&brand=Geely&car=${encodeURIComponent(model.name)}`}
                className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B]"
              >
                นัดทดลองขับ {model.name} <ArrowRight className="h-4 w-4" />
              </Link>
              {model.officialUrl && (
                <a
                  href={model.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3B8BEB]"
                >
                  ดูข้อมูลและสเปกจาก GEELY อย่างเป็นทางการ <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          <section className="mt-12 rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-lg font-bold text-[#0F172A]">ดูรถจริงที่โชว์รูม GEELY ช.เอราวัณ รัชดา</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              สอบถามสต็อก วันส่งมอบ สเปกรุ่นย่อย และข้อเสนอไฟแนนซ์กับที่ปรึกษาการขายที่โชว์รูม ถนนรัชดาภิเษก เขตบางซื่อ กรุงเทพฯ
              โทร 098-354-2979
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#0F172A]">รุ่นอื่นของ GEELY</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {others.map((m) => (
                <Link
                  key={m.slug}
                  href={geelyModelPath(m.slug)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-[#3B8BEB] hover:text-[#3B8BEB]"
                >
                  {m.name} <span className="text-gray-400">เริ่มต้น {baht(geelyStartingPrice(m))}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
