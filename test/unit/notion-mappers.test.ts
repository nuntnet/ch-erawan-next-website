import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  makeCarPage,
  makeBlogPage,
  title,
  richText,
  select,
  checkbox,
  url,
} from "../helpers/notion-fixtures";

// Mock the Notion SDK so no real network/auth happens. `lib/notion.ts`
// constructs `new Client(...)` at import time; we hand it our controllable mock.
const { notionMock } = vi.hoisted(() => {
  return {
    notionMock: {
      databases: { query: vi.fn() },
      pages: { create: vi.fn(), update: vi.fn(), retrieve: vi.fn() },
      blocks: {
        children: { append: vi.fn(), list: vi.fn() },
        delete: vi.fn(),
      },
    },
  };
});

vi.mock("@notionhq/client", () => ({
  Client: vi.fn(function () {
    return notionMock;
  }),
}));

// notion-to-md is instantiated at import; stub it (markdown content not under test here)
vi.mock("notion-to-md", () => ({
  NotionToMarkdown: vi.fn(function () {
    return {
      pageToMarkdown: vi.fn(async () => []),
      toMarkdownString: vi.fn(() => ({ parent: "" })),
    };
  }),
}));

import * as notion from "@/lib/notion";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pageToCar (via createCar mapping output)", () => {
  it("maps a full Notion car page into a Car object", async () => {
    notionMock.pages.create.mockResolvedValue(makeCarPage());
    const car = await notion.createCar({} as never);

    expect(car).toMatchObject({
      id: "car-1",
      name: "Mazda CX-5 2024",
      brand: "Mazda",
      model: "CX-5",
      year: 2024,
      type: "suv",
      condition: "new",
      priceMin: 1290000,
      priceMax: 1490000,
      engineSize: "2.0L",
      transmission: "auto",
      fuelType: "petrol",
      description: "A great SUV",
      videoUrl: "https://youtube.com/watch?v=abc",
      isActive: true,
      isBestSeller: false, sortOrder: 0,
      navFeatured: false,
      navNew: false,
      slug: "mazda-cx-5-2024",
    });
    expect(car.specs).toEqual({ horsepower: "170hp", seats: "5" });
    expect(car.imageUrls).toEqual(["https://cdn/img1.jpg", "https://cdn/img2.jpg"]);
  });

  it("falls back to safe defaults for missing/empty properties", async () => {
    notionMock.pages.create.mockResolvedValue(
      makeCarPage({
        Specs: richText("not-valid-json{"),
        "Image URLs": richText(""),
        "Video URL": url(null),
      })
    );
    const car = await notion.createCar({} as never);
    expect(car.specs).toEqual({}); // bad JSON -> {}
    expect(car.imageUrls).toEqual([]); // empty text -> []
    expect(car.videoUrl).toBeNull();
  });
});

describe("carToProperties (via createCar payload)", () => {
  it("builds Notion property payload for provided keys only", async () => {
    notionMock.pages.create.mockResolvedValue(makeCarPage());
    await notion.createCar({
      name: "Ford Ranger",
      brand: "Ford",
      model: "Ranger",
      year: 2023,
      type: "pickup",
      condition: "used",
      priceMin: 900000,
      priceMax: 1100000,
      engineSize: "2.0L Turbo",
      transmission: "auto",
      fuelType: "diesel",
      description: "Tough truck",
      specs: { seats: "5" },
      imageUrls: ["https://a.jpg", "https://b.jpg"],
      videoUrl: null,
      isActive: true,
      isBestSeller: true, sortOrder: 0,
      navFeatured: false,
      navNew: false,
      slug: "ford-ranger",
    });

    const props = notionMock.pages.create.mock.calls[0][0].properties;
    expect(props["Name"]).toEqual({ title: [{ text: { content: "Ford Ranger" } }] });
    expect(props["Brand"]).toEqual({ select: { name: "Ford" } });
    expect(props["Model"]).toEqual({ rich_text: [{ text: { content: "Ranger" } }] });
    expect(props["Year"]).toEqual({ number: 2023 });
    expect(props["Price Min"]).toEqual({ number: 900000 });
    // imageUrls joined by newline
    expect(props["Image URLs"]).toEqual({
      rich_text: [{ text: { content: "https://a.jpg\nhttps://b.jpg" } }],
    });
    // specs serialized to JSON
    expect(props["Specs"]).toEqual({
      rich_text: [{ text: { content: JSON.stringify({ seats: "5" }) } }],
    });
    expect(props["Is Best Seller"]).toEqual({ checkbox: true });
    // null videoUrl maps to { url: null }
    expect(props["Video URL"]).toEqual({ url: null });
  });

  it("updateCar only writes provided (partial) keys", async () => {
    notionMock.pages.update.mockResolvedValue(makeCarPage());
    await notion.updateCar("car-1", { priceMin: 1234567 });
    const callArg = notionMock.pages.update.mock.calls[0][0];
    expect(callArg.page_id).toBe("car-1");
    expect(Object.keys(callArg.properties)).toEqual(["Price Min"]);
    expect(callArg.properties["Price Min"]).toEqual({ number: 1234567 });
  });
});

describe("getActiveCars filter building", () => {
  it("always filters Is Active, and adds brand/condition/type when provided", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [makeCarPage()] });
    const cars = await notion.getActiveCars({ brand: "Mazda", condition: "new", type: "suv" });

    expect(cars).toHaveLength(1);
    expect(cars[0].brand).toBe("Mazda");

    const query = notionMock.databases.query.mock.calls[0][0];
    expect(query.filter.and).toEqual([
      { property: "Is Active", checkbox: { equals: true } },
      { property: "Brand", select: { equals: "Mazda" } },
      { property: "Condition", select: { equals: "new" } },
      { property: "Type", select: { equals: "suv" } },
    ]);
    expect(query.sorts).toEqual([{ property: "Sort Order", direction: "ascending" }, { property: "Year", direction: "descending" }]);
  });

  it("only filters Is Active when no filters passed", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [] });
    await notion.getActiveCars();
    const query = notionMock.databases.query.mock.calls[0][0];
    expect(query.filter.and).toEqual([
      { property: "Is Active", checkbox: { equals: true } },
    ]);
  });
});

describe("getCarBySlug", () => {
  it("returns the matching car when slug query hits", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [makeCarPage()] });
    const car = await notion.getCarBySlug("mazda-cx-5-2024");
    expect(car?.slug).toBe("mazda-cx-5-2024");
    const query = notionMock.databases.query.mock.calls[0][0];
    expect(query.filter).toEqual({ property: "Slug", rich_text: { equals: "mazda-cx-5-2024" } });
  });

  it("falls back to getCarById when slug misses but value looks like a Notion UUID", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [] });
    notionMock.pages.retrieve.mockResolvedValue(makeCarPage());
    const uuid = "0123456789abcdef0123456789abcdef";
    const car = await notion.getCarBySlug(uuid);
    expect(notionMock.pages.retrieve).toHaveBeenCalledWith({ page_id: uuid });
    expect(car?.id).toBe("car-1");
  });

  it("returns null when slug misses and value is not a UUID", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [] });
    const car = await notion.getCarBySlug("does-not-exist");
    expect(car).toBeNull();
    expect(notionMock.pages.retrieve).not.toHaveBeenCalled();
  });
});

describe("getAllCarSlugs / getCarSlugsForPrerender", () => {
  it("returns slugs of active cars, dropping empty slugs", async () => {
    notionMock.databases.query.mockResolvedValue({
      results: [makeCarPage(), makeCarPage({ Slug: richText("") })],
    });
    const slugs = await notion.getAllCarSlugs();
    expect(slugs).toEqual(["mazda-cx-5-2024"]);
  });

  it("getCarSlugsForPrerender bounds the page_size and sorts by Year desc", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [makeCarPage()] });
    await notion.getCarSlugsForPrerender(10);
    const query = notionMock.databases.query.mock.calls[0][0];
    expect(query.page_size).toBe(10);
    // getCarSlugsForPrerender uses only Year sort (not Sort Order — different from getActiveCars)
    expect(query.sorts).toEqual([{ property: "Year", direction: "descending" }]);
  });
});

describe("pageToBlogPost (via getBlogPostBySlug) + blogMetaToProperties (via createBlogPost)", () => {
  it("maps a Notion blog page into a BlogPost", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [makeBlogPage()] });
    const post = await notion.getBlogPostBySlug("top-5-suvs");
    expect(post).toMatchObject({
      id: "blog-1",
      title: "Top 5 SUVs",
      slug: "top-5-suvs",
      excerpt: "The best SUVs of the year",
      coverImageUrl: "https://cdn/cover.jpg",
      category: "review",
      seoTitle: "Top 5 SUVs SEO",
      isPublished: true,
      publishedAt: "2024-02-02",
      authorName: "Somchai",
    });
    expect(post?.tags).toEqual(["mazda", "review"]);
  });

  it("createBlogPost builds meta properties and chunks blocks", async () => {
    notionMock.pages.create.mockResolvedValue(makeBlogPage());
    await notion.createBlogPost(
      {
        title: "Hello",
        slug: "hello",
        excerpt: "x",
        coverImageUrl: null,
        category: "news",
        tags: ["a", "b"],
        seoTitle: "",
        seoDescription: "",
        authorName: "Author",
      } as never,
      "# Heading\n\nA paragraph."
    );

    const arg = notionMock.pages.create.mock.calls[0][0];
    expect(arg.properties["Title"]).toEqual({ title: [{ text: { content: "Hello" } }] });
    expect(arg.properties["Tags"]).toEqual({ multi_select: [{ name: "a" }, { name: "b" }] });
    // null cover -> empty rich_text array
    expect(arg.properties["Cover Image URL"]).toEqual({ rich_text: [] });
    expect(arg.properties["Category"]).toEqual({ select: { name: "news" } });
    // children blocks were generated by martian (markdownToBlocks)
    expect(Array.isArray(arg.children)).toBe(true);
    expect(arg.children.length).toBeGreaterThan(0);
  });
});

describe("setBlogPublished", () => {
  it("stamps Published At when publishing", async () => {
    notionMock.pages.update.mockResolvedValue({});
    await notion.setBlogPublished("blog-1", true);
    const arg = notionMock.pages.update.mock.calls[0][0];
    expect(arg.properties["Is Published"]).toEqual({ checkbox: true });
    expect(arg.properties["Published At"].date.start).toBeTypeOf("string");
  });

  it("does not stamp Published At when unpublishing", async () => {
    notionMock.pages.update.mockResolvedValue({});
    await notion.setBlogPublished("blog-1", false);
    const arg = notionMock.pages.update.mock.calls[0][0];
    expect(arg.properties["Is Published"]).toEqual({ checkbox: false });
    expect(arg.properties["Published At"]).toBeUndefined();
  });
});

describe("markdownToBlocks (real martian)", () => {
  it("converts a heading + paragraph into Notion block objects", () => {
    const blocks = notion.markdownToBlocks("# Title\n\nSome text");
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    const types = blocks.map((b: { type: string }) => b.type);
    expect(types).toContain("heading_1");
    expect(types).toContain("paragraph");
  });

  it("returns an empty array for empty/nullish input", () => {
    expect(notion.markdownToBlocks("")).toEqual([]);
    // @ts-expect-error testing nullish guard
    expect(notion.markdownToBlocks(undefined)).toEqual([]);
  });
});

describe("pageToStory / pageToAppointment / pageToContact (via list fns)", () => {
  it("maps contact pages and uses created_time fallback for Submitted At", async () => {
    notionMock.databases.query.mockResolvedValue({
      results: [
        {
          id: "c1",
          created_time: "2024-03-03T00:00:00.000Z",
          properties: {
            Name: title("Jane"),
            Email: { email: "jane@example.com" },
            Phone: { phone_number: "0812345678" },
            Message: richText("Hello there"),
            Branch: richText("นครปฐม"),
            "Submitted At": { date: null },
          },
        },
      ],
    });
    const contacts = await notion.getAllContacts();
    expect(contacts[0]).toMatchObject({
      id: "c1",
      name: "Jane",
      email: "jane@example.com",
      phone: "0812345678",
      message: "Hello there",
      branch: "นครปฐม",
      submittedAt: "2024-03-03T00:00:00.000Z",
    });
  });

  it("maps appointment status defaulting to pending", async () => {
    notionMock.databases.query.mockResolvedValue({
      results: [
        {
          id: "a1",
          created_time: "2024-03-03T00:00:00.000Z",
          properties: {
            "Customer Name": richText("Bob"),
            Type: select("test_drive"),
            Status: select(""), // empty -> default pending
            Phone: { phone_number: "08" },
          },
        },
      ],
    });
    const appts = await notion.getAllAppointments();
    expect(appts[0].customerName).toBe("Bob");
    expect(appts[0].type).toBe("test_drive");
    expect(appts[0].status).toBe("pending");
  });

  it("splits damage photo / insurance doc URLs out of Notes, leaving the customer's own notes intact", async () => {
    notionMock.databases.query.mockResolvedValue({
      results: [
        {
          id: "a2",
          created_time: "2024-03-03T00:00:00.000Z",
          properties: {
            "Customer Name": richText("Somchai"),
            Type: select("body_paint"),
            Status: select("pending"),
            Phone: { phone_number: "08" },
            Notes: richText(
              [
                "รถโดนชนท้าย",
                "รูปความเสียหาย:\nhttps://res.cloudinary.com/demo/image/upload/damage1.jpg\nhttps://res.cloudinary.com/demo/image/upload/damage2.jpg",
                "เอกสารแนบ/ประกัน:\nhttps://res.cloudinary.com/demo/raw/upload/doc1.pdf",
              ].join("\n\n")
            ),
          },
        },
      ],
    });
    const appts = await notion.getAllAppointments();
    expect(appts[0].notes).toBe("รถโดนชนท้าย");
    expect(appts[0].damagePhotoUrls).toEqual([
      "https://res.cloudinary.com/demo/image/upload/damage1.jpg",
      "https://res.cloudinary.com/demo/image/upload/damage2.jpg",
    ]);
    expect(appts[0].insuranceDocUrls).toEqual(["https://res.cloudinary.com/demo/raw/upload/doc1.pdf"]);
  });

  it("returns empty attachment arrays when Notes has no photo/doc markers", async () => {
    notionMock.databases.query.mockResolvedValue({
      results: [
        {
          id: "a3",
          created_time: "2024-03-03T00:00:00.000Z",
          properties: {
            "Customer Name": richText("Nina"),
            Type: select("test_drive"),
            Status: select("pending"),
            Phone: { phone_number: "08" },
            Notes: richText("อยากทดลองขับช่วงเย็น"),
          },
        },
      ],
    });
    const appts = await notion.getAllAppointments();
    expect(appts[0].notes).toBe("อยากทดลองขับช่วงเย็น");
    expect(appts[0].damagePhotoUrls).toEqual([]);
    expect(appts[0].insuranceDocUrls).toEqual([]);
  });

  it("getPublicStories filters approved + public", async () => {
    notionMock.databases.query.mockResolvedValue({ results: [] });
    await notion.getPublicStories();
    const query = notionMock.databases.query.mock.calls[0][0];
    expect(query.filter.and).toEqual([
      { property: "Status", select: { equals: "approved" } },
      { property: "Is Public", checkbox: { equals: true } },
    ]);
  });
});

// touch unused import to satisfy linters in case checkbox helper unused
void checkbox;
