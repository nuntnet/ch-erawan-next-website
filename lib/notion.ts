import { cache } from "react";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { markdownToBlocks as martianMarkdownToBlocks } from "@tryfabric/martian";
import type {
  Car,
  CarInput,
  BlogPost,
  BlogPostWithContent,
  BlogMetaInput,
  CustomerStory,
  Appointment,
  ContactSubmission,
  Promotion,
  FeedbackFormData,
  InsurancePartner,
  ServicePageSection,
  BrandSocialLink,
  VideoReview,
  FAQItem,
} from "./notion-types";
import { isGwmLineSlug, matchCarToGwmLine } from "./brandConfig";

// ─── Rate-limit aware fetch (429 + transient 5xx retry w/ backoff) ────────────

const MAX_RETRIES = 4;

/** Backoff: honor Retry-After header if present, else exponential + jitter (capped 8s). */
function backoffDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  if (!Number.isNaN(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 15000);
  return Math.min(500 * 2 ** attempt, 8000) + Math.floor(Math.random() * 250);
}

/**
 * Drop-in fetch for the Notion client that retries on 429 (rate limit) and,
 * for idempotent GET reads, on transient 5xx. Non-GET writes are NOT retried on
 * 5xx to avoid duplicate page creation. 429s are always safe to retry (rejected
 * before processing).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notionFetchWithRetry = async (url: any, init?: any): Promise<Response> => {
  const method = (init?.method ?? "GET").toUpperCase();
  for (let attempt = 0; ; attempt++) {
    const res: Response = await fetch(url, init);
    const isRateLimited = res.status === 429;
    const isServerError = res.status >= 500;
    const retryable = isRateLimited || (isServerError && method === "GET");

    if (!retryable || attempt >= MAX_RETRIES) return res;

    const delay = backoffDelayMs(attempt, res.headers.get("retry-after"));
    console.warn(
      `[notion] ${res.status} — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
    );
    await new Promise((r) => setTimeout(r, delay));
  }
};

// ─── Client (server-side only) ───────────────────────────────────────────────

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch: notionFetchWithRetry as any,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

// ─── Database IDs ─────────────────────────────────────────────────────────────

const DB = {
  cars: process.env.NOTION_CARS_DB_ID!,
  blog: process.env.NOTION_BLOG_DB_ID!,
  stories: process.env.NOTION_STORIES_DB_ID!,
  appointments: process.env.NOTION_APPOINTMENTS_DB_ID!,
  contacts: process.env.NOTION_CONTACTS_DB_ID!,
  promotions: process.env.NOTION_PROMOTIONS_DB_ID!,
  searchAnalytics: process.env.NOTION_SEARCH_ANALYTICS_DB_ID!,
  feedback: process.env.NOTION_FEEDBACK_DB_ID!,
  insurancePartners: process.env.NOTION_INSURANCE_PARTNERS_DB_ID!,
  socialLinks: process.env.NOTION_SOCIAL_LINKS_DB_ID!,
  videoReviews: process.env.NOTION_VIDEO_REVIEWS_DB_ID!,
  faq: process.env.NOTION_FAQ_DB_ID!,
  serviceContent: process.env.NOTION_SERVICE_CONTENT_DB_ID!,
};

// ─── Property Helpers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotionPage = any;

function propTitle(page: NotionPage, name: string): string {
  return page.properties[name]?.title?.[0]?.plain_text ?? "";
}

function propText(page: NotionPage, name: string): string {
  return page.properties[name]?.rich_text?.[0]?.plain_text ?? "";
}

function propNumber(page: NotionPage, name: string): number {
  return page.properties[name]?.number ?? 0;
}

function propSelect(page: NotionPage, name: string): string {
  return page.properties[name]?.select?.name ?? "";
}

function propMultiSelect(page: NotionPage, name: string): string[] {
  return page.properties[name]?.multi_select?.map((o: { name: string }) => o.name) ?? [];
}

function propCheckbox(page: NotionPage, name: string): boolean {
  return page.properties[name]?.checkbox ?? false;
}

function propDate(page: NotionPage, name: string): string | null {
  return page.properties[name]?.date?.start ?? null;
}

function propUrl(page: NotionPage, name: string): string | null {
  return page.properties[name]?.url ?? null;
}

function propCreatedTime(page: NotionPage): string {
  return page.created_time ?? "";
}

function propPhone(page: NotionPage, name: string): string {
  return page.properties[name]?.phone_number ?? "";
}

function propEmail(page: NotionPage, name: string): string {
  return page.properties[name]?.email ?? "";
}

/** Parse newline-separated Cloudinary URLs from a text property */
function propImageUrls(page: NotionPage, name: string): string[] {
  const raw = propText(page, name);
  if (!raw) return [];
  return raw
    .split("\n")
    .map((u: string) => u.trim())
    .filter(Boolean);
}

/** Parse JSON string from a text property, return empty object on failure */
function propJson(page: NotionPage, name: string): Record<string, string> {
  try {
    return JSON.parse(propText(page, name));
  } catch {
    return {};
  }
}

// ─── Cars ─────────────────────────────────────────────────────────────────────

function pageToCar(page: NotionPage): Car {
  return {
    id: page.id,
    name: propTitle(page, "Name"),
    brand: propSelect(page, "Brand") as Car["brand"],
    model: propText(page, "Model"),
    year: propNumber(page, "Year"),
    // Lowercase enums — Notion may store "SUV"/"Pickup"/"EV"/"Sedan" mixed-case
    type: (propSelect(page, "Type") || "other").toLowerCase() as Car["type"],
    condition: (propSelect(page, "Condition") || "new").toLowerCase() as Car["condition"],
    priceMin: propNumber(page, "Price Min"),
    priceMax: propNumber(page, "Price Max"),
    engineSize: propText(page, "Engine Size"),
    transmission: (propSelect(page, "Transmission") || "auto").toLowerCase() as Car["transmission"],
    fuelType: (propSelect(page, "Fuel Type") || "petrol").toLowerCase() as Car["fuelType"],
    description: propText(page, "Description"),
    specs: propJson(page, "Specs"),
    imageUrls: propImageUrls(page, "Image URLs"),
    videoUrl: propUrl(page, "Video URL"),
    isActive: propCheckbox(page, "Is Active"),
    isBestSeller: propCheckbox(page, "Is Best Seller"),
    sortOrder: propNumber(page, "Sort Order"),
    navFeatured: propCheckbox(page, "Nav Featured"),
    navNew: propCheckbox(page, "Nav New"),
    slug: propText(page, "Slug"),
  };
}

export async function getActiveCars(filters?: {
  brand?: string;
  condition?: "new" | "used";
  type?: string;
}): Promise<Car[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterConditions: any[] = [
    { property: "Is Active", checkbox: { equals: true } },
  ];

  if (filters?.brand) {
    filterConditions.push({
      property: "Brand",
      select: { equals: filters.brand },
    });
  }
  if (filters?.condition) {
    filterConditions.push({
      property: "Condition",
      select: { equals: filters.condition },
    });
  }
  if (filters?.type) {
    filterConditions.push({
      property: "Type",
      select: { equals: filters.type },
    });
  }

  const response = await notion.databases.query({
    database_id: DB.cars,
    filter: { and: filterConditions },
    sorts: [
      { property: "Sort Order", direction: "ascending" },
      { property: "Year", direction: "descending" },
    ],
  });

  return response.results.map(pageToCar);
}

export async function getCarsByBrandLine(
  brand: Car["brand"],
  line?: string
): Promise<Car[]> {
  const cars = await getActiveCars({ brand });
  if (!line || brand !== "GWM") return cars;
  if (!isGwmLineSlug(line)) return cars;
  return cars.filter((car) => matchCarToGwmLine(car, line));
}

export async function getFeaturedCars(): Promise<Car[]> {
  const response = await notion.databases.query({
    database_id: DB.cars,
    filter: {
      and: [
        { property: "Is Active", checkbox: { equals: true } },
        { property: "Is Best Seller", checkbox: { equals: true } },
      ],
    },
    sorts: [
      { property: "Sort Order", direction: "ascending" },
      { property: "Year", direction: "descending" },
    ],
    page_size: 60, // fetch all best sellers across all brands for client-side filtering
  });
  return response.results.map(pageToCar);
}

export const getCarById = cache(async (id: string): Promise<Car | null> => {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    return pageToCar(page);
  } catch {
    return null;
  }
});

/** True if `value` looks like a Notion page UUID (32 hex chars, with or without dashes). */
function looksLikeNotionId(value: string): boolean {
  return /^[0-9a-f]{32}$/i.test(value.replace(/-/g, ""));
}

/**
 * Fetch a car by its human-readable Slug. Falls back to `getCarById` when no
 * slug match is found AND the passed string looks like a Notion UUID — keeps
 * old `/cars/<uuid>` links working and covers cars with an empty Slug.
 */
export const getCarBySlug = cache(async (slug: string): Promise<Car | null> => {
  const response = await notion.databases.query({
    database_id: DB.cars,
    filter: { property: "Slug", rich_text: { equals: slug } },
    page_size: 1,
  });
  if (response.results.length) return pageToCar(response.results[0]);
  if (looksLikeNotionId(slug)) return getCarById(slug);
  return null;
});

export async function getAllCarIds(): Promise<string[]> {
  const response = await notion.databases.query({
    database_id: DB.cars,
    filter: { property: "Is Active", checkbox: { equals: true } },
  });
  return response.results.map((p) => p.id);
}

/** Slugs of all active cars (empty slugs filtered out). */
export async function getAllCarSlugs(): Promise<string[]> {
  const entries = await getCarSitemapEntries();
  return entries.map((e) => e.slug);
}

export interface SitemapEntry {
  slug: string;
  lastModified: Date;
}

/** Active cars with slug + last edited time for sitemap. */
export async function getCarSitemapEntries(): Promise<SitemapEntry[]> {
  const response = await notion.databases.query({
    database_id: DB.cars,
    filter: { property: "Is Active", checkbox: { equals: true } },
  });
  return response.results
    .map((page) => {
      const car = pageToCar(page);
      const p = page as NotionPage;
      const edited = p.last_edited_time ?? p.created_time;
      return {
        slug: car.slug,
        lastModified: edited ? new Date(edited) : new Date(),
      };
    })
    .filter((e) => Boolean(e.slug));
}

/**
 * Bounded set of slugs to prerender at build time: the most recent active cars
 * by Year (descending). Keeps build time flat as the catalog grows; the rest
 * render on-demand thanks to `dynamicParams = true`.
 */
export async function getCarSlugsForPrerender(limit = 40): Promise<string[]> {
  const response = await notion.databases.query({
    database_id: DB.cars,
    filter: { property: "Is Active", checkbox: { equals: true } },
    sorts: [{ property: "Year", direction: "descending" }],
    page_size: limit,
  });
  return response.results.map(pageToCar).map((c) => c.slug).filter(Boolean);
}

// ─── Cars (admin write) ─────────────────────────────────────────────────────

/** Admin list: every car including inactive/archived. */
export async function getAllCarsAdmin(): Promise<Car[]> {
  const response = await notion.databases.query({
    database_id: DB.cars,
    sorts: [{ property: "Year", direction: "descending" }],
    page_size: 100,
  });
  return response.results.map(pageToCar);
}

/** Map a (partial) Car into Notion property payload. Only included keys are written. */
function carToProperties(data: Partial<CarInput>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (data.name !== undefined) p["Name"] = { title: [{ text: { content: data.name } }] };
  if (data.brand !== undefined) p["Brand"] = { select: { name: data.brand } };
  if (data.model !== undefined) p["Model"] = { rich_text: [{ text: { content: data.model } }] };
  if (data.year !== undefined) p["Year"] = { number: data.year };
  if (data.type !== undefined) p["Type"] = { select: { name: data.type } };
  if (data.condition !== undefined) p["Condition"] = { select: { name: data.condition } };
  if (data.priceMin !== undefined) p["Price Min"] = { number: data.priceMin };
  if (data.priceMax !== undefined) p["Price Max"] = { number: data.priceMax };
  if (data.engineSize !== undefined) p["Engine Size"] = { rich_text: [{ text: { content: data.engineSize } }] };
  if (data.transmission !== undefined) p["Transmission"] = { select: { name: data.transmission } };
  if (data.fuelType !== undefined) p["Fuel Type"] = { select: { name: data.fuelType } };
  if (data.description !== undefined) p["Description"] = { rich_text: [{ text: { content: data.description } }] };
  if (data.specs !== undefined) p["Specs"] = { rich_text: [{ text: { content: JSON.stringify(data.specs) } }] };
  if (data.imageUrls !== undefined) p["Image URLs"] = { rich_text: [{ text: { content: data.imageUrls.join("\n") } }] };
  if (data.videoUrl !== undefined) p["Video URL"] = { url: data.videoUrl || null };
  if (data.isActive !== undefined) p["Is Active"] = { checkbox: data.isActive };
  if (data.isBestSeller !== undefined) p["Is Best Seller"] = { checkbox: data.isBestSeller };
  if (data.navFeatured !== undefined) p["Nav Featured"] = { checkbox: data.navFeatured };
  if (data.navNew !== undefined) p["Nav New"] = { checkbox: data.navNew };
  if (data.slug !== undefined) p["Slug"] = { rich_text: [{ text: { content: data.slug } }] };
  return p;
}

export async function createCar(data: CarInput): Promise<Car> {
  const page = await notion.pages.create({
    parent: { database_id: DB.cars },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: carToProperties(data) as any,
  });
  return pageToCar(page);
}

export async function updateCar(id: string, data: Partial<CarInput>): Promise<Car> {
  const page = await notion.pages.update({
    page_id: id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: carToProperties(data) as any,
  });
  return pageToCar(page);
}

/** Toggle featured / active flags. */
export async function setCarFlags(
  id: string,
  flags: {
    isActive?: boolean;
    isBestSeller?: boolean;
    navFeatured?: boolean;
    navNew?: boolean;
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  if (flags.isActive !== undefined) props["Is Active"] = { checkbox: flags.isActive };
  if (flags.isBestSeller !== undefined) props["Is Best Seller"] = { checkbox: flags.isBestSeller };
  if (flags.navFeatured !== undefined) props["Nav Featured"] = { checkbox: flags.navFeatured };
  if (flags.navNew !== undefined) props["Nav New"] = { checkbox: flags.navNew };
  await notion.pages.update({ page_id: id, properties: props });
}

/** Update sort order of a single car. */
export async function setCarSortOrder(id: string, sortOrder: number): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: { "Sort Order": { number: sortOrder } },
  });
}

/** Bulk update sort orders (used after drag-and-drop reorder). */
export async function bulkSetCarSortOrder(items: { id: string; sortOrder: number }[]): Promise<void> {
  await Promise.all(items.map(({ id, sortOrder }) => setCarSortOrder(id, sortOrder)));
}

/** Soft delete: set Is Active = false. */
export async function archiveCar(id: string): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: { "Is Active": { checkbox: false } },
  });
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

function pageToBlogPost(page: NotionPage): BlogPost {
  return {
    id: page.id,
    title: propTitle(page, "Title"),
    slug: propText(page, "Slug"),
    excerpt: propText(page, "Excerpt"),
    coverImageUrl: propText(page, "Cover Image URL") || null,
    category: propSelect(page, "Category") as BlogPost["category"],
    tags: propMultiSelect(page, "Tags"),
    seoTitle: propText(page, "SEO Title"),
    seoDescription: propText(page, "SEO Description"),
    isPublished: propCheckbox(page, "Is Published"),
    publishedAt: propDate(page, "Published At"),
    authorName: propText(page, "Author Name"),
  };
}

export async function getPublishedBlogPosts(limit?: number): Promise<BlogPost[]> {
  const response = await notion.databases.query({
    database_id: DB.blog,
    filter: { property: "Is Published", checkbox: { equals: true } },
    sorts: [{ property: "Published At", direction: "descending" }],
    page_size: limit ?? 100,
  });
  return response.results.map(pageToBlogPost);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const response = await notion.databases.query({
    database_id: DB.blog,
    filter: {
      and: [
        { property: "Slug", rich_text: { equals: slug } },
        { property: "Is Published", checkbox: { equals: true } },
      ],
    },
    page_size: 1,
  });
  if (!response.results.length) return null;
  return pageToBlogPost(response.results[0]);
}

export const getBlogPostWithContent = cache(
  async (slug: string): Promise<BlogPostWithContent | null> => {
    const post = await getBlogPostBySlug(slug);
    if (!post) return null;

    const mdBlocks = await n2m.pageToMarkdown(post.id);
    const contentMarkdown = n2m.toMarkdownString(mdBlocks).parent;

    return { ...post, contentMarkdown };
  }
);

export async function getAllBlogSlugs(): Promise<string[]> {
  const entries = await getBlogSitemapEntries();
  return entries.map((e) => e.slug);
}

/** Published blog posts with slug + last modified for sitemap. */
export async function getBlogSitemapEntries(): Promise<SitemapEntry[]> {
  const response = await notion.databases.query({
    database_id: DB.blog,
    filter: { property: "Is Published", checkbox: { equals: true } },
  });
  return response.results
    .map((page) => {
      const post = pageToBlogPost(page);
      const p = page as NotionPage;
      const published = post.publishedAt ? new Date(post.publishedAt) : null;
      const edited = p.last_edited_time ? new Date(p.last_edited_time) : null;
      return {
        slug: post.slug,
        lastModified: published ?? edited ?? new Date(),
      };
    })
    .filter((e) => Boolean(e.slug));
}

// ─── Blog (admin write) ─────────────────────────────────────────────────────

/** Convert markdown text into Notion block objects via martian. */
export function markdownToBlocks(markdown: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return martianMarkdownToBlocks(markdown ?? "") as any[];
}

/** Admin list: every blog post including drafts. */
export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const response = await notion.databases.query({
    database_id: DB.blog,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return response.results.map(pageToBlogPost);
}

/** Load a post's meta + content (as markdown) for the editor. */
export async function getBlogPostForEdit(
  id: string
): Promise<BlogPostWithContent | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const meta = pageToBlogPost(page);
    const mdBlocks = await n2m.pageToMarkdown(id);
    const contentMarkdown = n2m.toMarkdownString(mdBlocks).parent ?? "";
    return { ...meta, contentMarkdown };
  } catch (err) {
    console.error("getBlogPostForEdit error:", err);
    return null;
  }
}

function blogMetaToProperties(meta: Partial<BlogMetaInput>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (meta.title !== undefined) p["Title"] = { title: [{ text: { content: meta.title } }] };
  if (meta.slug !== undefined) p["Slug"] = { rich_text: [{ text: { content: meta.slug } }] };
  if (meta.excerpt !== undefined) p["Excerpt"] = { rich_text: [{ text: { content: meta.excerpt } }] };
  if (meta.coverImageUrl !== undefined)
    p["Cover Image URL"] = { rich_text: meta.coverImageUrl ? [{ text: { content: meta.coverImageUrl } }] : [] };
  if (meta.category !== undefined) p["Category"] = { select: { name: meta.category } };
  if (meta.tags !== undefined) p["Tags"] = { multi_select: meta.tags.map((name) => ({ name })) };
  if (meta.seoTitle !== undefined) p["SEO Title"] = { rich_text: [{ text: { content: meta.seoTitle } }] };
  if (meta.seoDescription !== undefined) p["SEO Description"] = { rich_text: [{ text: { content: meta.seoDescription } }] };
  if (meta.authorName !== undefined) p["Author Name"] = { rich_text: [{ text: { content: meta.authorName } }] };
  if (meta.isPublished !== undefined) p["Is Published"] = { checkbox: meta.isPublished };
  if (meta.publishedAt !== undefined)
    p["Published At"] = { date: meta.publishedAt ? { start: meta.publishedAt } : null };
  return p;
}

/** Append markdown content as blocks (chunked to Notion's 100-block limit). */
async function appendMarkdownBlocks(pageId: string, markdown: string) {
  const blocks = markdownToBlocks(markdown);
  for (let i = 0; i < blocks.length; i += 100) {
    await notion.blocks.children.append({
      block_id: pageId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: blocks.slice(i, i + 100) as any,
    });
  }
}

/** Remove all existing child blocks of a page. */
async function clearPageBlocks(pageId: string) {
  const children = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  for (const block of children.results) {
    await notion.blocks.delete({ block_id: block.id });
  }
}

export async function createBlogPost(
  meta: BlogMetaInput,
  markdown: string
): Promise<BlogPost> {
  const blocks = markdownToBlocks(markdown);
  const page = await notion.pages.create({
    parent: { database_id: DB.blog },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: blogMetaToProperties(meta) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: blocks.slice(0, 100) as any,
  });
  // Append any overflow beyond the first 100 blocks
  if (blocks.length > 100) {
    for (let i = 100; i < blocks.length; i += 100) {
      await notion.blocks.children.append({
        block_id: page.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: blocks.slice(i, i + 100) as any,
      });
    }
  }
  return pageToBlogPost(page);
}

export async function updateBlogPost(
  id: string,
  meta: Partial<BlogMetaInput>,
  markdown?: string
): Promise<BlogPost> {
  const page = await notion.pages.update({
    page_id: id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: blogMetaToProperties(meta) as any,
  });
  if (markdown !== undefined) {
    await clearPageBlocks(id);
    await appendMarkdownBlocks(id, markdown);
  }
  return pageToBlogPost(page);
}

/** Toggle publish state, stamping Published At when publishing. */
export async function setBlogPublished(id: string, isPublished: boolean): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {
    "Is Published": { checkbox: isPublished },
  };
  if (isPublished) {
    props["Published At"] = { date: { start: new Date().toISOString() } };
  }
  await notion.pages.update({ page_id: id, properties: props });
}

/** Soft delete: move the Notion page to trash. */
export async function archiveBlogPost(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true });
}

// ─── Contacts ───────────────────────────────────────────────────────────────

function pageToContact(page: NotionPage): ContactSubmission {
  return {
    id: page.id,
    name: propTitle(page, "Name"),
    email: propEmail(page, "Email"),
    phone: propPhone(page, "Phone"),
    message: propText(page, "Message"),
    branch: propText(page, "Branch"),
    submittedAt: propDate(page, "Submitted At") ?? propCreatedTime(page),
  };
}

export async function getAllContacts(): Promise<ContactSubmission[]> {
  const response = await notion.databases.query({
    database_id: DB.contacts,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return response.results.map(pageToContact);
}

// ─── Customer Stories ─────────────────────────────────────────────────────────

function pageToStory(page: NotionPage): CustomerStory {
  return {
    id: page.id,
    customerName: propText(page, "Customer Name") || propTitle(page, "Name"),
    customerEmail: propEmail(page, "Email"),
    customerPhone: propPhone(page, "Phone"),
    story: propText(page, "Story"),
    rating: propNumber(page, "Rating"),
    carModel: propText(page, "Car Model"),
    imageUrl: propUrl(page, "Image URL"),
    status: propSelect(page, "Status") as CustomerStory["status"],
    isPublic: propCheckbox(page, "Is Public"),
    submittedAt: propCreatedTime(page),
  };
}

export async function getPublicStories(limit?: number): Promise<CustomerStory[]> {
  const response = await notion.databases.query({
    database_id: DB.stories,
    filter: {
      and: [
        { property: "Status", select: { equals: "approved" } },
        { property: "Is Public", checkbox: { equals: true } },
      ],
    },
    page_size: limit ?? 20,
  });
  return response.results.map(pageToStory);
}

export async function getAllStories(status?: CustomerStory["status"]): Promise<CustomerStory[]> {
  const response = await notion.databases.query({
    database_id: DB.stories,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    ...(status ? {
      filter: { property: "Status", select: { equals: status } },
    } : {}),
  });
  return response.results.map(pageToStory);
}

// ─── Appointments ─────────────────────────────────────────────────────────────

function pageToAppointment(page: NotionPage): Appointment {
  return {
    id: page.id,
    customerName: propText(page, "Customer Name") || propTitle(page, "Name"),
    type: propSelect(page, "Type") as Appointment["type"],
    status: (propSelect(page, "Status") || "pending") as Appointment["status"],
    customerPhone: propPhone(page, "Phone"),
    customerEmail: propEmail(page, "Email"),
    carModel: propText(page, "Car Model"),
    branch: propText(page, "Branch"),
    preferredDate: propDate(page, "Preferred Date"),
    preferredTime: propText(page, "Preferred Time"),
    notes: propText(page, "Notes"),
    damageDescription: propText(page, "Damage Description"),
    insuranceCompany: propText(page, "Insurance Company"),
    vehicleRegistration: propText(page, "Vehicle Registration"),
    coverageType: propText(page, "Coverage Type"),
    submittedAt: propCreatedTime(page),
  };
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const response = await notion.databases.query({
    database_id: DB.appointments,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });
  return response.results.map(pageToAppointment);
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: {
      Status: { select: { name: status } },
    },
  });
}

export async function updateStoryStatus(
  id: string,
  status: CustomerStory["status"],
  isPublic?: boolean
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {
    Status: { select: { name: status } },
  };
  if (isPublic !== undefined) {
    props["Is Public"] = { checkbox: isPublic };
  }
  await notion.pages.update({ page_id: id, properties: props });
}

// ─── Promotions ───────────────────────────────────────────────────────────────

function pageToPromotion(page: NotionPage): Promotion {
  return {
    id: page.id,
    title: propTitle(page, "Title"),
    brand: propSelect(page, "Brand") as Promotion["brand"],
    coverImageUrl: propText(page, "Cover Image URL") || null,
    linkUrl: propUrl(page, "Link URL"),
    startDate: propDate(page, "Start Date"),
    endDate: propDate(page, "End Date"),
    isActive: propCheckbox(page, "Is Active"),
  };
}

export async function getPromotionsByBrand(brand: Promotion["brand"]): Promise<Promotion[]> {
  if (!DB.promotions) return [];
  const response = await notion.databases.query({
    database_id: DB.promotions,
    filter: {
      and: [
        { property: "Brand", select: { equals: brand } },
        { property: "Is Active", checkbox: { equals: true } },
      ],
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 50,
  });
  return response.results.map(pageToPromotion);
}

/** Admin: all promotions (active + inactive). */
export async function getAllPromotionsAdmin(): Promise<Promotion[]> {
  if (!DB.promotions) return [];
  const response = await notion.databases.query({
    database_id: DB.promotions,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return response.results.map(pageToPromotion);
}

/** Create a new promotion. */
export async function createPromotion(data: Omit<Promotion, "id">): Promise<Promotion> {
  const page = await notion.pages.create({
    parent: { database_id: DB.promotions },
    properties: {
      Title: { title: [{ text: { content: data.title } }] },
      Brand: { select: { name: data.brand } },
      "Cover Image URL": data.coverImageUrl ? { rich_text: [{ text: { content: data.coverImageUrl } }] } : { rich_text: [] },
      "Link URL": data.linkUrl ? { url: data.linkUrl } : { url: null },
      "Start Date": data.startDate ? { date: { start: data.startDate } } : { date: null },
      "End Date": data.endDate ? { date: { start: data.endDate } } : { date: null },
      "Is Active": { checkbox: data.isActive },
    },
  });
  return pageToPromotion(page);
}

/** Update a promotion's fields. */
export async function updatePromotion(id: string, data: Partial<Omit<Promotion, "id">>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  if (data.title !== undefined) props.Title = { title: [{ text: { content: data.title } }] };
  if (data.brand !== undefined) props.Brand = { select: { name: data.brand } };
  if (data.coverImageUrl !== undefined) props["Cover Image URL"] = data.coverImageUrl ? { rich_text: [{ text: { content: data.coverImageUrl } }] } : { rich_text: [] };
  if (data.linkUrl !== undefined) props["Link URL"] = data.linkUrl ? { url: data.linkUrl } : { url: null };
  if (data.startDate !== undefined) props["Start Date"] = data.startDate ? { date: { start: data.startDate } } : { date: null };
  if (data.endDate !== undefined) props["End Date"] = data.endDate ? { date: { start: data.endDate } } : { date: null };
  if (data.isActive !== undefined) props["Is Active"] = { checkbox: data.isActive };
  await notion.pages.update({ page_id: id, properties: props });
}

/** Soft-delete (archive) a promotion. */
export async function archivePromotion(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true });
}

// ─── Blog filtered by brand tag ───────────────────────────────────────────────

/** Published blog posts filtered by brand tag and optional category. */
export async function getBlogPostsByBrand(
  brand: string,
  category?: BlogPost["category"],
  limit = 12
): Promise<BlogPost[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterConditions: any[] = [
    { property: "Is Published", checkbox: { equals: true } },
    { property: "Tags", multi_select: { contains: brand } },
  ];
  if (category) {
    filterConditions.push({ property: "Category", select: { equals: category } });
  }
  const response = await notion.databases.query({
    database_id: DB.blog,
    filter: { and: filterConditions },
    sorts: [{ property: "Published At", direction: "descending" }],
    page_size: limit,
  });
  return response.results.map(pageToBlogPost);
}

// ─── Search Analytics ──────────────────────────────────────────────────────────

/**
 * Log a search query that returned no results.
 * Upserts by query: increments Count if exists, creates if not.
 */
export async function logFailedSearch(query: string, page?: string): Promise<void> {
  if (!DB.searchAnalytics || !query.trim()) return;
  try {
    // Check if this query already exists
    const existing = await notion.databases.query({
      database_id: DB.searchAnalytics,
      filter: { property: "Query", title: { equals: query.trim() } },
      page_size: 1,
    });

    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (existing.results.length > 0) {
      // Increment count + update last searched
      const existingPage = existing.results[0] as NotionPage;
      const currentCount = existingPage.properties["Count"]?.number ?? 0;
      await notion.pages.update({
        page_id: existingPage.id,
        properties: {
          Count: { number: currentCount + 1 },
          "Last Searched At": { date: { start: now } },
        },
      });
    } else {
      // Create new entry
      await notion.pages.create({
        parent: { database_id: DB.searchAnalytics },
        properties: {
          Query: { title: [{ text: { content: query.trim() } }] },
          Count: { number: 1 },
          "Last Searched At": { date: { start: now } },
          ...(page ? { Page: { rich_text: [{ text: { content: page } }] } } : {}),
        },
      });
    }
  } catch (err) {
    // Non-critical — don't throw, just log
    console.warn("[search-analytics] failed to log:", err);
  }
}

// ─── Customer Feedback ────────────────────────────────────────────────────────

export async function createFeedback(data: FeedbackFormData): Promise<void> {
  const now = new Date().toISOString().split("T")[0];
  await notion.pages.create({
    parent: { database_id: DB.feedback },
    properties: {
      Name: { title: [{ text: { content: data.name } }] },
      Type: { select: { name: data.type } },
      Brand: { select: { name: data.brand } },
      Branch: { rich_text: [{ text: { content: data.branch } }] },
      Department: { select: { name: data.department } },
      Phone: { phone_number: data.phone },
      Email: { email: data.email || null },
      LicensePlate: { rich_text: [{ text: { content: data.licensePlate } }] },
      ServiceDate: data.serviceDate ? { date: { start: data.serviceDate } } : { date: null },
      Message: { rich_text: [{ text: { content: data.message } }] },
      Status: { select: { name: "ใหม่" } },
      SubmittedAt: { date: { start: now } },
    },
  });
}

/** Admin: list all feedback, newest first. */
export async function getAllFeedbackAdmin(): Promise<import("./notion-types").CustomerFeedback[]> {
  const response = await notion.databases.query({
    database_id: DB.feedback,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return response.results.map((page) => {
    const p = page as NotionPage;
    return {
      id: p.id,
      name: propTitle(p, "Name"),
      type: propSelect(p, "Type") as import("./notion-types").CustomerFeedback["type"],
      brand: propSelect(p, "Brand"),
      branch: propText(p, "Branch"),
      department: propSelect(p, "Department"),
      phone: propPhone(p, "Phone"),
      email: propEmail(p, "Email"),
      licensePlate: propText(p, "LicensePlate"),
      serviceDate: propDate(p, "ServiceDate"),
      message: propText(p, "Message"),
      status: propSelect(p, "Status") as import("./notion-types").CustomerFeedback["status"],
      submittedAt: propDate(p, "SubmittedAt") ?? propCreatedTime(p),
    };
  });
}

/** Update feedback status. */
export async function updateFeedbackStatus(
  id: string,
  status: import("./notion-types").CustomerFeedback["status"]
): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: { Status: { select: { name: status } } },
  });
}

// ─── Insurance Partners ───────────────────────────────────────────────────────

function pageToInsurancePartner(page: NotionPage): InsurancePartner {
  return {
    id: page.id,
    name: propTitle(page, "Name"),
    brand: propSelect(page, "Brand"),
    isActive: propCheckbox(page, "IsActive"),
    sortOrder: propNumber(page, "SortOrder"),
  };
}

/** All insurance partners sorted by order. */
export async function getInsurancePartners(onlyActive = true): Promise<InsurancePartner[]> {
  if (!DB.insurancePartners) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters: any[] = [];
  if (onlyActive) filters.push({ property: "IsActive", checkbox: { equals: true } });
  const response = await notion.databases.query({
    database_id: DB.insurancePartners,
    filter: filters.length ? { and: filters } : undefined,
    sorts: [{ property: "SortOrder", direction: "ascending" }],
    page_size: 100,
  });
  return response.results.map(pageToInsurancePartner);
}

export async function getAllInsurancePartnersAdmin(): Promise<InsurancePartner[]> {
  return getInsurancePartners(false);
}

export async function createInsurancePartner(name: string, brand: string): Promise<InsurancePartner> {
  // Get max sort order
  const all = await getAllInsurancePartnersAdmin();
  const maxSort = all.reduce((m, p) => Math.max(m, p.sortOrder), 0);
  const page = await notion.pages.create({
    parent: { database_id: DB.insurancePartners },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Brand: { select: { name: brand } },
      IsActive: { checkbox: true },
      SortOrder: { number: maxSort + 1 },
    },
  });
  return pageToInsurancePartner(page);
}

export async function updateInsurancePartner(
  id: string,
  data: Partial<Pick<InsurancePartner, "name" | "brand" | "isActive" | "sortOrder">>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  if (data.name !== undefined) props.Name = { title: [{ text: { content: data.name } }] };
  if (data.brand !== undefined) props.Brand = { select: { name: data.brand } };
  if (data.isActive !== undefined) props.IsActive = { checkbox: data.isActive };
  if (data.sortOrder !== undefined) props.SortOrder = { number: data.sortOrder };
  await notion.pages.update({ page_id: id, properties: props });
}

export async function archiveInsurancePartner(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true });
}

// ─── Service Page Sections ────────────────────────────────────────────────────

function pageToServiceSection(page: NotionPage): ServicePageSection {
  return {
    id: page.id,
    title: propTitle(page, "Title"),
    page: propSelect(page, "Page") as ServicePageSection["page"],
    brand: propSelect(page, "Brand"),
    sectionKey: propText(page, "SectionKey"),
    sortOrder: propNumber(page, "SortOrder"),
    isPublished: propCheckbox(page, "IsPublished"),
    notionUrl: (page as NotionPage).url ?? `https://www.notion.so/${page.id.replace(/-/g, "")}`,
  };
}

export async function getAllServiceSectionsAdmin(): Promise<ServicePageSection[]> {
  if (!DB.serviceContent) return [];
  const response = await notion.databases.query({
    database_id: DB.serviceContent,
    sorts: [
      { property: "Page", direction: "ascending" },
      { property: "SortOrder", direction: "ascending" },
    ],
    page_size: 100,
  });
  return response.results.map(pageToServiceSection);
}

export async function getServiceSections(
  brand: string,
  pageName: ServicePageSection["page"]
): Promise<ServicePageSection[]> {
  if (!DB.serviceContent) return [];
  const response = await notion.databases.query({
    database_id: DB.serviceContent,
    filter: {
      and: [
        { property: "Brand", select: { equals: brand } },
        { property: "Page", select: { equals: pageName } },
        { property: "IsPublished", checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: "SortOrder", direction: "ascending" }],
    page_size: 50,
  });
  return response.results.map(pageToServiceSection);
}

export async function createServiceSection(data: {
  title: string;
  page: ServicePageSection["page"];
  brand: string;
  sectionKey: string;
  sortOrder: number;
}): Promise<ServicePageSection> {
  const page = await notion.pages.create({
    parent: { database_id: DB.serviceContent },
    properties: {
      Title: { title: [{ text: { content: data.title } }] },
      Page: { select: { name: data.page } },
      Brand: { select: { name: data.brand } },
      SectionKey: { rich_text: [{ text: { content: data.sectionKey } }] },
      SortOrder: { number: data.sortOrder },
      IsPublished: { checkbox: false },
    },
  });
  return pageToServiceSection(page);
}

export async function updateServiceSection(
  id: string,
  data: Partial<Pick<ServicePageSection, "title" | "sectionKey" | "sortOrder" | "isPublished">>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  if (data.title !== undefined) props.Title = { title: [{ text: { content: data.title } }] };
  if (data.sectionKey !== undefined) props.SectionKey = { rich_text: [{ text: { content: data.sectionKey } }] };
  if (data.sortOrder !== undefined) props.SortOrder = { number: data.sortOrder };
  if (data.isPublished !== undefined) props.IsPublished = { checkbox: data.isPublished };
  await notion.pages.update({ page_id: id, properties: props });
}

/** Get rendered markdown content of a Notion page (for rendering on website). */
export async function getServiceSectionContent(pageId: string): Promise<string> {
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  return n2m.toMarkdownString(mdBlocks).parent ?? "";
}

// ─── Brand Social Links ───────────────────────────────────────────────────────

function pageToSocialLink(page: NotionPage): BrandSocialLink {
  return {
    id: page.id,
    label: propTitle(page, "Label"),
    brand: propSelect(page, "Brand"),
    platform: propSelect(page, "Platform") as BrandSocialLink["platform"],
    url: propUrl(page, "URL") ?? "",
    isActive: propCheckbox(page, "IsActive"),
  };
}

export async function getSocialLinksByBrand(brand: string): Promise<BrandSocialLink[]> {
  if (!DB.socialLinks) return [];
  const response = await notion.databases.query({
    database_id: DB.socialLinks,
    filter: {
      and: [
        { property: "Brand", select: { equals: brand } },
        { property: "IsActive", checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: "Platform", direction: "ascending" }],
    page_size: 20,
  });
  return response.results.map(pageToSocialLink);
}

export async function getAllSocialLinksAdmin(): Promise<BrandSocialLink[]> {
  if (!DB.socialLinks) return [];
  const response = await notion.databases.query({
    database_id: DB.socialLinks,
    sorts: [
      { property: "Brand", direction: "ascending" },
      { property: "Platform", direction: "ascending" },
    ],
    page_size: 100,
  });
  return response.results.map(pageToSocialLink);
}

export async function createSocialLink(
  data: Omit<BrandSocialLink, "id">
): Promise<BrandSocialLink> {
  const page = await notion.pages.create({
    parent: { database_id: DB.socialLinks },
    properties: {
      Label: { title: [{ text: { content: data.label || `${data.brand} ${data.platform}` } }] },
      Brand: { select: { name: data.brand } },
      Platform: { select: { name: data.platform } },
      URL: { url: data.url },
      IsActive: { checkbox: data.isActive },
    },
  });
  return pageToSocialLink(page);
}

export async function updateSocialLink(
  id: string,
  data: Partial<Omit<BrandSocialLink, "id">>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  if (data.label !== undefined) props.Label = { title: [{ text: { content: data.label } }] };
  if (data.brand !== undefined) props.Brand = { select: { name: data.brand } };
  if (data.platform !== undefined) props.Platform = { select: { name: data.platform } };
  if (data.url !== undefined) props.URL = { url: data.url || null };
  if (data.isActive !== undefined) props.IsActive = { checkbox: data.isActive };
  await notion.pages.update({ page_id: id, properties: props });
}

export async function archiveSocialLink(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true });
}


// ─── Video Reviews ────────────────────────────────────────────────────────────

function pageToVideoReview(page: NotionPage): VideoReview {
  const src = propSelect(page, "Source");
  return {
    id: page.id,
    title: propTitle(page, "Title"),
    brand: propSelect(page, "Brand"),
    platform: propSelect(page, "Platform") as VideoReview["platform"],
    source: (src === "own" ? "own" : "external") as VideoReview["source"],
    videoUrl: propUrl(page, "VideoURL") ?? "",
    thumbnailUrl: propUrl(page, "ThumbnailURL"),
    description: propText(page, "Description"),
    isActive: propCheckbox(page, "IsActive"),
    sortOrder: propNumber(page, "SortOrder"),
  };
}

export async function getVideoReviewsByBrand(brand: string): Promise<VideoReview[]> {
  if (!DB.videoReviews) return [];
  const response = await notion.databases.query({
    database_id: DB.videoReviews,
    filter: {
      and: [
        { property: "Brand", select: { equals: brand } },
        { property: "IsActive", checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: "SortOrder", direction: "ascending" }],
    page_size: 50,
  });
  return response.results.map(pageToVideoReview);
}

export async function getAllVideoReviewsAdmin(): Promise<VideoReview[]> {
  if (!DB.videoReviews) return [];
  const response = await notion.databases.query({
    database_id: DB.videoReviews,
    sorts: [
      { property: "Brand", direction: "ascending" },
      { property: "SortOrder", direction: "ascending" },
    ],
    page_size: 100,
  });
  return response.results.map(pageToVideoReview);
}

export async function createVideoReview(data: Omit<VideoReview, "id">): Promise<VideoReview> {
  const page = await notion.pages.create({
    parent: { database_id: DB.videoReviews },
    properties: {
      Title: { title: [{ text: { content: data.title } }] },
      Brand: { select: { name: data.brand } },
      Platform: { select: { name: data.platform } },
      Source: { select: { name: data.source || "external" } },
      VideoURL: { url: data.videoUrl || null },
      ThumbnailURL: { url: data.thumbnailUrl || null },
      Description: { rich_text: data.description ? [{ text: { content: data.description } }] : [] },
      IsActive: { checkbox: data.isActive },
      SortOrder: { number: data.sortOrder },
    },
  });
  return pageToVideoReview(page);
}

export async function updateVideoReview(id: string, data: Partial<Omit<VideoReview, "id">>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  if (data.title !== undefined) props.Title = { title: [{ text: { content: data.title } }] };
  if (data.brand !== undefined) props.Brand = { select: { name: data.brand } };
  if (data.platform !== undefined) props.Platform = { select: { name: data.platform } };
  if (data.source !== undefined) props.Source = { select: { name: data.source } };
  if (data.videoUrl !== undefined) props.VideoURL = { url: data.videoUrl || null };
  if (data.thumbnailUrl !== undefined) props.ThumbnailURL = { url: data.thumbnailUrl || null };
  if (data.description !== undefined) props.Description = { rich_text: data.description ? [{ text: { content: data.description } }] : [] };
  if (data.isActive !== undefined) props.IsActive = { checkbox: data.isActive };
  if (data.sortOrder !== undefined) props.SortOrder = { number: data.sortOrder };
  await notion.pages.update({ page_id: id, properties: props });
}

export async function archiveVideoReview(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true });
}

// ─── FAQ Items ────────────────────────────────────────────────────────────────

function pageToFAQ(page: NotionPage): FAQItem {
  return {
    id: page.id,
    question: propTitle(page, "Question"),
    answer: propText(page, "Answer"),
    page: propSelect(page, "Page"),
    brand: propSelect(page, "Brand"),
    isActive: propCheckbox(page, "IsActive"),
    sortOrder: propNumber(page, "SortOrder"),
  };
}

export async function getFAQItems(brand: string, page: string): Promise<FAQItem[]> {
  if (!DB.faq) return [];
  const response = await notion.databases.query({
    database_id: DB.faq,
    filter: {
      and: [
        { property: "Brand", select: { equals: brand } },
        { property: "Page", select: { equals: page } },
        { property: "IsActive", checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: "SortOrder", direction: "ascending" }],
    page_size: 50,
  });
  return response.results.map(pageToFAQ);
}

export async function getAllFAQAdmin(): Promise<FAQItem[]> {
  if (!DB.faq) return [];
  const response = await notion.databases.query({
    database_id: DB.faq,
    sorts: [
      { property: "Brand", direction: "ascending" },
      { property: "Page", direction: "ascending" },
      { property: "SortOrder", direction: "ascending" },
    ],
    page_size: 100,
  });
  return response.results.map(pageToFAQ);
}

export async function createFAQItem(data: Omit<FAQItem, "id">): Promise<FAQItem> {
  const page = await notion.pages.create({
    parent: { database_id: DB.faq },
    properties: {
      Question: { title: [{ text: { content: data.question } }] },
      Answer: { rich_text: [{ text: { content: data.answer } }] },
      Page: { select: { name: data.page } },
      Brand: { select: { name: data.brand } },
      IsActive: { checkbox: data.isActive },
      SortOrder: { number: data.sortOrder },
    },
  });
  return pageToFAQ(page);
}

export async function updateFAQItem(id: string, data: Partial<Omit<FAQItem, "id">>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  if (data.question !== undefined) props.Question = { title: [{ text: { content: data.question } }] };
  if (data.answer !== undefined) props.Answer = { rich_text: [{ text: { content: data.answer } }] };
  if (data.page !== undefined) props.Page = { select: { name: data.page } };
  if (data.brand !== undefined) props.Brand = { select: { name: data.brand } };
  if (data.isActive !== undefined) props.IsActive = { checkbox: data.isActive };
  if (data.sortOrder !== undefined) props.SortOrder = { number: data.sortOrder };
  await notion.pages.update({ page_id: id, properties: props });
}

export async function archiveFAQItem(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true });
}
