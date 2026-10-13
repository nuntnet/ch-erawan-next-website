/**
 * Make sure every Notion database with a "Brand" select has an option for each of the 9 brands.
 * Without the option, filters like Brand = "Geely" fail with validation_error and the brand pages silently fall back.
 *
 * Adds only MISSING options (existing options keep their ids and colors); never removes or renames anything.
 *
 *   bun run scripts/ensure-brand-options.ts --dry-run     # show what would be added
 *   bun run scripts/ensure-brand-options.ts               # apply
 *
 * Targets whichever workspace the NOTION_*_DB_ID vars in .env.local point to (local dev = PRODUCTION).
 * For staging, run it with the staging DB ids exported in the shell (shell values win over .env.local).
 */
import { config } from "dotenv";
import { Client } from "@notionhq/client";

config({ path: ".env.local" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notion: any = new Client({ auth: process.env.NOTION_API_KEY });
const dryRun = process.argv.includes("--dry-run");
const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia", "GAC", "Lepas", "Geely"];

const DBS: Record<string, string | undefined> = {
  cars: process.env.NOTION_CARS_DB_ID,
  promotions: process.env.NOTION_PROMOTIONS_DB_ID,
  socialLinks: process.env.NOTION_SOCIAL_LINKS_DB_ID,
  feedback: process.env.NOTION_FEEDBACK_DB_ID,
  insurancePartners: process.env.NOTION_INSURANCE_PARTNERS_DB_ID,
  serviceContent: process.env.NOTION_SERVICE_CONTENT_DB_ID,
  videoReviews: process.env.NOTION_VIDEO_REVIEWS_DB_ID,
  faq: process.env.NOTION_FAQ_DB_ID,
};

async function main() {
  for (const [key, id] of Object.entries(DBS)) {
    if (!id) {
      console.log(`${key}: env var not set — skipped`);
      continue;
    }
    const db = await notion.databases.retrieve({ database_id: id });
    const brand = db.properties["Brand"];
    if (!brand || brand.type !== "select") {
      console.log(`${key}: no "Brand" select — skipped`);
      continue;
    }
    const existing: { id: string; name: string; color: string }[] = brand.select.options;
    const have = new Set(existing.map((o) => o.name));
    const missing = BRANDS.filter((b) => !have.has(b));
    if (!missing.length) {
      console.log(`${key}: complete`);
      continue;
    }
    if (dryRun) {
      console.log(`${key}: would add ${missing.join(", ")}`);
      continue;
    }
    await notion.databases.update({
      database_id: id,
      properties: {
        Brand: {
          select: {
            options: [...existing.map((o) => ({ id: o.id, name: o.name, color: o.color })), ...missing.map((name) => ({ name }))],
          },
        },
      },
    });
    console.log(`${key}: added ${missing.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
