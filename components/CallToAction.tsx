"use client";

import Link from "next/link";
import { Calendar, Phone, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallToActionProps {
  /** Brand name for personalization */
  brand?: string;
  /** Which CTA variant to show */
  variant?: "full" | "compact" | "inline";
  /** Override heading text */
  heading?: string;
  /** Override description */
  description?: string;
  /** Additional CSS class */
  className?: string;
}

export default function CallToAction({
  brand,
  variant = "full",
  heading,
  description,
  className = "",
}: CallToActionProps) {
  const brandText = brand ? ` ${brand}` : "";
  const defaultHeading = heading ?? `สนใจรถ${brandText}? นัดทดลองขับฟรีวันนี้`;
  const defaultDesc = description ??
    `ช.เอราวัณ กรุ๊ป ตัวแทนจำหน่าย${brandText}อย่างเป็นทางการ 7 สาขาในนครปฐม พร้อมบริการหลังการขายครบวงจร ศูนย์บริการมาตรฐาน Body & Paint มาตรฐาน OEM`;

  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap items-center gap-3 py-4 ${className}`}>
        <Link href="/booking?type=test_drive">
          <Button className="bg-[#DD5259] hover:bg-[#c9454c] text-white font-semibold text-sm">
            <Calendar className="w-4 h-4 mr-1.5" /> นัดทดลองขับ
          </Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline" className="border-[#0F172A] text-[#0F172A] text-sm">
            <Phone className="w-4 h-4 mr-1.5" /> ติดต่อฝ่ายขาย
          </Button>
        </Link>
        <a href="tel:034305500" className="text-sm text-[#64748B] hover:text-[#0F172A] flex items-center gap-1">
          <Phone className="w-3.5 h-3.5" /> 034-305-500
        </a>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`bg-[#0F172A] rounded-2xl p-6 text-center ${className}`}>
        <p className="text-white font-bold text-lg mb-2">{defaultHeading}</p>
        <p className="text-white/50 text-sm mb-4 max-w-md mx-auto">{defaultDesc}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/booking?type=test_drive">
            <Button className="bg-[#DD5259] hover:bg-[#c9454c] text-white font-semibold">
              <Calendar className="w-4 h-4 mr-1.5" /> นัดทดลองขับ
            </Button>
          </Link>
          <Link href="/branches">
            <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 bg-transparent">
              <MapPin className="w-4 h-4 mr-1.5" /> ดูสาขาใกล้คุณ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // variant === "full"
  return (
    <section className={`bg-[#0F172A] py-12 lg:py-16 ${className}`}>
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-px bg-[#DD5259]" />
            <span className="text-[#DD5259] text-xs font-bold uppercase tracking-[0.25em]">Ch.Erawan Group</span>
            <div className="w-8 h-px bg-[#DD5259]" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
            {defaultHeading}
          </h2>
          <p className="text-white/50 text-sm lg:text-base leading-relaxed mb-8 max-w-xl mx-auto">
            {defaultDesc}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/booking?type=test_drive">
              <Button className="bg-[#DD5259] hover:bg-[#c9454c] text-white font-semibold px-6 py-3 text-base">
                <Calendar className="w-4 h-4 mr-2" /> นัดทดลองขับฟรี
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 bg-transparent px-6 py-3 text-base">
                <MessageCircle className="w-4 h-4 mr-2" /> สอบถามเพิ่มเติม
              </Button>
            </Link>
            <Link href="/branches">
              <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 bg-transparent px-6 py-3 text-base">
                <MapPin className="w-4 h-4 mr-2" /> 7 สาขา
              </Button>
            </Link>
          </div>
          <p className="text-white/30 text-xs mt-6">
            โทร <a href="tel:034305500" className="text-white/50 hover:text-white underline">034-305-500</a> · จ-ศ 08:00–18:00 · ส-อา 08:00–17:00
          </p>
        </div>
      </div>
    </section>
  );
}
