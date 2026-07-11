import { useEffect, useRef } from "react";
import { branches } from "@/lib/branchData";
import { MapView } from "./Map";
import { brandLogoBase64 } from "@/lib/brandLogos";

export default function BranchesMap() {
  const markersRef = useRef<any[]>([]);
  const mapRef = useRef<any>(null);
  const infoWindowsRef = useRef<any[]>([]);

  const handleMapReady = (map: any) => {
    if (!map) return;

    mapRef.current = map;

    // Clear existing markers and info windows
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    infoWindowsRef.current.forEach((iw: any) => iw.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    // Group branches by location for dual markers (Mazda + Deepal at Salaya)
    const locationGroups: Record<string, typeof branches> = {};
    branches.forEach((branch) => {
      const key = `${branch.lat},${branch.lng}`;
      if (!locationGroups[key]) {
        locationGroups[key] = [];
      }
      locationGroups[key].push(branch);
    });

    // Create SVG marker — red teardrop pin with brand logo
    const createMarkerSVG = (brand: string): string => {
      const logoData = brandLogoBase64[brand] || brandLogoBase64["Mazda"];
      const svg = `<svg width="52" height="68" viewBox="0 0 52 68" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="pin-shadow" x="-40%" y="-20%" width="180%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="logo-circle">
      <circle cx="26" cy="23" r="14"/>
    </clipPath>
  </defs>
  <g filter="url(#pin-shadow)">
    <!-- Dark navy teardrop pin body -->
    <path d="M26 4 C14.95 4 6 12.95 6 24 C6 38 26 60 26 60 C26 60 46 38 46 24 C46 12.95 37.05 4 26 4 Z" fill="#0F172A"/>
    <!-- Subtle stroke -->
    <path d="M26 4 C14.95 4 6 12.95 6 24 C6 38 26 60 26 60 C26 60 46 38 46 24 C46 12.95 37.05 4 26 4 Z" fill="none" stroke="#0a1628" stroke-width="1"/>
    <!-- White circle for logo — slightly smaller padding -->
    <circle cx="26" cy="23" r="14" fill="white"/>
    <!-- Brand logo — smaller and better centered -->
    <image href="${logoData}" x="14" y="11" width="24" height="24" clip-path="url(#logo-circle)" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>`;
      return svg;
    };

    // Add markers for all branches
    Object.entries(locationGroups).forEach(([_, branchesAtLocation]) => {
      const hasMultipleBrands = branchesAtLocation.length > 1;

      branchesAtLocation.forEach((branch, index) => {
        const svgData = createMarkerSVG(branch.brand);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        // Offset position for dual markers at same location
        const offsetLng = hasMultipleBrands ? (index > 0 ? 0.0008 : -0.0008) : 0;
        const markerPosition = {
          lat: branch.lat,
          lng: branch.lng + offsetLng,
        };

        const marker = new window.google.maps.Marker({
          position: markerPosition,
          map: map,
          title: branch.name,
          icon: {
            url: svgUrl,
            scaledSize: new window.google.maps.Size(52, 68),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(26, 60),
          },
          animation: window.google.maps.Animation.DROP,
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 280px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <img src="${brandLogoBase64[branch.brand] || ''}" 
                     style="width: 32px; height: 32px; object-fit: contain; border-radius: 50%; border: 1px solid #e2e8f0; background: white; padding: 2px;" 
                     alt="${branch.brand}" />
                <div style="font-weight: 700; font-size: 14px; color: #0F172A;">${branch.name}</div>
              </div>
              <div style="font-size: 12px; color: #555; margin-bottom: 5px;">
                📍 ${branch.address}
              </div>
              <div style="font-size: 12px; color: #555; margin-bottom: 5px;">
                📞 ${branch.phone}
              </div>
              <div style="font-size: 12px; color: #555; margin-bottom: 10px;">
                🕐 ${branch.hours}
              </div>
              <button style="
                width: 100%;
                padding: 8px 12px;
                background-color: #0F172A;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
              " onclick="window.location.href='/contact?branch=${branch.id}'">
                ดูรายละเอียดและติดต่อ →
              </button>
            </div>
          `,
        });

        // Show info window on marker click
        marker.addListener("click", () => {
          infoWindowsRef.current.forEach((iw: any) => iw.close());
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);
      });
    });

    // Fit map to show all markers with padding
    const bounds = new window.google.maps.LatLngBounds();
    branches.forEach((branch) => {
      bounds.extend({ lat: branch.lat, lng: branch.lng });
    });
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ค้นหาสาขาของเรา
        </h2>
        <p className="text-gray-600">
          คลิกที่ marker เพื่อดูข้อมูลสาขา หรือเลือกสาขาเพื่อติดต่อเรา
        </p>
      </div>

      {/* Map Container */}
      <MapView
        className="w-full h-96 md:h-[500px] rounded-lg shadow-lg border border-gray-200"
        initialCenter={{ lat: 13.78, lng: 100.18 }}
        initialZoom={11}
        onMapReady={handleMapReady}
      />
    </div>
  );
}
