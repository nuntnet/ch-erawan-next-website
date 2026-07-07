import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Phone, MessageCircle, Shield, Clock, Gift, Users, Heart } from "lucide-react";
import InsuranceQuoteForm from "@/components/InsuranceQuoteForm";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/site";
import { serviceJsonLd } from "@/lib/seo";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "ประกันภัยรถยนต์",
  description: "บริการประกันภัยรถยนต์ครบวงจรจาก ช.เอราวัณ ออโต้ กรุป",
  path: "/insurance",
});

const benefits = [
  {
    icon: Shield,
    title: "เลือกประกันได้ตามใจ",
    desc: "มีบริษัทประกันชั้นนำมากมายให้เลือกเพื่อรถของคุณ",
  },
  {
    icon: Clock,
    title: "ซ่อมเร็ว ผ่อนสบาย",
    desc: "รับค่าซ่อมสีตัวถังเร็วกว่า พร้อมผ่อน 0% นาน 4 เดือน",
  },
  {
    icon: Gift,
    title: "สิทธิพิเศษลูกค้า ช.เอราวัณ",
    desc: "รับส่วนลดพิเศษ พร้อมฟรี พ.ร.บ. และค่าบริการต่อทะเบียน",
  },
  {
    icon: Users,
    title: "มั่นใจ ปลอดภัย ของแถมจัดเต็ม",
    desc: "ไม่มีเอเจนต์ วางใจได้ และรับของแถมพรีเมียมมากมาย",
  },
  {
    icon: Heart,
    title: "บริการเป็นกันเอง",
    desc: "คุยง่าย สบายใจ เหมือนเพื่อนกัน",
  },
];

const insurancePartners = [
  "กรุงเทพประกันภัย", "ทิพยประกันภัย", "ชับบ์สามัคคีประกันภัย",
  "วิริยะประกันภัย", "เทเวศประกันภัย", "สินมั่นคงประกันภัย",
  "AIG", "โตเกียวมารีน", "กรุงไทยพานิชประกันภัย",
  "KPI", "ประกันคุ้มภัย", "อาคเนย์ประกันภัย",
  "เมืองไทยประกันภัย", "ไทยวิวัฒน์ประกันภัย",
];

const steps = [
  {
    num: "1",
    title: "Line หรือ โทรหาเรา",
    desc: "แจ้งข้อมูลรถ ยี่ห้อ รุ่น เลขทะเบียน ประเภทประกันที่สนใจ",
  },
  {
    num: "2",
    title: "เสนอราคาที่คุณพอใจ",
    desc: "สามารถปรับเปลี่ยนตามความต้องการได้ เพื่อให้เข้ากับราคาที่เหมาะสม",
  },
  {
    num: "3",
    title: "ชำระเงิน",
    desc: "ชำระง่ายๆ ในช่องทางที่คุณ สะดวกที่สุด ออนไลน์แบงค์กิ้ง บัตรเครดิต เงินสด หรือโอนเงิน",
  },
  {
    num: "4",
    title: "รับกรมธรรม์ที่บ้าน",
    desc: "ดีเสร็จ คุ้มครองทันที รอรับกรมธรรม์ ทางไปรษณีย์ที่บ้านได้เลย สะดวก สบาย",
  },
];

const crumbs = breadcrumbJsonLd([
  { name: "หน้าแรก", path: "/" },
  { name: "ประกันภัยรถยนต์", path: "/insurance" },
]);

const insuranceService = serviceJsonLd({
  name: "บริการประกันภัยรถยนต์",
  description: "บริการประกันภัยรถยนต์ครบวงจร ประกันชั้น 1-3+ จากบริษัทชั้นนำ ซ่อมเร็ว ผ่อนสบาย สิทธิพิเศษลูกค้า ช.เอราวัณ",
  path: "/insurance",
  serviceType: "AutoInsurance",
});

export default function Insurance() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(insuranceService) }} />
    <div className="min-h-screen bg-white pt-[68px]">
      {/* Header Banner */}
      <div className="relative bg-[#0F172A] overflow-hidden">
        <Image src="https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/ch-erawan/pages/insurance-hero-bg" alt="" fill className="object-cover opacity-15" />
        <div className="container relative z-10 py-14 lg:py-16">
          <p className="text-white/40 text-sm font-medium tracking-wider uppercase mb-3">Insurance</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">ประกันภัยรถยนต์</h1>
          <p className="text-white/50 max-w-lg">เปรียบเทียบจากกว่า 14 บริษัทประกันชั้นนำ พร้อมรับสิทธิพิเศษเฉพาะลูกค้า ช.เอราวัณ</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1637763723578-79a4ca9225f7?q=80&w=1200&auto=format&fit=crop"
              alt="ประกันภัยรถยนต์ ช.เอราวัณ"
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#0F172A] mb-8 leading-tight">
              ประกันภัยรถยนต์ บริการจาก<br />ช.เอราวัณ ดียังไง?
            </h1>
            <div className="space-y-5">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-[#0F172A]">{b.title} : </span>
                    <span className="text-[#64748B]">{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Partners */}
      <div className="border-t border-b border-gray-100 py-12">
        <div className="container">
          <p className="text-center text-[#64748B] mb-8">รายชื่อบริษัทประกันภัยที่เราให้บริการ</p>
          <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-10">
            {insurancePartners.map((name, i) => (
              <div
                key={i}
                className="px-4 py-2 text-sm text-[#64748B] border border-gray-200 rounded-lg hover:border-[#0F172A] hover:text-[#0F172A] transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="container py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">
              ขั้นตอนการต่อประกัน ทะเบียน
            </h2>
            <p className="text-[#64748B] mb-6 leading-relaxed">
              สะดวก รวดเร็ว ไม่ยุ่งยากเราบริการให้ค่าแนะนำและดำเนินการต่อประกันภัยรถยนต์และ
              ต่อทะเบียนแทนคุณไม่ที่ขั้นตอนไม่ว่าจะเป็นเอกสาร การชำระเงิน หรือการจัดส่งป้าย —
              เราดูแลให้ครบ จบในที่เดียว ยังมีข้อสงสัย? <Link href="/contact" className="text-[#0F172A] underline font-medium">ติดต่อเราเลย</Link>
            </p>
          </div>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#0F172A] font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {s.num}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-1">{s.title}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-4">
              <CheckCircle className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-700 mb-1">ปลอดภัยหายห่วงรับการคุ้มครองทันที</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  ประกันภัยที่ครอบคลุม เพื่อให้คุณมั่นใจในทุกเส้นทาง
                  ไม่ว่าจะขับใกล้หรือไกล
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Form */}
      <div id="quote" className="bg-[#F8FAFC] border-t border-gray-100">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-3">ขอใบเสนอราคาประกันภัย</h2>
              <p className="text-[#64748B]">กรอกข้อมูลเพื่อรับใบเสนอราคา ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-sm">
              <InsuranceQuoteForm />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#0F172A]">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="py-16 lg:py-20 pr-8">
              <h2 className="text-3xl font-bold text-white mb-4">อ่านแล้วยังสงสัยหรอ?</h2>
              <p className="text-white/70 mb-8 leading-relaxed">
                อ่านแล้วแต่ยังมีคำถามใช่ไหม? โทรหาเราตอนนี้
                เพื่อให้ผู้เชี่ยวชาญด้านประกันรถยนต์ของเราช่วยเคลียร์ทุกข้อสงสัย
                แบบตรงประเด็น ไม่ต้องเดาเอง
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="tel:034-305-500"
                  className="flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  034-305-500
                </a>
                <a
                  href="https://lin.ee/NLeKZy6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#06C755] text-white px-6 py-3 rounded-xl hover:bg-[#05B04C] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  มีข้อสงสัยสอบถามเลย
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1673187139211-1e7ec3dd60ec?q=80&w=1200&auto=format&fit=crop"
                alt="บริการเคลมประกันและซ่อมรถ"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
