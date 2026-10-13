import type { Metadata } from "next";

// Env values can carry stray whitespace/newlines (e.g. a pasted Vercel env var
// with a trailing \n). Trim and strip any trailing slash so URLs built by plain
// string concat (robots.txt Sitemap:, sitemap <loc>, Better Auth's baseURL) stay valid.
export function cleanBaseUrl(u: string): string {
  return u.trim().replace(/\/+$/, "");
}

export const SITE_URL = cleanBaseUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://www.ch-erawan.com"
);

export const SITE_NAME = "ช.เอราวัณ กรุ๊ป";

/** Build absolute canonical URL for a site path (no query string). */
export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

/** Max <title> length we aim for (search results truncate around here). */
export const TITLE_MAX = 65;
/** The root layout appends " | {SITE_NAME}" to every title. */
const TITLE_SUFFIX_LENGTH = " | ".length + SITE_NAME.length;

/**
 * Keep <title> within TITLE_MAX: when the page title plus the site suffix would be too long,
 * drop the suffix (the full page title is kept) instead of letting the result get cut mid-word.
 */
export function fitTitle(title: string): Metadata["title"] {
  return title.length + TITLE_SUFFIX_LENGTH > TITLE_MAX ? { absolute: title } : title;
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
    title: fitTitle(title),
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
