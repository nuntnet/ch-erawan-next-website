import { NextResponse } from "next/server";
import { getActiveCars } from "@/lib/notion";

// Slim, cached public car index for the ⌘K search palette.
export const revalidate = 3600;

export async function GET() {
  try {
    const cars = await getActiveCars();
    const index = cars
      .filter((c) => c.slug || c.id)
      .map((c) => ({
        slug: c.slug || c.id,
        brand: c.brand,
        model: c.model,
        year: c.year,
      }));
    return NextResponse.json(index);
  } catch (err) {
    console.error("[cars-index] failed:", err);
    return NextResponse.json([]);
  }
}
