import type { MetadataRoute } from "next";
import { getBlogSitemapEntries, getCarSitemapEntries } from "@/lib/notion";
import { SITE_URL } from "@/lib/site";
import { BRANDS } from "@/lib/brandConfig";

// Cache the generated sitemap for 1h so we don't hit Notion on every crawl.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogEntries, carEntries] = await Promise.all([
    getBlogSitemapEntries().catch(() => []),
    getCarSitemapEntries().catch(() => []),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/cars`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/stories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/branches`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/booking`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/career`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/awards`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/insurance`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/secondhand`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const brandPages: MetadataRoute.Sitemap = BRANDS.flatMap((brand) => [
    { url: `${SITE_URL}${brand.hubPath}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    ...(brand.subLines ?? []).map((line) => ({
      url: `${SITE_URL}${brand.hubPath}/${line.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]);

  const blogPages: MetadataRoute.Sitemap = blogEntries.map(({ slug, lastModified }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const carPages: MetadataRoute.Sitemap = carEntries.map(({ slug, lastModified }) => ({
    url: `${SITE_URL}/cars/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...brandPages, ...blogPages, ...carPages];
}
