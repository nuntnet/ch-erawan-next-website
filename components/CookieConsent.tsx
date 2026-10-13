"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OPEN_CONSENT_EVENT, readConsent, saveConsent, type ConsentChoice } from "@/lib/consent";

/** PDPA-style opt-in banner driving Google Consent Mode v2. Re-openable via the "open-cookie-settings" event. */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice>({ analytics: false, marketing: false });

  useEffect(() => {
    const stored = readConsent();
    if (stored) setChoice(stored);
    else setOpen(true);

    const reopen = () => {
      const current = readConsent();
      if (current) setChoice(current);
      setDetail(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const commit = useCallback((c: ConsentChoice) => {
    saveConsent(c);
    setChoice(c);
    setOpen(false);
    setDetail(false);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="การตั้งค่าคุกกี้"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] sm:p-5"
    >
      <div className="container flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl text-sm leading-relaxed text-gray-600">
          <p className="font-semibold text-[#0F172A]">เว็บไซต์นี้ใช้คุกกี้</p>
          <p className="mt-1">
            เราใช้คุกกี้เพื่อวัดผลการใช้งานเว็บไซต์และปรับปรุงบริการ คุณเลือกยอมรับหรือปฏิเสธได้ — คุกกี้ที่จำเป็นต่อการทำงานของเว็บไซต์ใช้เสมอ{" "}
            <Link href="/cookie-policy" className="text-[#DD5259] underline">อ่านนโยบายคุกกี้</Link>
          </p>

          {detail && (
            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked disabled className="mt-1 h-4 w-4" />
                <span><b>จำเป็น</b> — ทำให้เว็บไซต์ทำงานได้ (ปิดไม่ได้)</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={choice.analytics}
                  onChange={(e) => setChoice((c) => ({ ...c, analytics: e.target.checked }))}
                  className="mt-1 h-4 w-4"
                />
                <span><b>วิเคราะห์การใช้งาน</b> — Google Analytics เพื่อดูว่าหน้าไหนถูกใช้งาน</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={choice.marketing}
                  onChange={(e) => setChoice((c) => ({ ...c, marketing: e.target.checked }))}
                  className="mt-1 h-4 w-4"
                />
                <span><b>การตลาด</b> — วัดผลและปรับโฆษณาให้ตรงความสนใจ</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {detail ? (
            <button
              type="button"
              onClick={() => commit(choice)}
              className="min-h-[44px] rounded-xl bg-[#0F172A] px-5 text-sm font-semibold text-white hover:bg-[#1E293B]"
            >
              บันทึกการตั้งค่า
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDetail(true)}
              className="min-h-[44px] rounded-xl border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ตั้งค่า
            </button>
          )}
          <button
            type="button"
            onClick={() => commit({ analytics: false, marketing: false })}
            className="min-h-[44px] rounded-xl border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ปฏิเสธที่ไม่จำเป็น
          </button>
          <button
            type="button"
            onClick={() => commit({ analytics: true, marketing: true })}
            className="min-h-[44px] rounded-xl bg-[#DD5259] px-5 text-sm font-semibold text-white hover:bg-[#c9444b]"
          >
            ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}
