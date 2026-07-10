import { canonicalUrl, SITE_URL } from "@/lib/site";
import { DEFAULT_PHONE } from "./constants";

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

/** HowTo schema for process pages (booking, insurance claim, etc.) */
export function howToJsonLd(opts: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration e.g. "PT30M"
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    ...(opts.totalTime ? { totalTime: opts.totalTime } : {}),
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

/** ContactPage schema */
export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "ติดต่อ ช.เอราวัณ กรุ๊ป",
    url: canonicalUrl("/contact"),
    description: "ช่องทางติดต่อ ช.เอราวัณ กรุ๊ป 7 สาขาในนครปฐมและปริมณฑล",
    mainEntity: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ช.เอราวัณ กรุ๊ป",
      telephone: DEFAULT_PHONE,
      address: {
        "@type": "PostalAddress",
        addressLocality: "นครปฐม",
        addressCountry: "TH",
      },
    },
  };
}

/** Service schema for insurance / body-repair pages */
export function serviceJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
  areaServed?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: canonicalUrl(opts.path),
    ...(opts.serviceType ? { serviceType: opts.serviceType } : {}),
    provider: { "@type": "Organization", "@id": `${SITE_URL}/#organization` },
    areaServed: {
      "@type": "City",
      name: opts.areaServed ?? "นครปฐม",
    },
  };
}

/** VideoObject schema for YouTube/TikTok review videos */
export function videoObjectJsonLd(opts: {
  name: string;
  description: string;
  thumbnailUrl: string;
  embedUrl: string;
  uploadDate?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: opts.name,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl,
    embedUrl: opts.embedUrl,
    ...(opts.uploadDate ? { uploadDate: opts.uploadDate } : {}),
  };
}
