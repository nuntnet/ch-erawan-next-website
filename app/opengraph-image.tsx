import { ImageResponse } from "next/og";

export const alt = "ช.เอราวัณ กรุ๊ป — ตัวแทนจำหน่ายรถยนต์";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
          padding: 48,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: -1,
            marginBottom: 16,
          }}
        >
          ช.เอราวัณ กรุ๊ป
        </div>
        <div style={{ fontSize: 32, opacity: 0.85, textAlign: "center", maxWidth: 900 }}>
          ตัวแทนจำหน่ายรถยนต์ Mazda · Ford · Mitsubishi · GWM · Deepal · Kia
        </div>
        <div style={{ fontSize: 22, opacity: 0.6, marginTop: 24 }}>
          จ.นครปฐม · 7 สาขา
        </div>
      </div>
    ),
    { ...size }
  );
}
