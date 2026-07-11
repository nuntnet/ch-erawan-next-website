import { SITE_URL } from "@/lib/site";
import {
  DEALER_BRANDS,
  DEFAULT_PHONE,
  LOGO_URL,
  ORGANIZATION_NAME,
  organizationSameAs,
} from "./constants";

const dealerDescription =
  "ตัวแทนจำหน่ายรถยนต์ชั้นนำในจังหวัดนครปฐม Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas — 9 สาขา";

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
    address: {
      "@type": "PostalAddress",
      addressLocality: "นครปฐม",
      addressRegion: "นครปฐม",
      addressCountry: "TH",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** AutoDealer node for @graph */
export function autoDealerNode() {
  return {
    "@type": "AutoDealer" as const,
    "@id": `${SITE_URL}/#autodealer`,
    name: ORGANIZATION_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description: dealerDescription,
    telephone: DEFAULT_PHONE,
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    address: {
      "@type": "PostalAddress",
      addressLocality: "นครปฐม",
      addressCountry: "TH",
    },
    areaServed: { "@type": "City", name: "นครปฐม" },
    brand: DEALER_BRANDS.map((name) => ({ "@type": "Brand", name })),
  };
}

/** Organization + AutoDealer @graph for site-wide schema */
export function organizationGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), autoDealerNode()],
  };
}
