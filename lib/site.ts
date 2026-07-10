import type { Metadata } from "next";

// Env values can carry stray whitespace/newlines (e.g. a pasted Vercel env var
// with a trailing \n). Trim and strip any trailing slash so URLs built by plain
// string concat (robots.txt Sitemap:, sitemap <loc>) stay valid.
function cleanBaseUrl(u: string): string {
  return u.trim().replace(/\/+$/, "");
}

export const SITE_URL = cleanBaseUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://ch-erawan.com"
);

export const SITE_NAME = "ช.เอราวัณ กรุ๊ป";

/** Build absolute canonical URL for a site path (no query string). */
export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

/** Shared metadata fields for static/list pages. */
export function pageMetadata({
  title,
  description,
  path,
  openGraphImage,
}: {
  title: string;
  description: string;
  path: string;
  openGraphImage?: string | null;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(path) },
    openGraph: {
      title,
      description,
      url: canonicalUrl(path),
      ...(openGraphImage ? { images: [openGraphImage] } : {}),
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** Schema.org BreadcrumbList for JSON-LD. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
