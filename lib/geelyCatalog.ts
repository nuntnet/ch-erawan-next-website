import { getCarsByBrandLine } from "@/lib/notion";
import { GEELY_MODELS, carToGeelyModel, type GeelyModel } from "@/lib/geelyModels";

/**
 * Geely models for the site: Notion Cars DB (brand = Geely, active) first;
 * falls back to the static list in lib/geelyModels.ts only when Notion has none (or errors).
 */
export async function getGeelyCatalog(): Promise<GeelyModel[]> {
  try {
    const cars = await getCarsByBrandLine("Geely");
    if (cars.length > 0) return cars.map(carToGeelyModel);
  } catch (err) {
    console.error("[geely] Notion catalog failed, using static fallback", err);
  }
  return GEELY_MODELS;
}

export async function getGeelyModel(slug: string): Promise<GeelyModel | undefined> {
  return (await getGeelyCatalog()).find((m) => m.slug === slug);
}
