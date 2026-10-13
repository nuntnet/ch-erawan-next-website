/**
 * Seed the three Geely models (EX2, EX5, STARRAY EM-R) into the Notion Cars DB so /geely and
 * /geely/models/[model] are driven by Notion instead of the static fallback in lib/geelyModels.ts.
 *
 * Trims live in the Specs JSON: { "trims": ["PRO|429990", ...], "official_url": "…" }.
 * Image URLs are Cloudinary (ch-erawan/cars/geely-*).
 *
 * Run:      bun run scripts/seed-geely-cars.ts
 * Dry run:  bun run scripts/seed-geely-cars.ts --dry-run     (no Notion writes — do this first)
 *
 * ⚠ Writes to whichever Notion workspace NOTION_CARS_DB_ID in .env.local points to
 *   (local dev uses PRODUCTION data). Point it at the staging DB for staging, or confirm before running.
 * Requires: NOTION_CARS_DB_ID, NOTION_API_KEY. The "Brand" select gets a "Geely" option automatically.
 * Prices are MSRP incl. VAT from the Thonburi "Geely Price structure" file (approved for publishing).
 */
import { config } from "dotenv";
import { createCar, getActiveCars, setCarSortOrder } from "../lib/notion";
import type { CarInput } from "../lib/notion-types";

config({ path: ".env.local" });

const dryRun = process.argv.includes("--dry-run");

const CARS: CarInput[] = [
  {
    name: "GEELY EX2",
    brand: "Geely",
    model: "EX2",
    year: 2026,
    type: "hatchback",
    condition: "new",
    priceMin: 429990,
    priceMax: 459990,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "รถยนต์ไฟฟ้า 5 ที่นั่ง ขนาดกะทัดรัดสำหรับใช้งานในเมือง",
    specs: {
      trims: ["PRO|429990", "MAX|459990"],
      official_url: "https://www.geely.com/en/news/2025/geely-ex2-thailand-debut",
    },
    imageUrls: ["https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1791861801/ch-erawan/cars/geely-ex2.jpg"],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 10,
    navFeatured: false,
    navNew: true,
    slug: "geely-ex2-2026",
  },
  {
    name: "GEELY EX5",
    brand: "Geely",
    model: "EX5",
    year: 2026,
    type: "suv",
    condition: "new",
    priceMin: 799000,
    priceMax: 939000,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "SUV ไฟฟ้า ดีไซน์ใหม่จาก GEELY",
    specs: {
      trims: ["PRO|799000", "MAX|899000", "MAX+|929000", "MAX+ (Moss Green)|939000"],
      official_url: "https://www.geely.com/en/models/ex5",
    },
    imageUrls: ["https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1791861803/ch-erawan/cars/geely-ex5.webp"],
    videoUrl: null,
    isActive: true,
    isBestSeller: true,
    sortOrder: 20,
    navFeatured: true,
    navNew: true,
    slug: "geely-ex5-2026",
  },
  {
    name: "GEELY STARRAY EM-R",
    brand: "Geely",
    model: "STARRAY EM-R",
    year: 2026,
    type: "suv",
    condition: "new",
    priceMin: 729900,
    priceMax: 799900,
    engineSize: "Range Extender",
    transmission: "auto",
    fuelType: "phev",
    description: "SUV พลังงานใหม่แบบ Range Extender (EM-R)",
    specs: { trims: ["PRO|729900", "MAX|799900"] },
    // Rendered from the Starray EM-i model (same body) — replace with an EM-R image when available.
    imageUrls: ["https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1791861805/ch-erawan/cars/geely-starray-em-r.webp"],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 30,
    navFeatured: false,
    navNew: true,
    slug: "geely-starray-em-r-2026",
  },
];

async function main() {
  const existing = new Set((await getActiveCars({ brand: "Geely" })).map((c) => c.slug));
  for (const car of CARS) {
    if (existing.has(car.slug)) {
      console.log(`skip (already in Notion): ${car.slug}`);
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] would create: ${car.slug}  trims=${JSON.stringify(car.specs.trims)}`);
      continue;
    }
    const created = await createCar(car);
    // createCar does not write "Sort Order" (admin drag-and-drop owns it), so set it explicitly.
    await setCarSortOrder(created.id, car.sortOrder);
    console.log(`created: ${created.slug} (${created.id})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
