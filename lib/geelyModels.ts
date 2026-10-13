import type { FaqItem } from "@/lib/seo/faq";
import { getBranchById } from "@/lib/branchData";
import type { Car } from "@/lib/notion-types";

/**
 * Geely models for /geely and /geely/models/[model].
 *
 * Source of truth is the Notion Cars DB (brand = Geely): see carToGeelyModel / lib/geelyCatalog.ts.
 * GEELY_MODELS below is only the FALLBACK used while Notion has no active Geely cars.
 *
 * Notion → model mapping (Cars DB columns):
 *   Name/Model → name · Description → summary · Image URLs[0] → image · Price Min → starting price
 *   Specs JSON → { "trims": ["PRO|429990", "MAX|459990"], "official_url": "https://…" }  (trims optional)
 *
 * Fallback prices are MSRP incl. VAT from the Thonburi "Geely Price structure" (dealer file).
 * TODO: confirm with Geely/Thonburi that these list prices may be published before launch.
 */
export interface GeelyTrim {
  name: string;
  msrp: number;
}

export interface GeelyModel {
  slug: string;
  name: string;
  /** One-line descriptor shown on the card and detail page. */
  summary: string;
  /** Official press/model image (Geely global site, mirrored locally). Transparent PNG-style renders use contain; photos use cover. */
  image: { src: string; alt: string; kind: "render" | "photo" };
  trims: GeelyTrim[];
  /** Official Geely page for full specs. */
  officialUrl?: string;
}

export const geelyModelPath = (slug: string) => `/geely/models/${slug}`;

export const GEELY_MODELS: GeelyModel[] = [
  {
    slug: "ex2",
    name: "EX2",
    summary: "รถยนต์ไฟฟ้า 5 ที่นั่ง ขนาดกะทัดรัดสำหรับใช้งานในเมือง",
    image: { src: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1791861801/ch-erawan/cars/geely-ex2.jpg", alt: "GEELY EX2 บนทางด่วนในกรุงเทพฯ", kind: "photo" },
    officialUrl: "https://www.geely.com/en/news/2025/geely-ex2-thailand-debut",
    trims: [
      { name: "PRO", msrp: 429_990 },
      { name: "MAX", msrp: 459_990 },
    ],
  },
  {
    slug: "ex5",
    name: "EX5",
    summary: "SUV ไฟฟ้า ดีไซน์ใหม่จาก GEELY",
    image: { src: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1791861803/ch-erawan/cars/geely-ex5.webp", alt: "GEELY EX5", kind: "render" },
    officialUrl: "https://www.geely.com/en/models/ex5",
    trims: [
      { name: "PRO", msrp: 799_000 },
      { name: "MAX", msrp: 899_000 },
      { name: "MAX+", msrp: 929_000 },
    ],
  },
  {
    slug: "starray-em-r",
    name: "STARRAY EM-R",
    summary: "SUV พลังงานใหม่แบบ Range Extender (EM-R)",
    // Rendered from the Starray EM-i model (same body) — replace with an EM-R specific image when available.
    image: { src: "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1791861805/ch-erawan/cars/geely-starray-em-r.webp", alt: "GEELY STARRAY", kind: "render" },
    trims: [
      { name: "PRO", msrp: 729_900 },
      { name: "MAX", msrp: 799_900 },
    ],
  },
];

/** 0 when the model has no price (hide price UI in that case). */
export function geelyStartingPrice(model: GeelyModel): number {
  return model.trims.length ? Math.min(...model.trims.map((t) => t.msrp)) : 0;
}

/** "geely-ex5-2026" → "ex5" so URLs stay short: /geely/models/ex5 */
export function modelSlugFromCarSlug(carSlug: string): string {
  return carSlug.replace(/^geely-/, "").replace(/-20\d\d$/, "");
}

/** Parse Specs.trims: ["PRO|429990", ...] (also accepts "PRO: 429,990"). */
export function parseTrims(specs: Car["specs"]): GeelyTrim[] {
  const raw = specs?.trims;
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
  const out: GeelyTrim[] = [];
  for (const entry of list) {
    const m = String(entry).match(/^\s*(.+?)\s*[|:]\s*([\d,]+(?:\.\d+)?)\s*$/);
    if (m) out.push({ name: m[1], msrp: Number(m[2].replace(/,/g, "")) });
  }
  return out;
}

/** Map a Notion Car (brand Geely) to the model view used by the Geely pages. */
export function carToGeelyModel(car: Car): GeelyModel {
  const name = (car.model || car.name).replace(/^GEELY\s+/i, "").trim();
  let trims = parseTrims(car.specs);
  if (!trims.length && car.priceMin > 0) trims = [{ name: "ราคาเริ่มต้น", msrp: car.priceMin }];
  const img = car.imageUrls[0];
  const summary = (car.description || "").split(/\r?\n/)[0].slice(0, 160);
  const official = typeof car.specs?.official_url === "string" ? car.specs.official_url : undefined;
  return {
    slug: modelSlugFromCarSlug(car.slug || car.id),
    name,
    summary: summary || `GEELY ${name}`,
    image: img
      ? { src: img, alt: `GEELY ${name}`, kind: /\.(png|webp)(\?|$)/i.test(img) ? "render" : "photo" }
      : { src: "/brands/geely-showroom.jpg", alt: "GEELY ช.เอราวัณ รัชดา", kind: "photo" },
    trims,
    officialUrl: official,
  };
}

export function getStaticGeelyModel(slug: string): GeelyModel | undefined {
  return GEELY_MODELS.find((m) => m.slug === slug);
}

export function geelyFaq(models: GeelyModel[] = GEELY_MODELS): FaqItem[] {
  const b = getBranchById("geely-ratchada");
  return [
    {
      question: "GEELY ช.เอราวัณ รัชดา ตั้งอยู่ที่ไหน",
      answer: `โชว์รูมอยู่ที่ ${b?.address ?? "ถนนรัชดาภิเษก เขตบางซื่อ กรุงเทพมหานคร"} ติดต่อ ${b?.phone ?? ""}`.trim(),
    },
    {
      question: "โชว์รูม GEELY ช.เอราวัณ รัชดา เปิดให้บริการตั้งแต่เมื่อไหร่",
      answer: "เปิดให้บริการตั้งแต่วันที่ 1 ตุลาคม 2569 ภายใต้ บริษัท ช.เอราวัณ ออโตเทค จำกัด เป็นสาขาแรกของกลุ่มในกรุงเทพมหานคร",
    },
    {
      question: "มีรุ่นอะไรให้เลือกที่โชว์รูมรัชดาบ้าง",
      answer: `รุ่นที่จำหน่าย ได้แก่ ${models.map((m) => `GEELY ${m.name}`).join(", ")} สอบถามสต็อกและวันส่งมอบกับที่ปรึกษาการขายได้ที่โชว์รูม`,
    },
    {
      question: "นัดทดลองขับ GEELY ได้อย่างไร",
      answer: "กรอกชื่อ เบอร์โทร และวันเวลาที่สะดวกในแบบฟอร์มนัดทดลองขับบนเว็บไซต์ ที่ปรึกษาการขายจะติดต่อกลับเพื่อยืนยันนัดหมาย",
    },
  ];
}
