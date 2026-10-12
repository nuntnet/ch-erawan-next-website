"use client";

import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// url: null = LINE OA not created yet → rendered greyed-out and non-clickable.
const LINE_ACCOUNTS: { brand: string; lineId: string; url: string | null }[] = [
  { brand: "Mazda",      lineId: "@mazdach.erawan", url: "https://line.me/R/ti/p/@mazdach.erawan" },
  { brand: "Deepal",     lineId: "@deepalch.erawan", url: "https://line.me/R/ti/p/@deepalch.erawan" },
  { brand: "Ford",       lineId: "@fordch.erawan",  url: "https://line.me/R/ti/p/@fordch.erawan" },
  { brand: "Mitsubishi", lineId: "@mitsuch.erawan", url: "https://line.me/R/ti/p/@mitsuch.erawan" },
  { brand: "GWM",        lineId: "@gwmch.erawan",   url: "https://line.me/R/ti/p/@gwmch.erawan" },
  { brand: "Kia",        lineId: "@kiach.erawan",   url: "https://line.me/R/ti/p/@kiach.erawan" },
  { brand: "Geely",      lineId: "เร็วๆ นี้",        url: null },
];

const LINE_SVG = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

export default function LineOAFloat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-64 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#06C755] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                {LINE_SVG}
                <span className="font-semibold text-sm">LINE Official</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Accounts */}
            <div className="p-3 space-y-1.5">
              <p className="text-[11px] text-gray-400 px-1 mb-2">เลือกสาขาที่ต้องการติดต่อ</p>
              {LINE_ACCOUNTS.map((account) =>
                account.url ? (
                <a
                  key={account.lineId}
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-[#06C755]/8 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#06C755] transition-colors">
                      {account.brand}
                    </p>
                    <p className="text-xs text-gray-400">{account.lineId}</p>
                  </div>
                  <span className="text-xs font-medium text-[#06C755] bg-[#06C755]/10 px-2.5 py-1 rounded-full shrink-0">
                    เพิ่มเพื่อน
                  </span>
                </a>
                ) : (
                <div
                  key={account.brand}
                  aria-disabled="true"
                  title="LINE OA กำลังจัดทำ"
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-not-allowed select-none"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-400">{account.brand}</p>
                    <p className="text-xs text-gray-300">{account.lineId}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                    เพิ่มเพื่อน
                  </span>
                </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
              <p className="text-[11px] text-gray-400 text-center">
                ตอบกลับรวดเร็ว จ–ส 08:30–17:30 น.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        className="w-14 h-14 rounded-full bg-[#06C755] hover:bg-[#05a847] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center relative"
        aria-label="ติดต่อผ่าน LINE"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="line" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              {LINE_SVG}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-[#06C755] animate-ping opacity-20" />
        )}
      </motion.button>
    </div>
  );
}
