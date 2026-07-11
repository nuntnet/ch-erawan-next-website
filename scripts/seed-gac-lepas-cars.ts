/**
 * Seed real GAC (AION/HYPTEC/GAC MOTOR) and Lepas car models with real 2025/2026
 * pricing sourced from the GAC/Lepas investor decks (see
 * docs/superpowers/specs/2026-07-11-add-gac-lepas-brands-design.md for the source
 * tables). Lepas models are seeded isActive: false (pre-launch, mid-2026 debut).
 *
 * Run: bun run scripts/seed-gac-lepas-cars.ts
 * Dry run (no Notion writes): bun run scripts/seed-gac-lepas-cars.ts --dry-run
 *
 * Requires .env.local: NOTION_CARS_DB_ID, NOTION_API_KEY
 */

import { config } from "dotenv";
import { createCar } from "../lib/notion";
import type { CarInput } from "../lib/notion-types";

config({ path: ".env.local" });

const dryRun = process.argv.includes("--dry-run");

const SKIP_SLUGS = new Set<string>(
  process.env.SEED_SKIP_SLUGS ? process.env.SEED_SKIP_SLUGS.split(",") : []
);

const CARS: CarInput[] = [
  {
    name: "GAC AION UT",
    brand: "GAC",
    model: "AION UT",
    year: 2025,
    type: "hatchback",
    condition: "new",
    priceMin: 469900,
    priceMax: 599900,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "AION UT รถยนต์ไฟฟ้าแฮทช์แบ็ก รุ่น Standard และ Premium จาก GAC",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 10,
    navFeatured: false,
    navNew: true,
    slug: "gac-aion-ut-2025",
  },
  {
    name: "GAC AION Y Plus",
    brand: "GAC",
    model: "AION Y Plus",
    year: 2025,
    type: "suv",
    condition: "new",
    priceMin: 769900,
    priceMax: 829900,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "AION Y Plus SUV ไฟฟ้า รุ่น 410 และ 490 Premium จาก GAC",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: true,
    sortOrder: 20,
    navFeatured: true,
    navNew: true,
    slug: "gac-aion-y-plus-2025",
  },
  {
    name: "GAC AION V",
    brand: "GAC",
    model: "AION V",
    year: 2025,
    type: "suv",
    condition: "new",
    priceMin: 899000,
    priceMax: 899000,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "AION V SUV ไฟฟ้า รุ่น Luxury จาก GAC",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 30,
    navFeatured: false,
    navNew: true,
    slug: "gac-aion-v-2025",
  },
  {
    name: "GAC AION ES",
    brand: "GAC",
    model: "AION ES",
    year: 2025,
    type: "sedan",
    condition: "new",
    priceMin: 859900,
    priceMax: 859900,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "AION ES ซีดานไฟฟ้าจาก GAC",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 40,
    navFeatured: false,
    navNew: true,
    slug: "gac-aion-es-2025",
  },
  {
    name: "GAC HYPTEC HT",
    brand: "GAC",
    model: "HYPTEC HT",
    year: 2025,
    type: "suv",
    condition: "new",
    priceMin: 1249000,
    priceMax: 1549000,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "HYPTEC HT SUV ไฟฟ้าหรู รุ่น Premium และ Luxury (ประตูปีกนกเหยี่ยว) จาก GAC",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: true,
    sortOrder: 50,
    navFeatured: true,
    navNew: true,
    slug: "gac-hyptec-ht-2025",
  },
  {
    name: "GAC HYPTEC SSR",
    brand: "GAC",
    model: "HYPTEC SSR",
    year: 2025,
    type: "other",
    condition: "new",
    priceMin: 7999000,
    priceMax: 8999000,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "HYPTEC SSR ซูเปอร์คาร์ไฟฟ้า รุ่น Sprint จาก GAC",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 60,
    navFeatured: false,
    navNew: true,
    slug: "gac-hyptec-ssr-2025",
  },
  {
    name: "GAC MOTOR M8 PHEV",
    brand: "GAC",
    model: "GAC M8 PHEV",
    year: 2025,
    type: "mpv",
    condition: "new",
    priceMin: 2499000,
    priceMax: 2499000,
    engineSize: "PHEV",
    transmission: "auto",
    fuelType: "phev",
    description: "GAC M8 PHEV รถ MPV 7 ที่นั่ง ปลั๊กอินไฮบริดจาก GAC MOTOR",
    specs: { seats: "7" },
    imageUrls: [],
    videoUrl: null,
    isActive: true,
    isBestSeller: false,
    sortOrder: 70,
    navFeatured: false,
    navNew: true,
    slug: "gac-motor-m8-phev-2025",
  },
  {
    name: "Lepas L4",
    brand: "Lepas",
    model: "L4",
    year: 2026,
    type: "suv",
    condition: "new",
    priceMin: 0,
    priceMax: 0,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "Lepas L4 รถยนต์ไฟฟ้า A0-SUV เตรียมเปิดตัวในไทยกลางปี 2569 — ราคาจะประกาศเร็วๆ นี้",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: false,
    isBestSeller: false,
    sortOrder: 10,
    navFeatured: false,
    navNew: false,
    slug: "lepas-l4-2026",
  },
  {
    name: "Lepas L6",
    brand: "Lepas",
    model: "L6",
    year: 2026,
    type: "suv",
    condition: "new",
    priceMin: 0,
    priceMax: 0,
    engineSize: "Electric",
    transmission: "auto",
    fuelType: "electric",
    description: "Lepas L6 รถยนต์ไฟฟ้า SUV เตรียมเปิดตัวในไทยกลางปี 2569 — ราคาจะประกาศเร็วๆ นี้",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: false,
    isBestSeller: false,
    sortOrder: 20,
    navFeatured: false,
    navNew: false,
    slug: "lepas-l6-2026",
  },
  {
    name: "Lepas L8",
    brand: "Lepas",
    model: "L8",
    year: 2026,
    type: "suv",
    condition: "new",
    priceMin: 900000,
    priceMax: 1000000,
    engineSize: "PHEV/Electric",
    transmission: "auto",
    fuelType: "phev",
    description: "Lepas L8 SUV ปลั๊กอินไฮบริด/ไฟฟ้า เตรียมเปิดตัวในไทยกลางปี 2569 (ราคาประเมิน)",
    specs: {},
    imageUrls: [],
    videoUrl: null,
    isActive: false,
    isBestSeller: false,
    sortOrder: 30,
    navFeatured: false,
    navNew: false,
    slug: "lepas-l8-2026",
  },
];

async function main() {
  console.log(`Seeding ${CARS.length} GAC/Lepas cars${dryRun ? " (dry run)" : ""}...`);
  for (const car of CARS) {
    if (SKIP_SLUGS.has(car.slug)) {
      console.log(`  ⏭ skipping (already created): ${car.name}`);
      continue;
    }
    if (dryRun) {
      console.log(`  [dry-run] would create: ${car.name} (${car.brand}) — ${car.priceMin}-${car.priceMax}`);
      continue;
    }
    try {
      const created = await createCar(car);
      console.log(`  ✓ created: ${created.name} (${created.id})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ failed: ${car.name} — ${msg.slice(0, 200)}`);
    }
  }
  console.log("Done.");
}

main();
