import { getPublicStories } from "@/lib/notion";
import StoriesClient from "./StoriesClient";
import { pageMetadata } from "@/lib/site";
import { getYearsOfExperience } from "@/lib/company";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "เรื่องราวลูกค้า",
  description: `ความประทับใจจากลูกค้าจริงที่ไว้วางใจ ช.เอราวัณ กรุ๊ป มากว่า ${getYearsOfExperience()} ปี`,
  path: "/stories",
});

export default async function StoriesPage() {
  const stories = await getPublicStories();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
      {/* Header */}
      <div className="bg-[#0F172A] text-white py-16 lg:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-white/40 text-sm font-medium tracking-wider uppercase mb-3">Customer Stories</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">เรื่องราวลูกค้า</h1>
            <p className="text-white/50 text-base lg:text-lg">
              {`ความประทับใจจากลูกค้าจริงที่ไว้วางใจ ช.เอราวัณ กรุ๊ป มากว่า ${getYearsOfExperience()} ปี`}
            </p>
          </div>
        </div>
      </div>

      <StoriesClient stories={stories} />
    </div>
  );
}
