import type { BrandSlug } from "@/lib/brandConfig";
import type { FaqItem } from "@/lib/seo/faq";
import { BRAND_BY_SLUG, BRANDS } from "@/lib/brandConfig";
import { branches, getBranchesByBrand } from "@/lib/branchData";

/** Hub-page FAQs for brands that need to explain their naming (Geely has its own in lib/geelyModels.ts). */
export const BRAND_FAQ: Partial<Record<BrandSlug, FaqItem[]>> = {
  deepal: [
    {
      question: "Changan Deepal คืออะไร Deepal กับ Changan เกี่ยวกันอย่างไร",
      answer:
        "Deepal (ดีพอล) เป็นแบรนด์รถยนต์พลังงานใหม่ของ Changan Automobile ในประเทศไทยชื่อ Changan และ Deepal ถูกใช้ควบคู่กัน เราจึงเรียกรวมว่า Changan Deepal — เป็นรถและบริการของแบรนด์เดียวกัน",
    },
    {
      question: "ซื้อ Changan Deepal ได้ที่ไหนในนครปฐม",
      answer:
        "ช.เอราวัณ เป็นตัวแทนจำหน่าย Changan Deepal อย่างเป็นทางการ ที่โชว์รูม Deepal ช.เอราวัณ ศาลายา ติดกับโชว์รูมมาสด้า ศาลายา สามารถนัดทดลองขับได้ผ่านแบบฟอร์มบนเว็บไซต์",
    },
    {
      question: "ถ้าเห็นชื่อ Changan บนรถหรือในโฆษณา ใช่รถ Deepal ที่ ช.เอราวัณ จำหน่ายหรือไม่",
      answer:
        "สอบถามรุ่นและชื่อที่ใช้เรียกล่าสุดได้กับที่ปรึกษาการขายที่โชว์รูมศาลายา เพราะแบรนด์กำลังปรับการสื่อสารเป็น Changan ชื่อรุ่นและสเปกเป็นไปตามที่ผู้ผลิตประกาศ",
    },
  ],
};

/** FAQs generated from branch data (facts only), followed by any brand-specific FAQs above. */
export function getBrandFaq(slug: BrandSlug): FaqItem[] {
  const brand = BRAND_BY_SLUG[slug];
  const own = getBranchesByBrand(brand.notionBrand);
  const generated: FaqItem[] = [];

  if (own.length > 0) {
    const places = own
      .map((b) => `${b.name} — ${b.address} โทร ${b.phone}${b.openingDate ? ` (เปิดให้บริการ ${b.openingDate})` : ""}`)
      .join(" | ");
    generated.push(
      {
        question: `${brand.displayNameTh} (${brand.displayName}) ช.เอราวัณ มีโชว์รูมที่ไหนบ้าง`,
        answer: places,
      },
      {
        question: `นัดทดลองขับ ${brand.displayName} ได้อย่างไร`,
        answer: `กรอกชื่อ เบอร์โทร และวันเวลาที่สะดวกในแบบฟอร์มนัดทดลองขับบนเว็บไซต์ หรือโทรหาโชว์รูมโดยตรง ที่ปรึกษาการขายจะติดต่อกลับเพื่อยืนยันนัดหมาย`,
      }
    );
  }
  return [...generated, ...(BRAND_FAQ[slug] ?? [])];
}

/** Home-page FAQ — facts derived from brandConfig/branchData so counts never go stale. */
export function getSiteFaq(): FaqItem[] {
  const brandNames = BRANDS.map((b) => b.displayName).join(", ");
  const bkk = branches.filter((b) => b.locality === "กรุงเทพมหานคร");
  return [
    {
      question: "ช.เอราวัณ กรุ๊ป คืออะไร",
      answer: `ช.เอราวัณ กรุ๊ป คือกลุ่มตัวแทนจำหน่ายรถยนต์อย่างเป็นทางการใน จ.นครปฐมและกรุงเทพฯ จำหน่ายรถยนต์ ${BRANDS.length} แบรนด์ ผ่าน ${branches.length} สาขา พร้อมศูนย์บริการ ซ่อมสีตัวถัง ประกันภัย และรถมือสอง`,
    },
    {
      question: "ช.เอราวัณ กรุ๊ป จำหน่ายรถยี่ห้ออะไรบ้าง",
      answer: `ช.เอราวัณ กรุ๊ป เป็นตัวแทนจำหน่ายรถยนต์ ${BRANDS.length} แบรนด์ ได้แก่ ${brandNames}`,
    },
    {
      question: "ช.เอราวัณ กรุ๊ป มีกี่สาขา อยู่ที่ไหนบ้าง",
      answer: `มี ${branches.length} สาขา ส่วนใหญ่อยู่ในจังหวัดนครปฐม (นครปฐม ศาลายา สามพราน อ้อมใหญ่)${bkk.length ? ` และ ${bkk.length} สาขาในกรุงเทพฯ คือ ${bkk.map((b) => b.displayName ?? b.name).join(", ")}` : ""} ดูที่อยู่ เบอร์โทร และแผนที่ทุกสาขาได้ที่หน้าสาขา`,
    },
    {
      question: "นัดทดลองขับหรือเข้าศูนย์บริการได้อย่างไร",
      answer: "นัดผ่านแบบฟอร์มบนเว็บไซต์ (ทดลองขับกรอกแค่ชื่อ เบอร์โทร และวันเวลาที่สะดวก) หรือโทรหาสาขาโดยตรง ที่ปรึกษาจะติดต่อกลับเพื่อยืนยันนัดหมาย",
    },
    {
      question: "นอกจากขายรถใหม่ ช.เอราวัณ มีบริการอะไรอีก",
      answer: "ทดลองขับ ศูนย์บริการและซ่อมบำรุง Body & Paint อะไหล่แท้ ประกันภัยรถยนต์ และรถมือสอง (บริการแต่ละอย่างขึ้นกับสาขาและแบรนด์)",
    },
    {
      question: "ช.เอราวัณ รับเทิร์นรถเก่าและมีรถมือสองไหม",
      answer: "มี ดูรถมือสองและส่งข้อมูลรถเก่าเพื่อขอประเมินราคาเทิร์นได้ที่หน้ารถมือสองบนเว็บไซต์ (ราคาประเมินขึ้นกับสภาพรถ)",
    },
  ];
}

/** /secondhand FAQ — paraphrases only what the page itself already states (no new claims). */
export function getSecondhandFaq(): FaqItem[] {
  return [
    {
      question: "เทิร์นรถเก่ากับ ช.เอราวัณ ต้องเตรียมข้อมูลอะไรบ้าง",
      answer:
        "แจ้งยี่ห้อ รุ่น และออปชั่น พร้อมราคาตอนซื้อ ขนาดเครื่องยนต์ สีเดิมจากโรงงาน ประเภทเกียร์ (ธรรมดาหรืออัตโนมัติ) สถานะไฟแนนซ์ (มีหรือไม่มีค้างชำระ และยอดคงเหลือ) และอุปกรณ์ตกแต่งเพิ่มเติม เช่น PG/NGV",
    },
    {
      question: "ขั้นตอนการเทิร์นหรือขายรถเก่ามีอะไรบ้าง",
      answer:
        "1) นัดหมายกับทีมรับซื้อเพื่อตรวจสอบสภาพรถที่โชว์รูม 2) ทีมงานประเมินราคาจากสภาพรถจริง 3) เจรจาราคา หากพอใจทั้งสองฝ่ายทำสัญญาได้ทันที 4) ทำสัญญาซื้อขายและเอกสาร 5) ส่งมอบรถเก่าที่โชว์รูมในวันรับรถคันใหม่ โดยประสานงานกับทีมขาย",
    },
    {
      question: "รถที่ยังผ่อนไฟแนนซ์ไม่หมดเทิร์นได้ไหม",
      answer:
        "ได้ ทีมงานจะช่วยประสานงานกับไฟแนนซ์เพื่อปิดยอดหนี้คงเหลือก่อนดำเนินการเทิร์น ส่วนรถที่ผ่อนครบแล้วจะประเมินราคาและโอนเปลี่ยนสิทธิ์ได้เลย",
    },
  ];
}
