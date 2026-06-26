import Link from "next/link";
import { Home } from "lucide-react";

export const metadata = {
  title: "ไม่พบหน้าที่คุณค้นหา (404) | ช.เอราวัณ ออโต้ กรุป",
};

export default function NotFound() {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center pt-[68px] py-16 lg:py-24 px-4">
      <div className="w-full max-w-[1280px] mx-auto flex flex-col-reverse lg:flex-row items-center justify-center gap-10 lg:gap-8 px-2 lg:px-8">
        {/* Text */}
        <div className="flex-1 w-full flex flex-col gap-10 lg:gap-12 items-start lg:pr-8">
          <div className="flex flex-col gap-5 lg:gap-6 w-full">
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-base leading-6 text-[#0F1830]">404 error</p>
              <h1 className="font-bold text-[#181D27] tracking-[-0.02em] text-[40px] leading-[1.1] lg:text-[60px] lg:leading-[72px]">
                ขออภัยหน้านี้ไม่มีอยู่
                <br />
                ในระบบของเรา
              </h1>
            </div>
            <p className="text-[#535862] text-lg lg:text-xl leading-[28px] lg:leading-[30px] max-w-[480px]">
              หน้าเพจที่คุณกำลังเข้าชมอาจถูกย้าย ลบ หรือไม่มีอยู่จริง
              กรุณากลับไปยังหน้าแรกหรือเลือกเมนูด้านบนเพื่อค้นหาข้อมูลเกี่ยวกับรถยนต์และบริการของเรา
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#111B36] px-[18px] py-3 text-white font-semibold text-base shadow-sm hover:bg-[#1d2a4d] transition-colors min-h-[44px]"
          >
            <Home className="w-5 h-5" />
            กลับหน้าแรก
          </Link>
        </div>

        {/* 404 illustration */}
        <div className="flex-1 w-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/404-illustration.svg"
            alt="404"
            className="w-full max-w-[514px] h-auto"
          />
        </div>
      </div>
    </section>
  );
}
