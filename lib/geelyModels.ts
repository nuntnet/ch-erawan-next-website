import type { FaqItem } from "@/lib/seo/faq";
import { getBranchById } from "@/lib/branchData";

/**
 * Static Geely model list for /geely — shown until the models exist in the Notion Cars DB
 * (the hub falls back to this only when Notion returns no Geely cars).
 *
 * Prices are MSRP incl. VAT from the Thonburi "Geely Price structure" (dealer file).
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
    image: { src: "/brands/geely/ex2.jpg", alt: "GEELY EX2 บนทางด่วนในกรุงเทพฯ", kind: "photo" },
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
    image: { src: "/brands/geely/ex5.webp", alt: "GEELY EX5", kind: "render" },
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
    image: { src: "/brands/geely/starray-em-r.webp", alt: "GEELY STARRAY", kind: "render" },
    trims: [
      { name: "PRO", msrp: 729_900 },
      { name: "MAX", msrp: 799_900 },
    ],
  },
];

export function getGeelyModel(slug: string): GeelyModel | undefined {
  return GEELY_MODELS.find((m) => m.slug === slug);
}

export function geelyStartingPrice(model: GeelyModel): number {
  return Math.min(...model.trims.map((t) => t.msrp));
}

export function geelyFaq(): FaqItem[] {
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
      answer: "รุ่นที่จำหน่าย ได้แก่ GEELY EX2, EX5 และ STARRAY EM-R สอบถามสต็อกและวันส่งมอบกับที่ปรึกษาการขายได้ที่โชว์รูม",
    },
    {
      question: "นัดทดลองขับ GEELY ได้อย่างไร",
      answer: "กรอกชื่อ เบอร์โทร และวันเวลาที่สะดวกในแบบฟอร์มนัดทดลองขับบนเว็บไซต์ ที่ปรึกษาการขายจะติดต่อกลับเพื่อยืนยันนัดหมาย",
    },
  ];
}
