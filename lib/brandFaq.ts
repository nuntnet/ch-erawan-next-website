import type { BrandSlug } from "@/lib/brandConfig";
import type { FaqItem } from "@/lib/seo/faq";

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
