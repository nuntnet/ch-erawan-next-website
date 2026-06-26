import type { Metadata } from "next";
import { getFeaturedCars, getPublishedBlogPosts, getPublicStories, getActivePromotions } from "@/lib/notion";
import { pageMetadata, SITE_NAME } from "@/lib/site";
import { JsonLd, itemListJsonLd } from "@/lib/seo";
import HomeClient from "./HomeClient";
import { getYearsOfExperience } from "@/lib/company";

export const revalidate = 3600;

const HOME_DESCRIPTION =
  `ดีลเลอร์รถยนต์ครบวงจร จ.นครปฐม กว่า ${getYearsOfExperience()} ปี — Mazda, Ford, Mitsubishi, GWM, Deepal, Kia ราคาดีที่สุด 7 สาขา ทดลองขับฟรี จองนัดออนไลน์ได้เลย`;

export const metadata: Metadata = pageMetadata({
  title: `ดีลเลอร์รถยนต์นครปฐม Mazda Ford Mitsubishi GWM Deepal Kia | ${SITE_NAME}`,
  description: HOME_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const results = await Promise.allSettled([
    getFeaturedCars(),
    getPublishedBlogPosts(3),
    getPublicStories(3),
    getActivePromotions(6),
  ]);

  const labels = ["getFeaturedCars", "getPublishedBlogPosts", "getPublicStories", "getActivePromotions"];
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

  // NOTE: hero LCP image is preloaded automatically by next/image `priority`
  // on the first slide in HomeClient — no manual <link rel="preload"> needed
  // (it would duplicate the auto-generated one). preconnect to Cloudinary is
  // handled in app/layout.tsx <head>.

  return (
    <>
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
