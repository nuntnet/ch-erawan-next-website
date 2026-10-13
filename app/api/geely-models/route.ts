import { NextResponse } from "next/server";
import { getGeelyCatalog } from "@/lib/geelyCatalog";
import { geelyModelPath, geelyStartingPrice } from "@/lib/geelyModels";

export const revalidate = 3600;

/** Public, read-only Geely model list (Notion-backed) — used by the WebMCP tool. */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const models = await getGeelyCatalog();
  return NextResponse.json(
    models.map((m) => ({
      model: m.name,
      summary: m.summary,
      startingPrice: geelyStartingPrice(m) || null,
      trims: m.trims,
      url: `${origin}${geelyModelPath(m.slug)}`,
    }))
  );
}
