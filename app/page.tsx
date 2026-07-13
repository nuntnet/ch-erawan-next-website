import type { Metadata } from "next";
import { getActiveCars, getPublishedBlogPosts, getPublicStories, getActivePromotions } from "@/lib/notion";
import { pageMetadata, SITE_NAME } from "@/lib/site";
import { JsonLd, itemListJsonLd } from "@/lib/seo";
import HomeClient from "./HomeClient";
import { getYearsOfExperience } from "@/lib/company";

export const revalidate = 3600;

// Preload ONLY the hero orientation the viewport will actually render. The hero
// has a desktop (landscape) and a mobile (portrait) image; next/image `priority`
// would preload BOTH (no media attr), so mobile also downloads the ~150KB desktop
// hero it never shows — hurting mobile LCP. These media-scoped preloads fetch just
// the right one, early and high-priority, with NO quality loss. The srcset matches
// next/image's output (default deviceSizes + the Cloudinary loader format) so the
// rendered <img> reuses the preloaded response instead of fetching twice.
const HERO_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const heroSrcSet = (variant: "desktop" | "mobile") =>
  HERO_WIDTHS.map(
    (w) =>
      `https://res.cloudinary.com/n5llrdnq/image/upload/w_${w},f_auto,q_auto:good/ch-erawan/hero/mazda-hero-${variant} ${w}w`,
  ).join(", ");

const HOME_DESCRIPTION =
  `ดีลเลอร์รถยนต์ครบวงจร จ.นครปฐม กว่า ${getYearsOfExperience()} ปี — Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas ราคาดีที่สุด 9 สาขา ทดลองขับฟรี จองนัดออนไลน์ได้เลย`;

export const metadata: Metadata = pageMetadata({
  title: `ดีลเลอร์รถยนต์นครปฐม Mazda Ford Mitsubishi GWM Deepal Kia GAC Lepas | ${SITE_NAME}`,
  description: HOME_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const results = await Promise.allSettled([
    // Home car-finder shows ALL active cars by brand (not only best-sellers),
    // so brand tabs aren't empty when a brand has no best-seller flagged.
    getActiveCars(),
    getPublishedBlogPosts(3),
    getPublicStories(3),
    getActivePromotions(6),
  ]);

  const labels = ["getActiveCars", "getPublishedBlogPosts", "getPublicStories", "getActivePromotions"];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[HomePage] ${labels[i]} failed:`, result.reason);
    }
  });

  const featuredCars = results[0].status === "fulfilled" ? results[0].value : [];
  const recentPosts = results[1].status === "fulfilled" ? results[1].value : [];
  const publicStories = results[2].status === "fulfilled" ? results[2].value : [];
  const promotions = results[3].status === "fulfilled" ? results[3].value : [];

  const featuredList =
    featuredCars.length > 0
      ? itemListJsonLd(
          "รถยนต์แนะนำ",
          featuredCars.slice(0, 8).map((car) => ({
            name: `${car.brand} ${car.model} ${car.year}`,
            path: `/cars/${car.slug}`,
          })),
          "/",
        )
      : null;

  return (
    <>
      {/* Media-scoped hero preload (see heroSrcSet note above). Replaces the
          blanket next/image `priority`, which double-preloaded both orientations.
          preconnect to Cloudinary is in app/layout.tsx <head>. */}
      <link
        rel="preload"
        as="image"
        fetchPriority="high"
        media="(min-width: 768px)"
        imageSrcSet={heroSrcSet("desktop")}
        imageSizes="100vw"
      />
      <link
        rel="preload"
        as="image"
        fetchPriority="high"
        media="(max-width: 767px)"
        imageSrcSet={heroSrcSet("mobile")}
        imageSizes="100vw"
      />
      {featuredList && <JsonLd data={featuredList} />}
      <HomeClient
        featuredCars={featuredCars}
        recentPosts={recentPosts}
        publicStories={publicStories}
        promotions={promotions}
      />
    </>
  );
}
