import Link from "next/link";
import BrandHero from "@/components/BrandHero";
import BrandSubNav from "@/components/brands/BrandSubNav";
import { BRAND_BY_SLUG } from "@/lib/brandConfig";
import { getVideoReviewsByBrand, getSocialLinksByBrand } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { Play, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "รีวิวรถ GWM — ช.เอราวัณ กรุ๊ป",
  description: "รีวิวรถ GWM จาก YouTube และ TikTok — HAVAL, ORA, TANK",
  path: "/gwm/reviews",
});

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Extract TikTok video ID */
function getTikTokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return m ? m[1] : null;
}

function getYouTubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export default async function GwmReviewsPage() {
  const brand = BRAND_BY_SLUG.gwm;
  const [videos, socialLinks] = await Promise.all([
    getVideoReviewsByBrand("GWM"),
    getSocialLinksByBrand("GWM"),
  ]);

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: "GWM", path: "/gwm" },
    { name: "รีวิวรถ", path: "/gwm/reviews" },
  ];

  // Separate by platform
  const ytVideos = videos.filter(v => v.platform === "YouTube");
  const ttVideos = videos.filter(v => v.platform === "TikTok");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <div className="min-h-screen bg-[#F8FAFC] pt-[64px]">
        <BrandHero
          brand={brand}
          breadcrumbs={breadcrumbs}
          socialLinks={socialLinks}
          primaryCta={{ label: "นัดทดลองขับ", href: "/booking?type=test_drive&brand=GWM" }}
          secondaryCta={{ label: "ดูรถ GWM", href: "/gwm" }}
          footer={<p className="text-white/75 text-sm">รีวิวจาก YouTube · TikTok</p>}
        />

        <BrandSubNav brand={brand} currentSection="reviews" scrollPastHero />

        {/* Empty state */}
        {videos.length === 0 ? (
          <section className="container py-20 text-center">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">กำลังเตรียมวิดีโอรีวิว</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              เพิ่มวิดีโอ YouTube หรือ TikTok ได้ที่{" "}
              <Link href="/admin/video-reviews" className="text-[#C8102E] hover:underline">
                Admin → Video Reviews
              </Link>
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {socialLinks.filter(s => s.platform === "YouTube" || s.platform === "TikTok").map(s => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    ติดตาม {s.platform}
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </a>
              ))}
            </div>
          </section>
        ) : (
          <section className="container py-12 lg:py-16 space-y-12">

            {/* YouTube */}
            {ytVideos.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    YouTube
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 mr-2">{ytVideos.length} วิดีโอ</span>
                  {/* YouTube Subscribe button */}
                  <a
                    href="https://www.youtube.com/channel/UC0NG66o5IxnK_2-6-bJyu1g?sub_confirmation=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    Subscribe
                  </a>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ytVideos.map(video => {
                    const ytId = getYouTubeId(video.videoUrl);
                    const thumb = video.thumbnailUrl || (ytId ? getYouTubeThumbnail(ytId) : null);
                    return (
                      <a
                        key={video.id}
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gray-900 overflow-hidden">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                          )}
                          {/* Play overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                          {/* Duration badge placeholder */}
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                            YouTube
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-[#0F172A] text-sm leading-snug line-clamp-2 group-hover:text-[#C8102E] transition-colors">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{video.description}</p>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TikTok */}
            {ttVideos.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-[#010101] text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                    TikTok
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{ttVideos.length} วิดีโอ</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ttVideos.map(video => {
                    const ttId = getTikTokId(video.videoUrl);
                    return (
                      <a
                        key={video.id}
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                      >
                        <div className="relative aspect-[9/16] bg-gray-900 overflow-hidden">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white/20"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-medium text-[#0F172A] line-clamp-2 group-hover:text-[#C8102E] transition-colors">
                            {video.title}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* CTA to social channels */}
        {socialLinks.filter(s => s.platform === "YouTube" || s.platform === "TikTok").length > 0 && (
          <section className="bg-[#0F172A] py-10">
            <div className="container text-center">
              <p className="text-white/60 text-sm mb-4">ติดตามช่องของเราเพื่อรับชมรีวิวล่าสุด</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {socialLinks
                  .filter(s => s.platform === "YouTube" || s.platform === "TikTok")
                  .map(s => (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                        s.platform === "YouTube" ? "bg-red-600 hover:bg-red-700" : "bg-[#010101] hover:bg-gray-900"
                      }`}>
                      {s.platform}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
