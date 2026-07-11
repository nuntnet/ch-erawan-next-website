/**
 * Upload real official product photos for the 10 seeded GAC/Lepas cars to
 * Cloudinary, then update each car's imageUrls in Notion.
 *
 * Run: bun run scripts/update-gac-lepas-images.ts
 */

import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { readFileSync } from "fs";
import { getCarBySlug, updateCar } from "../lib/notion";

config({ path: ".env.local" });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES: Array<{ slug: string; file: string; publicId: string }> = [
  { slug: "gac-aion-ut-2025", file: "/tmp/car-imgs/aion-ut.png", publicId: "gac-aion-ut" },
  { slug: "gac-aion-y-plus-2025", file: "/tmp/car-imgs/aion-yplus.png", publicId: "gac-aion-y-plus" },
  { slug: "gac-aion-v-2025", file: "/tmp/car-imgs/aion-v.png", publicId: "gac-aion-v" },
  { slug: "gac-aion-es-2025", file: "/tmp/car-imgs/aion-es.png", publicId: "gac-aion-es" },
  { slug: "gac-hyptec-ht-2025", file: "/tmp/car-imgs/hyptec-ht.png", publicId: "gac-hyptec-ht" },
  { slug: "gac-hyptec-ssr-2025", file: "/tmp/car-imgs/hyptec-ssr.png", publicId: "gac-hyptec-ssr" },
  { slug: "gac-motor-m8-phev-2025", file: "/tmp/car-imgs/gac-m8.png", publicId: "gac-motor-m8-phev" },
  { slug: "lepas-l4-2026", file: "/tmp/car-imgs/lepas-l4.jpg", publicId: "lepas-l4" },
  { slug: "lepas-l6-2026", file: "/tmp/car-imgs/lepas-l6.jpg", publicId: "lepas-l6" },
  { slug: "lepas-l8-2026", file: "/tmp/car-imgs/lepas-l8.jpg", publicId: "lepas-l8" },
];

async function main() {
  for (const { slug, file, publicId } of IMAGES) {
    const car = await getCarBySlug(slug);
    if (!car) {
      console.error(`  ✗ no car found for slug ${slug}`);
      continue;
    }
    const buf = readFileSync(file);
    const ext = file.endsWith(".jpg") ? "image/jpeg" : "image/png";
    const dataUri = `data:${ext};base64,${buf.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "ch-erawan/cars",
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });
    await updateCar(car.id, { imageUrls: [result.secure_url] });
    console.log(`  ✓ ${slug}: ${result.secure_url}`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
