"use client";

import { useState } from "react";
import { branches } from "@/lib/branchData";
import { Phone, MapPin, Clock, ExternalLink, ChevronRight } from "lucide-react";

const BRAND_DOT: Record<string, string> = {
  Mazda:      "bg-red-500",
  Ford:       "bg-blue-600",
  Mitsubishi: "bg-red-600",
  GWM:        "bg-orange-500",
  Deepal:     "bg-blue-500",
  Kia:        "bg-slate-700",
};

const BRAND_HEX: Record<string, string> = {
  Mazda:      "#e60012",
  Ford:       "#003478",
  Mitsubishi: "#c8102e",
  GWM:        "#c8102e",
  Deepal:     "#0066ff",
  Kia:        "#0d1b2a",
};

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** Build a Google Maps Embed API URL using the API key */
function embedUrl(lat: number, lng: number) {
  if (GMAPS_KEY) {
    return `https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${lat},${lng}&zoom=16&language=th`;
  }
  // Fallback without key
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed&hl=th`;
}

/** Custom teardrop SVG marker matching the brand color */
function BranchMarker({ brand, isHQ }: { brand: string; isHQ?: boolean }) {
  const color = BRAND_HEX[brand] ?? "#DD5259";
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="relative flex flex-col items-center" style={{ marginTop: "-28px" }}>
        {/* Glow ring */}
        <div
          className="absolute -inset-3 rounded-full opacity-20 animate-pulse"
          style={{ backgroundColor: color }}
        />
        {/* Pin body */}
        <svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
          {/* Drop shadow */}
          <ellipse cx="19" cy="47" rx="7" ry="3" fill="rgba(0,0,0,0.2)" />
          {/* Pin shape */}
          <path
            d="M19 2C10.163 2 3 9.163 3 18C3 29 19 48 19 48C19 48 35 29 35 18C35 9.163 27.837 2 19 2Z"
            fill={color}
          />
          {/* Inner highlight */}
          <circle cx="19" cy="18" r="8" fill="white" fillOpacity="0.25" />
          {/* Brand initial */}
          <text
            x="19"
            y="23"
            textAnchor="middle"
            fill="white"
            fontWeight="700"
            fontSize="11"
            fontFamily="system-ui, sans-serif"
            letterSpacing="0"
          >
            {brand.slice(0, 2).toUpperCase()}
          </text>
          {/* HQ star */}
          {isHQ && (
            <text x="28" y="8" fill="#FCD34D" fontSize="9" fontWeight="700">★</text>
          )}
        </svg>
      </div>
    </div>
  );
}

export default function BranchesMapEmbed() {
  const [selected, setSelected] = useState(branches[0]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">

      {/* ── Mobile: horizontal pill tabs ── */}
      <div className="lg:hidden border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex overflow-x-auto scrollbar-none px-3 py-2.5 gap-2">
          {branches.map((b) => {
            const isActive = selected.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-[#0F172A] text-white border-[#0F172A]"
                    : "text-[#64748B] border-[#E2E8F0] hover:border-[#0F172A]/30 hover:text-[#0F172A] bg-white"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${BRAND_DOT[b.brand] ?? "bg-gray-400"}`} />
                {b.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: sidebar + map / Mobile: stacked ── */}
      <div className="flex flex-col lg:flex-row">

        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-[220px] shrink-0 border-r border-[#E2E8F0] flex-col bg-white">
          <div className="px-4 py-3 border-b border-[#E2E8F0]">
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-medium">9 สาขา</p>
            <p className="text-sm font-bold text-[#0F172A] mt-0.5">ช.เอราวัณ กรุ๊ป</p>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {branches.map((b) => {
              const isActive = selected.id === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className={`w-full text-left px-3 py-2.5 transition-all flex items-start gap-2.5 ${
                    isActive
                      ? "bg-[#F8FAFC] border-r-2 border-[#0F172A]"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${BRAND_DOT[b.brand] ?? "bg-gray-400"}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? "text-[#0F172A]" : "text-[#475569]"}`}>
                      {b.shortName}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? "text-[#64748B]" : "text-[#94A3B8]"}`}>
                      {b.brand}{b.isHQ && <span className="ml-1 text-amber-500">★</span>}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map + info */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Map with custom marker overlay */}
          <div className="relative w-full h-[280px] lg:h-[380px] bg-[#F8FAFC]">
            <iframe
              key={selected.id}
              src={embedUrl(selected.lat, selected.lng)}
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`แผนที่ ${selected.name}`}
              className="absolute inset-0 border-0 w-full h-full pointer-events-none"
            />
            {/* Custom marker overlay */}
            <BranchMarker brand={selected.brand} isHQ={selected.isHQ} />
          </div>

          {/* Info strip */}
          <div className="border-t border-[#E2E8F0] px-4 py-3 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${BRAND_DOT[selected.brand] ?? "bg-gray-400"}`} />
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">
                    {selected.brand}{selected.isHQ && " · สำนักงานใหญ่"}
                  </span>
                </div>
                <p className="font-bold text-[#0F172A] text-sm leading-snug">{selected.name}</p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <div className="flex items-start gap-1.5 text-[#64748B] text-xs">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 sm:line-clamp-1">{selected.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                    <Phone className="w-3 h-3 shrink-0" />
                    <a href={`tel:${selected.phone}`} className="hover:text-[#0F172A] transition-colors font-medium">
                      {selected.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{selected.hours}</span>
                  </div>
                </div>
              </div>
              <a
                href={selected.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] transition-all whitespace-nowrap"
              >
                <ExternalLink className="w-3 h-3" />
                นำทาง
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
