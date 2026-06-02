import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import { branches } from "@/lib/branchData";
import { getYearsOfExperience } from "@/lib/company";

const LINE_ACCOUNTS = [
  { brand: "Mazda",      lineId: "ฝ่ายขาย", url: "https://lin.ee/NLeKZy6", color: "#910023" },
  { brand: "Deepal",     lineId: "ฝ่ายขาย", url: "https://lin.ee/vK6Z54v", color: "#0066FF" },
  { brand: "Ford",       lineId: "ฝ่ายขาย", url: "https://lin.ee/PhIWeTl", color: "#003478" },
  { brand: "Mitsubishi", lineId: "ฝ่ายขาย", url: "https://lin.ee/N7UjCTE", color: "#E60012" },
  { brand: "GWM",        lineId: "ฝ่ายขาย", url: "https://lin.ee/xKFaZcUG", color: "#C8102E" },
  { brand: "Kia",        lineId: "ฝ่ายขาย", url: "https://lin.ee/XQiajzI", color: "#BB162B" },
];

const LINE_SVG = (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

const quickLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "แบรนด์รถยนต์", href: "/cars" },
  { label: "ข่าวสารและกิจกรรม", href: "/blog" },
  { label: "รางวัลและกิจกรรม", href: "/awards" },
  { label: "สาขาของเรา", href: "/branches" },
];

const serviceLinks = [
  { label: "นัดหมายทดลองขับ", href: "/booking?type=test_drive" },
  { label: "นัดหมายบริการ", href: "/booking?type=service" },
  { label: "ประกันภัยรถยนต์", href: "/insurance" },
  { label: "ซื้อขายรถมือสอง", href: "/secondhand" },
  { label: "เรื่องราวลูกค้า", href: "/stories" },
  { label: "ร่วมงานกับเรา", href: "/career" },
  { label: "แนะนำ–ติชม", href: "/feedback" },
];

export default function Footer() {
  return (
    <footer className="bg-[#131F3C] text-white">
      {/* Main footer */}
      <div className="container py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1: Logo + About + Contact */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <Link href="/" className="inline-flex mb-5" aria-label="ช.เอราวัณ ออโต้ กรุป — หน้าแรก">
              <CompanyLogo height={56} className="h-14 w-auto" />
            </Link>

            <p className="text-white/70 text-sm leading-relaxed mb-6">
              {`กลุ่มบริษัท ช.เอราวัณ ผู้จำหน่ายรถยนต์อย่างเป็นทางการ 6 แบรนด์ชั้นนำ ด้วยประสบการณ์กว่า ${getYearsOfExperience()} ปี ในจังหวัดนครปฐมและนครปฐม`}
            </p>

            {/* Contact details */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-white/60">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/30" />
                <span>75/2 หมู่ 1 ต.ธรรมศาลา อ.เมือง<br />จ.นครปฐม 73000</span>
              </div>
              <a href="tel:034305500" className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors">
                <Phone className="w-4 h-4 shrink-0 text-white/30" />
                034-305-500
              </a>
              <a href="mailto:info@ch-erawan.com" className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors">
                <Mail className="w-4 h-4 shrink-0 text-white/30" />
                info@ch-erawan.com
              </a>
              <div className="flex items-start gap-2.5 text-sm text-white/60">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-white/30" />
                <span>จันทร์ – เสาร์: 08.30 – 17.30 น.<br />อาทิตย์: 09.00 – 17.00 น.</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">เกี่ยวกับเรา</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">บริการ</h3>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: LINE OA */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-2 tracking-wide uppercase">Line Official</h3>
            <p className="text-white/65 text-xs mb-5">เพิ่มเพื่อนเพื่อรับโปรโมชั่นและข่าวสาร</p>
            <div className="space-y-2.5">
              {LINE_ACCOUNTS.map((account) => (
                <a
                  key={account.brand}
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`เพิ่มเพื่อน LINE OA ${account.brand} (${account.lineId})`}
                  className="flex items-center justify-between gap-3 bg-white/5 hover:bg-[#06C755]/15 border border-white/10 hover:border-[#06C755]/40 rounded-xl px-3.5 py-2.5 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#06C755] flex items-center justify-center shrink-0 text-white">
                      {LINE_SVG}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white/80 group-hover:text-white transition-colors truncate">{account.brand}</p>
                      <p className="text-[11px] text-white/40 group-hover:text-[#06C755] transition-colors">{account.lineId}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30 group-hover:text-[#06C755] transition-colors shrink-0 font-medium">
                    เพิ่มเพื่อน
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-white font-semibold text-sm mb-3 tracking-wide uppercase">ติดตามเรา</h3>
              <div className="flex gap-2">
                <a href="https://www.facebook.com/MazdaCh.Erawan/" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/8 hover:bg-[#1877F2] inline-flex items-center justify-center text-white/50 hover:text-white transition-all"
                  aria-label="Facebook">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@Ch.Erawan" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/8 hover:bg-[#FF0000] inline-flex items-center justify-center text-white/50 hover:text-white transition-all"
                  aria-label="YouTube">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@gwm.cherawan" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/8 hover:bg-black inline-flex items-center justify-center text-white/50 hover:text-white transition-all"
                  aria-label="TikTok">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30 text-center md:text-left">
            © {new Date().getFullYear()} กลุ่มบริษัท ช.เอราวัณ ออโต้ กรุป · สงวนลิขสิทธิ์ทั้งหมด
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-white/30">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">นโยบายคุ้มครองข้อมูลส่วนบุคคล</Link>
            <span className="hidden md:inline text-white/15">|</span>
            <Link href="/privacy-cctv" className="hover:text-white/70 transition-colors">นโยบาย CCTV</Link>
            <span className="hidden md:inline text-white/15">|</span>
            <Link href="/cookie-policy" className="hover:text-white/70 transition-colors">นโยบายคุกกี้</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
