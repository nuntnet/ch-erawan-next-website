import type { FaqItem } from "@/lib/seo/faq";

/** Collapsible FAQ list shared by brand hub pages (pair with faqPageJsonLd for rich results). */
export default function BrandFaqSection({ items, id }: { items: FaqItem[]; id: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-12" aria-labelledby={id}>
      <h2 id={id} className="text-xl font-bold text-[#0F172A]">คำถามที่พบบ่อย</h2>
      <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {items.map((item) => (
          <details key={item.question} className="group p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#0F172A] marker:hidden">
              {item.question}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
