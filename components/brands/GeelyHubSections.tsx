import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { getBranchById } from "@/lib/branchData";
import BrandFaqSection from "@/components/brands/BrandFaqSection";
import { GEELY_MODELS, geelyStartingPrice, geelyFaq, geelyModelPath } from "@/lib/geelyModels";

const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`;
const BOOKING = "/booking?type=test_drive&brand=Geely";

/** Static model cards for /geely (used until Notion has Geely cars). Card → detail page; button → test-drive booking. */
export function GeelyModelCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {GEELY_MODELS.map((m) => (
        <div key={m.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
          <Link href={geelyModelPath(m.slug)} className="block" aria-label={`ดูรายละเอียด ${m.name}`}>
            <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-200">
              <Image
                src={m.image.src}
                alt={m.image.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={m.image.kind === "photo" ? "object-cover object-[75%_75%]" : "object-contain p-6"}
              />
            </div>
          </Link>
          <div className="flex flex-1 flex-col p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#3B8BEB]">GEELY</p>
            <Link href={geelyModelPath(m.slug)} className="mt-1 text-2xl font-bold text-[#0F172A] hover:text-[#3B8BEB]">
              {m.name}
            </Link>
            <p className="mt-1 text-sm text-gray-500">{m.summary}</p>
            <p className="mt-3 text-sm text-gray-500">
              เริ่มต้น <span className="text-lg font-bold text-[#0F172A]">{baht(geelyStartingPrice(m))}</span>
            </p>
            <Link href={geelyModelPath(m.slug)} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#3B8BEB] hover:underline">
              ดูรายละเอียด <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`${BOOKING}&car=${encodeURIComponent(m.name)}`}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] min-h-[44px]"
            >
              นัดทดลองขับ {m.name}
            </Link>
          </div>
        </div>
      ))}
      <p className="sm:col-span-2 lg:col-span-3 text-xs text-gray-400">
        ราคาป้ายแนะนำรวมภาษีมูลค่าเพิ่ม อาจเปลี่ยนแปลงตามโปรโมชั่นและเงื่อนไขของผู้ผลิต — สอบถามราคาล่าสุดกับที่ปรึกษาการขาย
      </p>
    </div>
  );
}

/** Showroom address/phone/map + FAQ for /geely. */
export function GeelyShowroomAndFaq() {
  const branch = getBranchById("geely-ratchada");
  const faq = geelyFaq();
  return (
    <>
      {branch && (
        <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-labelledby="geely-showroom">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 id="geely-showroom" className="text-xl font-bold text-[#0F172A]">{branch.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{branch.companyName}</p>
            <p className="mt-5 flex gap-3 text-sm text-gray-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#3B8BEB]" />
              {branch.address}
            </p>
            <p className="mt-3 flex gap-3 text-sm text-gray-700">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#3B8BEB]" />
              <a href={`tel:${branch.phone.replace(/[^0-9]/g, "")}`} className="hover:text-[#3B8BEB]">{branch.phone}</a>
            </p>
            <a
              href={branch.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block text-sm font-medium text-[#3B8BEB] hover:underline"
            >
              เปิดใน Google Maps →
            </a>
          </div>
          <div className="min-h-[260px] overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            <iframe
              title="แผนที่ GEELY ช.เอราวัณ รัชดา"
              src={branch.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[260px] w-full border-0"
            />
          </div>
        </section>
      )}

      <BrandFaqSection items={faq} id="geely-faq" />
    </>
  );
}
