import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Phone, Mail, MapPin, Car, Gauge, Palette, Settings, CreditCard, Wrench, ArrowRight, Clock, DollarSign, Shield } from "lucide-react";
import { pageMetadata } from "@/lib/site";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "รับซื้อรถมือสอง",
  description: "บริการรับซื้อรถมือสอง ประเมินราคายุติธรรม จาก ช.เอราวัณ ออโต้ กรุป",
  path: "/secondhand",
});

const requiredInfo = [
  { icon: Car, title: "ยี่ห้อ/รุ่น/ออปชั่น/ค่าตัวราคา", desc: "ยี่ห้อและรุ่น ออปชั่นเสริม ค่าตัวราคาตอนซื้อ" },
  { icon: Gauge, title: "ขนาดเครื่องยนต์", desc: "ขนาดเครื่องยนต์ เช่อ เครื่อง 1.5L, 2.0L, 2500cc" },
  { icon: Palette, title: "สีของรถ", desc: "สีของรถ แจ้งสีเดิมจากโรงงาน ทางเราจะนำมา" },
  { icon: Settings, title: "ประเภทของเกียร์", desc: "รถของท่านเป็น เกียร์ออโตเมติก (Manual) หรือ เกียร์อัตโนมัติ (Automatic)" },
  { icon: CreditCard, title: "แบบไม่มี หรือ มีบัญชี", desc: "แบบไม่มี หรือ มีบัญชี และยอดหนี้คงเหลือ" },
  { icon: Wrench, title: "รถมอบอุปกรณ์ตกแต่ง", desc: "รถมอบอุปกรณ์ตกแต่งเพิ่มเติม เช่น (PG/NGV) หรือไม่" },
];

const tradeInSteps = [
  { num: "1", title: "ประเมินที่โชว์รูม", desc: "ประสานงานกับทีมรับซื้อ เพื่อนัดหมายเข้าตรวจสอบสภาพรถ" },
  { num: "2", title: "นำหน้าที่ทำการประเมินราคา", desc: "ทีมงานจะทำการประเมินราคา โดยดูจากสภาพรถจริง ๆ" },
  { num: "3", title: "เข้าหน้าเจรจาราคาการตรวจสอบ", desc: "หากตกลงราคาเป็นที่พอใจทั้งสองฝ่าย พร้อมทำสัญญาได้เลย ทันที" },
  { num: "4", title: "ทำสัญญาการซื้อขาย", desc: "พร้อมดำเนินการเรื่องเอกสารและทำสัญญาซื้อขายอย่างเป็นทางการ" },
  { num: "5", title: "นำรถส่งต่อคันมาที่โชว์รูม ณ วัน เวลาที่รับรถคันใหม่", desc: "โดยประสานงานกับทีมขาย ไม่ต้องกังวลเรื่องการโอนเปลี่ยนสิทธิ์" },
];

const reasons = [
  {
    icon: DollarSign,
    title: "ค่าใช้จ่ายซ่อมบำรุงรถเก่าที่สูงขึ้น",
    desc: "เมื่อรถมีอายุมากขึ้น ค่าซ่อมบำรุงก็สูงตามไปด้วย ทั้งค่าอะไหล่ ค่าแรง ค่าเปลี่ยนชิ้นส่วน ในระยะยาวอาจแพงกว่าการผ่อนรถใหม่",
  },
  {
    icon: Shield,
    title: "ความปลอดภัยเรื่องที่ต้องใส่ใจ",
    desc: "รถรุ่นใหม่มาพร้อมระบบความปลอดภัยที่ทันสมัย ทั้งระบบเบรก ABS, ถุงลมนิรภัย, กล้องรอบคัน ทำให้ขับขี่ปลอดภัยมากขึ้น",
  },
  {
    icon: Clock,
    title: "ประสิทธิภาพและความน่าเชื่อถือที่ดีกว่า",
    desc: "รถยนต์ใหม่มีประสิทธิภาพเครื่องยนต์ที่ดีกว่า ประหยัดน้ำมัน พร้อมรับประกันจากศูนย์บริการ ไม่ต้องกังวลเรื่องค่าซ่อม",
  },
];

export default function Secondhand() {
  return (
    <div className="min-h-screen bg-white pt-[68px]">
      {/* Header Banner */}
      <div className="relative bg-[#0F172A] overflow-hidden">
        <Image src="https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/ch-erawan/pages/secondhand-hero-bg" alt="" fill className="object-cover opacity-20" />
        <div className="container relative z-10 py-14 lg:py-16">
          <p className="text-white/40 text-sm font-medium tracking-wider uppercase mb-3">Trade-In & Used Cars</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">ซื้อ-ขาย รถมือสอง</h1>
          <p className="text-white/50 max-w-lg">รับเทิร์นรถเก่าแลกซื้อคันใหม่ ราคายุติธรรม บริการครบวงจร</p>
        </div>
      </div>

      {/* Hero */}
      <div className="container py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1600191763437-4262cefe23ab?q=80&w=1200&auto=format&fit=crop"
              alt="ซื้อ-ขาย รถมือสอง"
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#0F172A] mb-4 leading-tight">
              ซื้อ-ขาย รถมือสอง<br />รับเทิร์นรถเก่าแลกซื้อคันใหม่
            </h1>
            <p className="text-[#64748B] mb-6 leading-relaxed">
              ที่ ช.เอราวัณ เราเปิดรับ ซื้อ-ขาย-เทิร์น รถยนต์ทุกรุ่นและรถมือสอง เพื่อเพิ่มความ
              สะดวกสบายให้กับลูกค้าทุกท่าน
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-[#0F172A]">สะดวกสบาย ไม่ต้องเสียเวลา</span>
                  <p className="text-[#64748B] text-sm mt-1">เราจะทำทุกขั้นตอนให้ครบจบในที่เดียว ตั้งแต่การประเมินราคา ทำเอกสาร จนถึงการโอนเปลี่ยนสิทธิ์ ไม่ต้องวิ่งหลายที่</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-[#0F172A]">ราคายุติธรรม เพื่อความสบายใจ</span>
                  <p className="text-[#64748B] text-sm mt-1">ทีมผู้เชี่ยวชาญของเราประเมินราคาตามสภาพจริง ด้วยเกณฑ์มาตรฐาน ทำให้ลูกค้ามั่นใจได้ว่าได้ราคาที่เป็นธรรม</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Required Info */}
      <div className="bg-[#F8FAFC] py-16">
        <div className="container">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] text-center mb-3">
            ลูกค้าต้องแจ้งรายละเอียดเบื้องต้น
          </h2>
          <p className="text-center text-[#64748B] mb-10">เพื่อประเมินราคาดังต่อไปนี้</p>
          <div className="grid md:grid-cols-3 gap-4">
            {requiredInfo.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <item.icon className="w-6 h-6 text-[#0F172A] mb-3" />
                <h3 className="font-semibold text-[#0F172A] mb-1 text-sm">{item.title}</h3>
                <p className="text-[#94A3B8] text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade-in Cases */}
      <div className="container py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1761917904658-2a9ecb84a169?q=80&w=1200&auto=format&fit=crop"
              alt="การเทิร์นรถเก่า"
              className="w-full h-[350px] object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">การเทิร์นรถเก่าจะแยกเป็น 2 กรณี คือ</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-2">กรณีรถไม่มีของค้างการผ่อนไฟแนนซ์</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  สำหรับรถที่ผ่อนชำระครบแล้ว เราจะทำการประเมินราคา และดำเนินการโอนเปลี่ยนสิทธิ์
                  ความสะดวกสบายที่ลูกค้าจะได้รับคือไม่ต้องวิ่งหลายที่
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-2">กรณีที่ยังค้างชำระกับทางไฟแนนซ์</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  ในกรณีที่ยังมีค้างชำระ ทีมงานจะช่วยประสานงานกับไฟแนนซ์ให้ เพื่อปิดยอดหนี้คงเหลือ
                  ก่อนดำเนินการเทิร์น ไม่ต้องกังวลเรื่องเอกสาร ทางเราจัดการให้ครบ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reasons to Trade */}
      <div className="bg-[#F8FAFC] py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-8">
                เหตุผลที่จะต้องเปลี่ยนรถเก่าเป็นรถใหม่
              </h2>
              <div className="space-y-6">
                {reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 text-[#0F172A] mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[#0F172A] mb-1">{r.title}</h3>
                      <p className="text-[#64748B] text-sm leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600191763994-a5e80844476e?q=80&w=1200&auto=format&fit=crop"
                alt="รถมือสองคุณภาพ"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-[#0F172A] py-16">
        <div className="container">
          <h2 className="text-2xl lg:text-3xl font-bold text-white text-center mb-3">
            ยังมีข้อสงสัยเพิ่มเติม? ติดต่อเราเลย
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">ติดต่อผ่านทางอีเมล</h3>
              <p className="text-white/50 text-sm mb-3">ส่งอีเมลหาเราได้เลย</p>
              <p className="text-white text-sm">info@ch-erawan.com</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">ที่อยู่</h3>
              <p className="text-white/50 text-sm mb-3">สำนักงานใหญ่</p>
              <p className="text-white text-sm">75/2 ม.1 ถ.เพชรเกษม ต.ธรรมศาลา อ.เมือง จ.นครปฐม 73000</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Call us</h3>
              <p className="text-white/50 text-sm mb-3">08.00 - 17.00 น. ติดต่อสอบถามข้อมูลเพิ่มเติม</p>
              <p className="text-white text-sm">034-305-500</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade-in Steps */}
      <div className="container py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-4">
              ขั้นตอนการเทิร์นรถเก่า แลกรถคันใหม่
            </h2>
            <p className="text-[#64748B] mb-6 leading-relaxed">
              เราเปิดรับทุกยี่ห้อ ทุกรุ่น สามารถนำรถเก่ามาเทิร์นเพื่อซื้อรถคันใหม่ได้ง่ายๆ
              ด้วยขั้นตอนที่ไม่ยุ่งยาก เราจะดูแลทุกขั้นตอนให้คุณ
            </p>
            <Link href="/contact">
              <button className="bg-[#0F172A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#1E293B] transition-colors flex items-center gap-2">
                มีข้อสงสัยสอบถามเลย
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="space-y-5">
            {tradeInSteps.map((s, i) => (
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
                <h3 className="font-semibold text-green-700 mb-1">จบขั้นตอน สบายหายห่วง</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  ประกันภัยที่ครอบคลุม เพื่อให้คุณมั่นใจในทุกเส้นทาง ไม่ว่าจะขับใกล้หรือไกล
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
