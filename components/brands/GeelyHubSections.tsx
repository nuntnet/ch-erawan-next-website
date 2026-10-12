import Link from "next/link";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { getBranchById } from "@/lib/branchData";
import BrandFaqSection from "@/components/brands/BrandFaqSection";
import { GEELY_MODELS, geelyStartingPrice, geelyFaq } from "@/lib/geelyModels";

const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`;
const BOOKING = "/booking?type=test_drive&brand=Geely";

/** Static model cards for /geely (used until Notion has Geely cars). One action per card: book a test drive. */
export function GeelyModelCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {GEELY_MODELS.map((m) => (
        <div key={m.slug} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#3B8BEB]">GEELY</p>
          <h3 className="mt-1 text-2xl font-bold text-[#0F172A]">{m.name}</h3>
          <p className="mt-3 text-sm text-gray-500">
            เริ่มต้น <span className="text-lg font-bold text-[#0F172A]">{baht(geelyStartingPrice(m))}</span>
          </p>
          <ul className="mt-4 space-y-1.5 border-t border-gray-100 pt-4">
            {m.trims.map((t) => (
              <li key={t.name} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{t.name}</span>
                <span className="text-gray-500">{baht(t.msrp)}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`${BOOKING}&car=${encodeURIComponent(m.name)}`}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] min-h-[44px]"
          >
            นัดทดลองขับ {m.name}
            <ArrowRight className="h-4 w-4" />
          </Link>
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
