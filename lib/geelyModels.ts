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
  trims: GeelyTrim[];
}

export const GEELY_MODELS: GeelyModel[] = [
  {
    slug: "ex2",
    name: "EX2",
    trims: [
      { name: "PRO", msrp: 429_990 },
      { name: "MAX", msrp: 459_990 },
    ],
  },
  {
    slug: "ex5",
    name: "EX5",
    trims: [
      { name: "PRO", msrp: 799_000 },
      { name: "MAX", msrp: 899_000 },
      { name: "MAX+", msrp: 929_000 },
    ],
  },
  {
    slug: "starray-em-r",
    name: "STARRAY EM-R",
    trims: [
      { name: "PRO", msrp: 729_900 },
      { name: "MAX", msrp: 799_900 },
    ],
  },
];

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
