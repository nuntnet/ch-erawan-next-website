import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import PublicLayoutServer from "@/components/PublicLayoutServer";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { JsonLd, organizationGraph, websiteJsonLd } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} | ตัวแทนจำหน่ายรถยนต์ Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas`,
  },
  description: "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐม บริการซื้อ-ขาย ทดลองขับ และบริการหลังการขายครบวงจร Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas",
  keywords: ["ช.เอราวัณ", "มาสด้า", "ฟอร์ด", "มิตซูบิชิ", "GWM", "Deepal", "Kia", "GAC", "Lepas", "รถยนต์นครปฐม", "ตัวแทนจำหน่าย"],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ตัวแทนจำหน่ายรถยนต์`,
    description: "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐม บริการซื้อ-ขาย ทดลองขับ และบริการหลังการขายครบวงจร",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ตัวแทนจำหน่ายรถยนต์`,
    description: "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐม",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        {/* Warm up the Cloudinary CDN connection early — hero image is served from here */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className={`${inter.variable} ${ibmPlexSansThai.variable} font-sans antialiased`}>
        <JsonLd data={organizationGraph()} />
        <JsonLd data={websiteJsonLd()} />
        <PublicLayoutServer>
          {children}
        </PublicLayoutServer>
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
