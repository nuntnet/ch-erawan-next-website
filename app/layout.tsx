import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import PublicLayoutServer from "@/components/PublicLayoutServer";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { JsonLd, organizationGraph, websiteJsonLd } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import OutboundClickTracker from "@/components/OutboundClickTracker";
import WebMcpTools from "@/components/WebMcpTools";
import CookieConsent from "@/components/CookieConsent";
import { consentBootstrapScript } from "@/lib/consent";
import Script from "next/script";

// Unset on staging on purpose — a second GA4 property/env var would be
// needed to track staging traffic separately without polluting production
// analytics with test data.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
    default: `${SITE_NAME} | ตัวแทนจำหน่ายรถยนต์ Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas, Geely`,
  },
  description: "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐมและกรุงเทพฯ บริการซื้อ-ขาย ทดลองขับ และบริการหลังการขายครบวงจร Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas, Geely",
  keywords: ["ช.เอราวัณ", "มาสด้า", "ฟอร์ด", "มิตซูบิชิ", "GWM", "Deepal", "Changan Deepal", "Changan", "ฉางอัน", "ดีพอล", "Kia", "GAC", "Lepas", "Geely", "รถยนต์นครปฐม", "ตัวแทนจำหน่าย"],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ตัวแทนจำหน่ายรถยนต์`,
    description: "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐมและกรุงเทพฯ บริการซื้อ-ขาย ทดลองขับ และบริการหลังการขายครบวงจร",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ตัวแทนจำหน่ายรถยนต์`,
    description: "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐมและกรุงเทพฯ",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
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
      <body className={`${inter.variable} ${ibmPlexSansThai.variable} font-sans antialiased overflow-x-hidden`}>
        <JsonLd data={organizationGraph()} />
        <JsonLd data={websiteJsonLd()} />
        <PublicLayoutServer>
          {children}
        </PublicLayoutServer>
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
        <OutboundClickTracker />
        <WebMcpTools />
        {GA_MEASUREMENT_ID && (
          <>
            {/* Consent Mode v2: default denied + replay a stored choice, THEN config. Order matters. */}
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                ${consentBootstrapScript()}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <CookieConsent />
          </>
        )}
      </body>
    </html>
  );
}
