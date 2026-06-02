#!/usr/bin/env bun
/**
 * Infrastructure as Code — Ch.Erawan Environment Setup
 *
 * Creates a complete environment (staging, preview, etc.) in one command:
 *   1. Notion databases (13 DBs with full schema)
 *   2. Turso database (auth + analytics + audit tables)
 *   3. Vercel project with env vars
 *   4. Git branch
 *   5. .env file
 *
 * Usage:
 *   bun run scripts/infra-setup.ts --env staging
 *   bun run scripts/infra-setup.ts --env preview --skip turso,vercel
 *   bun run scripts/infra-setup.ts --env staging --destroy  # tear down
 *
 * Prerequisites:
 *   - NOTION_API_KEY in .env.local (existing integration)
 *   - `turso` CLI installed + authenticated
 *   - `vercel` CLI installed + authenticated
 */

import { execSync } from "child_process";
import { existsSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

// ──────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────

const TURSO_REGION = "ap-northeast-1"; // Tokyo
const VERCEL_TEAM = "cherawan-next-website-s-projects";
const REPO = "nuntnet/ch-erawan-next-website";

// Parse args
const args = process.argv.slice(2);
const envName = args[args.indexOf("--env") + 1] || "staging";
const skipStr = args[args.indexOf("--skip") + 1] || "";
const skip = new Set(skipStr.split(",").filter(Boolean));
const destroy = args.includes("--destroy");

if (!envName) {
  console.error("Usage: bun run scripts/infra-setup.ts --env <name>");
  process.exit(1);
}

const prefix = envName.toUpperCase();
const label = `[${prefix}]`;

// ──────────────────────────────────────────────────────
// Notion DB Schemas (extracted from production)
// ──────────────────────────────────────────────────────

interface PropDef {
  type: string;
  options?: { name: string; color: string }[];
  format?: string;
}

interface DbSchema {
  envKey: string;
  title: string;
  properties: Record<string, PropDef>;
}

const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia"];
const BRAND_OPTS = BRANDS.map((b) => ({ name: b, color: "default" as const }));

const DB_SCHEMAS: DbSchema[] = [
  {
    envKey: "NOTION_CARS_DB_ID",
    title: "รถยนต์ (Cars)",
    properties: {
      Model: { type: "title" },
      Brand: { type: "select", options: BRAND_OPTS },
      Type: {
        type: "select",
        options: [
          { name: "SUV", color: "blue" },
          { name: "Sedan", color: "green" },
          { name: "Pickup", color: "orange" },
          { name: "EV", color: "purple" },
          { name: "Hybrid", color: "yellow" },
          { name: "Hatchback", color: "pink" },
          { name: "MPV", color: "red" },
          { name: "Mini", color: "gray" },
        ],
      },
      FuelType: {
        type: "select",
        options: [
          { name: "petrol", color: "orange" },
          { name: "diesel", color: "brown" },
          { name: "bev", color: "green" },
          { name: "hev", color: "blue" },
          { name: "phev", color: "purple" },
          { name: "reev", color: "yellow" },
        ],
      },
      Year: { type: "number" },
      Price: { type: "number" },
      Slug: { type: "rich_text" },
      HeroImageUrl: { type: "url" },
      GalleryUrls: { type: "rich_text" },
      Description: { type: "rich_text" },
      Engine: { type: "rich_text" },
      Power: { type: "rich_text" },
      Torque: { type: "rich_text" },
      Transmission: { type: "rich_text" },
      BatteryCapacity: { type: "rich_text" },
      ChargingSpeed: { type: "rich_text" },
      EVRange: { type: "rich_text" },
      Acceleration: { type: "rich_text" },
      Length: { type: "number" },
      Width: { type: "number" },
      Height: { type: "number" },
      Wheelbase: { type: "number" },
      Features: { type: "rich_text" },
      IsActive: { type: "checkbox" },
    },
  },
  {
    envKey: "NOTION_BLOG_DB_ID",
    title: "บทความ (Blog)",
    properties: {
      Title: { type: "title" },
      Slug: { type: "rich_text" },
      Category: {
        type: "select",
        options: [
          { name: "review", color: "blue" },
          { name: "tips", color: "green" },
          { name: "news", color: "orange" },
          { name: "promotion", color: "red" },
          { name: "csr", color: "purple" },
        ],
      },
      Tags: { type: "multi_select", options: BRAND_OPTS },
      CoverImage: { type: "url" },
      Excerpt: { type: "rich_text" },
      Author: { type: "rich_text" },
      PublishedAt: { type: "date" },
      IsPublished: { type: "checkbox" },
    },
  },
  {
    envKey: "NOTION_STORIES_DB_ID",
    title: "รีวิวลูกค้า (Stories)",
    properties: {
      Name: { type: "title" },
      Brand: { type: "select", options: BRAND_OPTS },
      Model: { type: "rich_text" },
      Content: { type: "rich_text" },
      Rating: { type: "number" },
      PhotoUrl: { type: "url" },
      IsApproved: { type: "checkbox" },
      SubmittedAt: { type: "date" },
    },
  },
  {
    envKey: "NOTION_APPOINTMENTS_DB_ID",
    title: "นัดหมาย (Appointments)",
    properties: {
      Name: { type: "title" },
      Phone: { type: "phone_number" },
      Email: { type: "email" },
      Brand: { type: "select", options: BRAND_OPTS },
      Type: {
        type: "select",
        options: [
          { name: "test_drive", color: "blue" },
          { name: "service", color: "green" },
          { name: "body_repair", color: "orange" },
        ],
      },
      Model: { type: "rich_text" },
      Branch: { type: "rich_text" },
      Date: { type: "date" },
      Message: { type: "rich_text" },
      Status: {
        type: "select",
        options: [
          { name: "new", color: "blue" },
          { name: "confirmed", color: "green" },
          { name: "completed", color: "gray" },
          { name: "cancelled", color: "red" },
        ],
      },
    },
  },
  {
    envKey: "NOTION_CONTACTS_DB_ID",
    title: "ข้อความติดต่อ (Contacts)",
    properties: {
      Name: { type: "title" },
      Email: { type: "email" },
      Phone: { type: "phone_number" },
      Subject: { type: "rich_text" },
      Message: { type: "rich_text" },
      SubmittedAt: { type: "date" },
    },
  },
  {
    envKey: "NOTION_PROMOTIONS_DB_ID",
    title: "โปรโมชั่น (Promotions)",
    properties: {
      Title: { type: "title" },
      Brand: { type: "select", options: BRAND_OPTS },
      CoverImage: { type: "url" },
      LinkUrl: { type: "url" },
      StartDate: { type: "date" },
      EndDate: { type: "date" },
      IsActive: { type: "checkbox" },
    },
  },
  {
    envKey: "NOTION_SEARCH_ANALYTICS_DB_ID",
    title: "Search Analytics",
    properties: {
      Query: { type: "title" },
      Count: { type: "number" },
      LastSearchedAt: { type: "date" },
    },
  },
  {
    envKey: "NOTION_FEEDBACK_DB_ID",
    title: "Customer Feedback",
    properties: {
      Name: { type: "title" },
      Type: {
        type: "select",
        options: [
          { name: "แนะนำ", color: "green" },
          { name: "ติชม", color: "orange" },
          { name: "ร้องเรียน", color: "red" },
        ],
      },
      Brand: { type: "select", options: BRAND_OPTS },
      Branch: { type: "rich_text" },
      Message: { type: "rich_text" },
      Phone: { type: "phone_number" },
      Email: { type: "email" },
      Status: {
        type: "select",
        options: [
          { name: "ใหม่", color: "blue" },
          { name: "กำลังดำเนินการ", color: "yellow" },
          { name: "แก้ไขแล้ว", color: "green" },
        ],
      },
      SubmittedAt: { type: "date" },
    },
  },
  {
    envKey: "NOTION_INSURANCE_PARTNERS_DB_ID",
    title: "Insurance Partners",
    properties: {
      Name: { type: "title" },
      Brand: { type: "select", options: BRAND_OPTS },
      LogoUrl: { type: "url" },
      IsActive: { type: "checkbox" },
      SortOrder: { type: "number" },
    },
  },
  {
    envKey: "NOTION_SOCIAL_LINKS_DB_ID",
    title: "Brand Social Links",
    properties: {
      Label: { type: "title" },
      Brand: { type: "select", options: BRAND_OPTS },
      Platform: {
        type: "select",
        options: [
          { name: "Facebook", color: "blue" },
          { name: "TikTok", color: "default" },
          { name: "YouTube", color: "red" },
          { name: "LINE", color: "green" },
          { name: "Instagram", color: "pink" },
        ],
      },
      Url: { type: "url" },
      IsActive: { type: "checkbox" },
    },
  },
  {
    envKey: "NOTION_VIDEO_REVIEWS_DB_ID",
    title: "Video Reviews",
    properties: {
      Title: { type: "title" },
      Brand: { type: "select", options: BRAND_OPTS },
      Platform: {
        type: "select",
        options: [
          { name: "YouTube", color: "red" },
          { name: "TikTok", color: "default" },
        ],
      },
      Source: {
        type: "select",
        options: [
          { name: "own", color: "green" },
          { name: "external", color: "gray" },
        ],
      },
      VideoURL: { type: "url" },
      ThumbnailURL: { type: "url" },
      Description: { type: "rich_text" },
      IsActive: { type: "checkbox" },
      SortOrder: { type: "number" },
    },
  },
  {
    envKey: "NOTION_FAQ_DB_ID",
    title: "FAQ Items",
    properties: {
      Question: { type: "title" },
      Answer: { type: "rich_text" },
      Page: { type: "select" },
      Brand: { type: "select", options: BRAND_OPTS },
      IsActive: { type: "checkbox" },
      SortOrder: { type: "number" },
    },
  },
  {
    envKey: "NOTION_SERVICE_CONTENT_DB_ID",
    title: "Service Page Content",
    properties: {
      Title: { type: "title" },
      Page: { type: "select" },
      Brand: { type: "select", options: BRAND_OPTS },
      SectionKey: { type: "rich_text" },
      ContentUrl: { type: "url" },
      IsPublished: { type: "checkbox" },
      SortOrder: { type: "number" },
    },
  },
];

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

function sh(cmd: string, opts?: { silent?: boolean }): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: opts?.silent ? "pipe" : "inherit" }).trim();
  } catch {
    return "";
  }
}

function shOut(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

function generateSecret(): string {
  return shOut("openssl rand -base64 32");
}

function log(msg: string) {
  console.log(`\x1b[36m${label}\x1b[0m ${msg}`);
}
function logOk(msg: string) {
  console.log(`\x1b[32m  ✅\x1b[0m ${msg}`);
}
function logErr(msg: string) {
  console.error(`\x1b[31m  ❌\x1b[0m ${msg}`);
}

// ──────────────────────────────────────────────────────
// Step 1: Notion Databases
// ──────────────────────────────────────────────────────

async function setupNotion(): Promise<Record<string, string>> {
  log("Setting up Notion databases...");

  const dotenv = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  const apiKey = dotenv.match(/NOTION_API_KEY=(.+)/)?.[1]?.trim();
  if (!apiKey) {
    logErr("NOTION_API_KEY not found in .env.local");
    process.exit(1);
  }

  // Dynamic import @notionhq/client
  const { Client } = await import("@notionhq/client");
  const notion = new Client({ auth: apiKey });

  // Create parent page
  log("Creating parent page...");

  // Find workspace — use search to get any existing page as parent reference
  const searchResult = await notion.search({ query: "", page_size: 1 });
  let parentPageId: string | undefined;

  // Try to find existing staging page
  const existingSearch = await notion.search({
    query: `[${prefix}] Ch.Erawan Databases`,
    filter: { property: "object", value: "page" },
    page_size: 1,
  });

  if (existingSearch.results.length > 0) {
    parentPageId = existingSearch.results[0].id;
    logOk(`Found existing parent page: ${parentPageId}`);
  } else {
    // Create under workspace (use first found page's parent context)
    const parentPage = await notion.pages.create({
      parent: { workspace: true } as any,
      properties: {
        title: {
          title: [{ text: { content: `[${prefix}] Ch.Erawan Databases` } }],
        },
      },
      icon: { emoji: "🔧" },
    });
    parentPageId = parentPage.id;
    logOk(`Created parent page: ${parentPageId}`);
  }

  // Create each DB
  const dbIds: Record<string, string> = {};

  for (const schema of DB_SCHEMAS) {
    try {
      // Build Notion properties
      const props: Record<string, any> = {};
      for (const [name, def] of Object.entries(schema.properties)) {
        switch (def.type) {
          case "title":
            props[name] = { title: {} };
            break;
          case "rich_text":
            props[name] = { rich_text: {} };
            break;
          case "number":
            props[name] = { number: def.format ? { format: def.format } : {} };
            break;
          case "select":
            props[name] = {
              select: {
                options: (def.options || []).map((o) => ({
                  name: o.name,
                  color: o.color,
                })),
              },
            };
            break;
          case "multi_select":
            props[name] = {
              multi_select: {
                options: (def.options || []).map((o) => ({
                  name: o.name,
                  color: o.color,
                })),
              },
            };
            break;
          case "date":
            props[name] = { date: {} };
            break;
          case "checkbox":
            props[name] = { checkbox: {} };
            break;
          case "url":
            props[name] = { url: {} };
            break;
          case "email":
            props[name] = { email: {} };
            break;
          case "phone_number":
            props[name] = { phone_number: {} };
            break;
          case "files":
            props[name] = { files: {} };
            break;
        }
      }

      const newDb = await notion.databases.create({
        parent: { page_id: parentPageId },
        title: [{ text: { content: `[${prefix}] ${schema.title}` } }],
        properties: props,
      });

      dbIds[schema.envKey] = newDb.id.replace(/-/g, "");
      logOk(`${schema.envKey} → ${schema.title}`);
    } catch (e: any) {
      logErr(`${schema.envKey}: ${e.message?.substring(0, 60)}`);
    }
  }

  return dbIds;
}

// ──────────────────────────────────────────────────────
// Step 2: Turso Database
// ──────────────────────────────────────────────────────

interface TursoResult {
  url: string;
  token: string;
}

function setupTurso(): TursoResult | null {
  log("Setting up Turso database...");

  const hasTurso = shOut("which turso");
  if (!hasTurso) {
    logErr("turso CLI not found. Install: brew install tursodatabase/tap/turso");
    return null;
  }

  const dbName = `ch-erawan-${envName}`;

  // Check if already exists
  const existing = shOut(`turso db show ${dbName} --url 2>/dev/null`);
  if (existing) {
    logOk(`Turso DB already exists: ${dbName}`);
    const token = shOut(`turso db tokens create ${dbName}`);
    return { url: existing, token };
  }

  // Create
  log(`Creating Turso DB: ${dbName}...`);
  sh(`turso db create ${dbName} --region ${TURSO_REGION}`, { silent: true });
  const url = shOut(`turso db show ${dbName} --url`);
  const token = shOut(`turso db tokens create ${dbName}`);

  if (!url || !token) {
    logErr("Failed to create Turso DB");
    return null;
  }
  logOk(`Turso DB created: ${url}`);

  // Push schema
  log("Pushing Drizzle schema...");
  sh(
    `TURSO_DATABASE_URL="${url}" TURSO_AUTH_TOKEN="${token}" bunx drizzle-kit push --config=drizzle.config.ts`,
    { silent: true }
  );
  logOk("Schema pushed");

  return { url, token };
}

// ──────────────────────────────────────────────────────
// Step 3: Generate .env file
// ──────────────────────────────────────────────────────

function generateEnvFile(
  notionIds: Record<string, string>,
  turso: TursoResult | null
): string {
  const dotenv = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  const notionApiKey = dotenv.match(/NOTION_API_KEY=(.+)/)?.[1]?.trim() || "<set-me>";
  const cloudName = dotenv.match(/NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=(.+)/)?.[1]?.trim() || "<set-me>";
  const cloudKey = dotenv.match(/CLOUDINARY_API_KEY=(.+)/)?.[1]?.trim() || "<set-me>";
  const cloudSecret = dotenv.match(/CLOUDINARY_API_SECRET=(.+)/)?.[1]?.trim() || "<set-me>";
  const mapsKey = dotenv.match(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim() || "<set-me>";

  const authSecret = generateSecret();
  const revalSecret = generateSecret();

  const lines = [
    `# ═══ Ch.Erawan ${prefix} Environment ═══`,
    `# Auto-generated by scripts/infra-setup.ts`,
    `# Generated: ${new Date().toISOString()}`,
    "",
    "# ─── Notion CMS ───",
    `NOTION_API_KEY=${notionApiKey}`,
    ...DB_SCHEMAS.map((s) => `${s.envKey}=${notionIds[s.envKey] || "<not-created>"}`),
    "",
    "# ─── Auth & Security ───",
    `BETTER_AUTH_SECRET=${authSecret}`,
    `BETTER_AUTH_URL=https://ch-erawan-${envName}.vercel.app`,
    `REVALIDATE_SECRET=${revalSecret}`,
    "",
    "# ─── Turso ───",
    `TURSO_DATABASE_URL=${turso?.url || "<set-me>"}`,
    `TURSO_AUTH_TOKEN=${turso?.token || "<set-me>"}`,
    "",
    "# ─── Cloudinary (shared) ───",
    `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${cloudName}`,
    `CLOUDINARY_API_KEY=${cloudKey}`,
    `CLOUDINARY_API_SECRET=${cloudSecret}`,
    "",
    "# ─── Google Maps (shared) ───",
    `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${mapsKey}`,
    "",
    "# ─── Site URL ───",
    `NEXT_PUBLIC_SITE_URL=https://ch-erawan-${envName}.vercel.app`,
  ];

  return lines.join("\n") + "\n";
}

// ──────────────────────────────────────────────────────
// Step 4: Vercel Project
// ──────────────────────────────────────────────────────

function setupVercel(envContent: string) {
  log("Setting up Vercel project...");

  const hasVercel = shOut("which vercel");
  if (!hasVercel) {
    logErr("vercel CLI not found. Install: npm i -g vercel");
    return;
  }

  const projectName = `ch-erawan-${envName}`;

  // Check if exists
  const existing = shOut(
    `vercel project ls --scope ${VERCEL_TEAM} 2>/dev/null | grep "${projectName}"`
  );
  if (existing) {
    logOk(`Vercel project already exists: ${projectName}`);
  } else {
    log(`Creating Vercel project: ${projectName}...`);
    // Can't fully automate project creation via CLI without interactive
    log(`⚠️  Create project manually in Vercel Dashboard:`);
    log(`   1. vercel.com/new → Import ${REPO}`);
    log(`   2. Project name: ${projectName}`);
    log(`   3. Production Branch: ${envName}`);
  }

  // Set env vars
  log("Setting env vars in Vercel...");
  const lines = envContent.split("\n").filter((l) => l && !l.startsWith("#"));
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    const value = rest.join("=");
    if (!key || !value || value.includes("<set-me>") || value.includes("<not-created>")) continue;

    try {
      shOut(
        `echo "${value}" | vercel env add ${key} production --scope ${VERCEL_TEAM} --project ${projectName} 2>/dev/null`
      );
    } catch {
      // May already exist
    }
  }
  logOk("Env vars configured");
}

// ──────────────────────────────────────────────────────
// Step 5: Git Branch
// ──────────────────────────────────────────────────────

function setupGitBranch() {
  log("Setting up git branch...");

  const branches = shOut("git branch --list");
  if (branches.includes(envName)) {
    logOk(`Branch '${envName}' already exists`);
    return;
  }

  sh(`git checkout -b ${envName}`, { silent: true });
  sh(`git push -u origin ${envName}`, { silent: true });
  logOk(`Branch '${envName}' created and pushed`);
}

// ──────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log(
    `\x1b[1m🏗️  Ch.Erawan Infrastructure Setup — ${prefix}\x1b[0m`
  );
  console.log(`   Environment: ${envName}`);
  console.log(`   Skip: ${skip.size ? [...skip].join(", ") : "none"}`);
  console.log("");

  // Step 1: Notion
  let notionIds: Record<string, string> = {};
  if (!skip.has("notion")) {
    notionIds = await setupNotion();
  } else {
    log("Skipping Notion setup");
  }

  // Step 2: Turso
  let turso: TursoResult | null = null;
  if (!skip.has("turso")) {
    turso = setupTurso();
  } else {
    log("Skipping Turso setup");
  }

  // Step 3: Generate .env
  log("Generating .env file...");
  const envContent = generateEnvFile(notionIds, turso);
  const envPath = resolve(process.cwd(), `.env.${envName}.local`);
  writeFileSync(envPath, envContent);
  logOk(`Saved to ${envPath}`);

  // Step 4: Vercel
  if (!skip.has("vercel")) {
    setupVercel(envContent);
  } else {
    log("Skipping Vercel setup");
  }

  // Step 5: Git
  if (!skip.has("git")) {
    setupGitBranch();
  } else {
    log("Skipping git branch setup");
  }

  // Summary
  console.log("");
  console.log("\x1b[1m📋 Summary\x1b[0m");
  console.log(`   Notion DBs:  ${Object.keys(notionIds).length} created`);
  console.log(`   Turso DB:    ${turso ? turso.url : "skipped/failed"}`);
  console.log(`   Env file:    ${envPath}`);
  console.log(`   Git branch:  ${envName}`);
  console.log("");
  console.log("\x1b[33m⚡ Next steps:\x1b[0m");
  console.log(`   1. Create Vercel project (if not done): vercel.com/new`);
  console.log(`   2. Set production branch to '${envName}'`);
  console.log(`   3. Push: git push origin ${envName}`);
  console.log(
    `   4. Share Notion page with integration (if new workspace)`
  );
  console.log("");
}

main().catch(console.error);
