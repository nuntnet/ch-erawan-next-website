import { branches } from "@/lib/branchData";
import { canonicalUrl, SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME } from "./constants";

/** AutoDealer / LocalBusiness nodes for each branch */
export function localBusinessGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": branches.map((branch) => ({
      "@type": ["AutoDealer", "LocalBusiness"],
      "@id": `${SITE_URL}/#branch-${branch.id}`,
      name: branch.name,
      branchOf: { "@id": `${SITE_URL}/#organization` },
      brand: { "@type": "Brand", name: branch.brand },
      address: {
        "@type": "PostalAddress",
        streetAddress: branch.address,
        addressLocality: branch.locality ?? "นครปฐม",
        addressCountry: "TH",
      },
      telephone: branch.phone,
      openingHours: branch.hours,
      geo: {
        "@type": "GeoCoordinates",
        latitude: branch.lat,
        longitude: branch.lng,
      },
      url: canonicalUrl(`/branches#${branch.id}`),
      ...(branch.isHQ ? { parentOrganization: { name: ORGANIZATION_NAME } } : {}),
    })),
  };
}
