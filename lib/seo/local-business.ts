import { branches } from "@/lib/branchData";
import { BRAND_BY_NOTION } from "@/lib/brandConfig";
import { canonicalUrl, SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME } from "./constants";

/** AutoDealer / LocalBusiness nodes for each branch */
export function localBusinessGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": branches.map((branch) => ({
      "@type": ["AutoDealer", "LocalBusiness"],
      "@id": `${SITE_URL}/#branch-${branch.id}`,
      name: branch.displayName ?? branch.name,
      branchOf: { "@id": `${SITE_URL}/#organization` },
      brand: {
        "@type": "Brand",
        name: BRAND_BY_NOTION[branch.brand as keyof typeof BRAND_BY_NOTION]?.displayName ?? branch.brand,
        ...(BRAND_BY_NOTION[branch.brand as keyof typeof BRAND_BY_NOTION]?.alsoKnownAs
          ? { alternateName: BRAND_BY_NOTION[branch.brand as keyof typeof BRAND_BY_NOTION]!.alsoKnownAs }
          : {}),
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: branch.address,
        addressLocality: branch.locality ?? "นครปฐม",
        addressCountry: "TH",
      },
      telephone: branch.phone,
      ...(branch.schemaHours
        ? {
            openingHoursSpecification: branch.schemaHours.map((h) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: h.days,
              opens: h.opens,
              closes: h.closes,
            })),
          }
        : { openingHours: branch.hours }),
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
