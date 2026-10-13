import { BRANDS } from "@/lib/brandConfig";
import { branches } from "@/lib/branchData";

/**
 * Tool definitions for WebMCP (navigator.modelContext) — an experimental browser API that lets an
 * AI agent call a site's own functions. Everything here is read-only: no tool submits a form or
 * sends personal data; booking only returns a link the user opens and completes themselves.
 */
export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
}

const text = (data: unknown) => ({ content: [{ type: "text", text: JSON.stringify(data) }] });
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function buildWebMcpTools(origin: string): WebMcpTool[] {
  return [
    {
      name: "list_brands",
      description: "List the car brands sold by ช.เอราวัณ กรุ๊ป (Ch.Erawan Group) with their page URL.",
      inputSchema: { type: "object", properties: {} },
      execute: () =>
        text(
          BRANDS.map((b) => ({
            name: b.displayName,
            nameTh: b.displayNameTh,
            alsoKnownAs: b.alsoKnownAs ?? [],
            tagline: b.tagline ?? null,
            url: `${origin}${b.hubPath}`,
          }))
        ),
    },
    {
      name: "list_branches",
      description: "List dealership branches (address, phone, map link). Optionally filter by brand name, e.g. Geely, Mazda.",
      inputSchema: {
        type: "object",
        properties: { brand: { type: "string", description: "Brand name to filter by (optional)" } },
      },
      execute: (input) => {
        const brand = str(input.brand).toLowerCase();
        return text(
          branches
            .filter((b) => !brand || b.brand.toLowerCase() === brand)
            .map((b) => ({
              name: b.name,
              brand: b.brand,
              address: b.address,
              phone: b.phone,
              mapUrl: b.mapUrl,
              openingDate: b.openingDate ?? null,
            }))
        );
      },
    },
    {
      name: "list_geely_models",
      description: "List GEELY models sold at GEELY ช.เอราวัณ รัชดา with trims and list prices (THB, incl. VAT). Data comes from the site's CMS.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        try {
          const res = await fetch("/api/geely-models");
          if (!res.ok) throw new Error(String(res.status));
          return text(await res.json());
        } catch {
          return text({ error: "Could not load the Geely model list. Open the Geely page instead.", url: `${origin}/geely` });
        }
      },
    },
    {
      name: "get_test_drive_booking_link",
      description:
        "Get a link to the test-drive booking form, pre-filled with brand and car model. Returns a URL only — the user must open it and submit the form themselves.",
      inputSchema: {
        type: "object",
        properties: {
          brand: { type: "string", description: "Brand, e.g. Geely, Mazda, Ford" },
          model: { type: "string", description: "Car model, e.g. EX5 (optional)" },
        },
        required: ["brand"],
      },
      execute: (input) => {
        const brand = str(input.brand);
        const known = BRANDS.find(
          (b) => b.notionBrand.toLowerCase() === brand.toLowerCase() || b.slug === brand.toLowerCase() || b.displayName.toLowerCase() === brand.toLowerCase()
        );
        if (!known) return text({ error: `Unknown brand "${brand}". Call list_brands first.` });
        const params = new URLSearchParams({ type: "test_drive", brand: known.notionBrand });
        const model = str(input.model);
        if (model) params.set("car", model);
        return text({ url: `${origin}/booking?${params.toString()}` });
      },
    },
  ];
}
