import { geelyModelPath, modelSlugFromCarSlug } from "@/lib/geelyModels";
import { notFound } from "next/navigation";
import { getCarBySlug, getCarSlugsForPrerender, getActiveCars } from "@/lib/notion";
import CarDetailClient from "./CarDetailClient";
import type { Metadata } from "next";
import { JsonLd, productVehicleJsonLd, carBreadcrumbJsonLd } from "@/lib/seo";
import { canonicalUrl } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getCarSlugsForPrerender(40);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return { title: "ไม่พบรถ" };
  const title = `${car.brand} ${car.model} ${car.year}`;
  const description =
    car.description || `${car.brand} ${car.model} ราคาเริ่มต้น ฿${car.priceMin.toLocaleString()}`;
  // Geely cars live on /geely/models/<slug> (same content) — point search engines there.
  const path =
    car.brand === "Geely" ? geelyModelPath(modelSlugFromCarSlug(car.slug || slug)) : `/cars/${car.slug || slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(path) },
    openGraph: {
      title,
      description,
      url: canonicalUrl(path),
      images: car.imageUrls[0] ? [car.imageUrls[0]] : [],
    },
  };
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  // Fetch related cars in parallel after car is resolved (needs car.brand)
  const [brandCars] = await Promise.all([getActiveCars({ brand: car.brand })]);
  const relatedCars = brandCars
    .filter((c) => c.id !== car.id && c.imageUrls.length > 0)
    .slice(0, 4);

  const vehicleSchema = productVehicleJsonLd({ car, slug });
  const breadcrumbs = carBreadcrumbJsonLd(car, slug);

  return (
    <>
      <JsonLd data={vehicleSchema} />
      <JsonLd data={breadcrumbs} />
      <CarDetailClient car={car} relatedCars={relatedCars} />
    </>
  );
}
