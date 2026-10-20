import type { Metadata } from "next";
import { getActiveCars, getPublishedBlogPosts, getPublicStories, getActivePromotions } from "@/lib/notion";
import { pageMetadata, SITE_NAME } from "@/lib/site";
import { JsonLd, itemListJsonLd } from "@/lib/seo";
import HomeClient from "./HomeClient";
import { getYearsOfExperience } from "@/lib/company";
import { getSiteFaq } from "@/lib/brandFaq";
import { faqPageJsonLd } from "@/lib/seo/faq";
import BrandFaqSection from "@/components/brands/BrandFaqSection";
import Link from "next/link";
import { BRANDS } from "@/lib/brandConfig";
import { branches } from "@/lib/branchData";

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
  `ดีลเลอร์รถยนต์ครบวงจร จ.นครปฐม กว่า ${getYearsOfExperience()} ปี — Mazda, Ford, Mitsubishi, GWM, Deepal, Kia, GAC, Lepas, Geely 10 สาขา ทดลองขับฟรี จองนัดออนไลน์ได้เลย`;

export const metadata: Metadata = pageMetadata({
  title: `ดีลเลอร์รถยนต์นครปฐม 9 แบรนด์ 10 สาขา | ${SITE_NAME}`,
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
      <section className="bg-white pt-4 pb-8" aria-labelledby="home-about">
        <div className="container">
          <h2 id="home-about" className="text-xl font-bold text-[#0F172A]">ช.เอราวัณ กรุ๊ป คือตัวแทนจำหน่ายรถยนต์อย่างเป็นทางการ</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            ช.เอราวัณ กรุ๊ป คือกลุ่มตัวแทนจำหน่ายรถยนต์อย่างเป็นทางการใน จ.นครปฐมและกรุงเทพฯ จำหน่ายรถยนต์ {BRANDS.length} แบรนด์ ผ่าน {branches.length} สาขา พร้อมศูนย์บริการ ซ่อมสีตัวถัง ประกันภัย และรถมือสอง
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">แบรนด์ที่จำหน่าย</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-1">
                {BRANDS.map((b) => (
                  <li key={b.slug}><Link href={b.hubPath} className="hover:underline">{b.displayName}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">สาขา</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-1">
                {branches.map((b) => (
                  <li key={b.id}><Link href="/branches" className="hover:underline">{b.displayName ?? b.name}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <JsonLd data={faqPageJsonLd(getSiteFaq())} />
      <section className="bg-white pb-16">
        <div className="container">
          <BrandFaqSection items={getSiteFaq()} id="home-faq" />
        </div>
      </section>
    </>
  );
}
