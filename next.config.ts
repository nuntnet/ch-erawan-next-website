import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer policy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions policy
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // Basic CSP — allows Google Maps, YouTube, Cloudinary, LINE, Notion
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' maps.googleapis.com *.googleapis.com www.youtube.com va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: res.cloudinary.com *.notion.so images.unsplash.com *.s3.amazonaws.com *.cloudfront.net *.amazonaws.com img.youtube.com files.manuscdn.com d2xsxph8kpxj0f.cloudfront.net www.gwm.co.th www.kia.com www.mitsubishi-motors.co.th www.mitsubishi-motors.com www.ford.co.th www.changan.co.th imgcdn.zigwheels.co.th upload.wikimedia.org *.tile.openstreetmap.org",
      "media-src 'self' res.cloudinary.com",
      "connect-src 'self' *.notion.so api.notion.com *.googleapis.com vitals.vercel-insights.com *.vercel-insights.com *.tile.openstreetmap.org",
      "frame-src www.youtube.com www.google.com maps.google.com *.googlemaps.com *.google.com www.tiktok.com *.tiktok.com",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "drizzle-orm"],
  images: {
    loaderFile: "./lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.notion.so" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "prod-files-secure.s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
