import { SITE_URL } from "@/lib/site";
import {
  DEALER_BRANDS,
  DEFAULT_PHONE,
  LOGO_URL,
  ORGANIZATION_NAME,
  organizationSameAs,
} from "./constants";

/** HQ = Mazda Nakhon Pathom (branchData isHQ). */
const HQ_ADDRESS = {
  "@type": "PostalAddress" as const,
  streetAddress: "75/2 หมู่ 1 ถนนเพชรเกษม ตำบลธรรมศาลา อำเภอเมืองนครปฐม",
  addressLocality: "นครปฐม",
  addressRegion: "นครปฐม",
  postalCode: "73000",
  addressCountry: "TH",
};

const dealerDescription =
  "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐมและกรุงเทพฯ Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas, Geely — 10 สาขา";

/** Organization node for @graph */
export function organizationNode() {
  const sameAs = organizationSameAs();
  return {
    "@type": "Organization" as const,
    "@id": `${SITE_URL}/#organization`,
    name: ORGANIZATION_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description: dealerDescription,
    telephone: DEFAULT_PHONE,
    address: HQ_ADDRESS,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** AutoDealer node for @graph */
export function autoDealerNode() {
  return {
    "@type": ["AutoDealer", "LocalBusiness"] as string[],
    "@id": `${SITE_URL}/#autodealer`,
    name: ORGANIZATION_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description: dealerDescription,
    telephone: DEFAULT_PHONE,
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    address: HQ_ADDRESS,
    areaServed: { "@type": "City", name: "นครปฐม" },
    brand: DEALER_BRANDS.map((name) => ({ "@type": "Brand", name })),
    // Services only (no prices): the same offerings the site FAQ already states.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "บริการของ ช.เอราวัณ กรุ๊ป",
      itemListElement: [
        "จำหน่ายรถยนต์ใหม่และนัดทดลองขับ",
        "ศูนย์บริการและซ่อมบำรุง",
        "ซ่อมสีและตัวถัง (Body & Paint)",
        "ประกันภัยรถยนต์",
        "รถมือสองและรับเทิร์นรถเก่า",
      ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
    },
  };
}

/** Organization + AutoDealer @graph for site-wide schema */
export function organizationGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), autoDealerNode()],
  };
}
