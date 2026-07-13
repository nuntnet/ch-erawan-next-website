import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { getBlogPostWithContent, getAllBlogSlugs, getPublishedBlogPosts } from "@/lib/notion";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import CallToAction from "@/components/CallToAction";
import { cldUrl } from "@/lib/cloudinary";
import type { Metadata } from "next";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/site";
import { JsonLd, articleJsonLd } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllBlogSlugs();
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
  const post = await getBlogPostWithContent(slug);
  if (!post) return { title: "ไม่พบบทความ" };
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const path = `/blog/${post.slug || slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(path) },
    openGraph: {
      title,
      description,
      url: canonicalUrl(path),
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostWithContent(slug);
  if (!post) notFound();

  const recentPosts = await getPublishedBlogPosts(4);
  const related = recentPosts.filter((p) => p.slug !== slug).slice(0, 3);

  const postPath = `/blog/${post.slug || slug}`;
  const articleSchema = articleJsonLd(post, slug);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "หน้าแรก", path: "/" },
    { name: "บทความ", path: "/blog" },
    { name: post.title, path: postPath },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbs} />
    <div className="min-h-screen bg-white pt-[68px]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden min-h-[400px] lg:min-h-[500px] flex items-end">
        {post.coverImageUrl ? (
          <Image
            src={cldUrl(post.coverImageUrl, "quality")}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] to-[#334155]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative z-10 w-full p-8 lg:p-12">
          <div className="container max-w-4xl">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <Link href="/blog" className="hover:text-white transition-colors">บทความ</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{post.title}</span>
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-white/60 text-sm">
              {post.authorName && <span>{post.authorName}</span>}
              {post.publishedAt && (
                <span>
                  {format(new Date(post.publishedAt), "d MMMM yyyy", { locale: th })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl py-12">
        <article className="prose prose-slate prose-lg max-w-none break-words">
          <ReactMarkdown>{post.contentMarkdown}</ReactMarkdown>
        </article>

        {/* CTA after content */}
        <CallToAction
          brand={post.tags?.find((t: string) => ["mazda","ford","mitsubishi","gwm","deepal","kia"].includes(t.toLowerCase()))?.toUpperCase()}
          variant="compact"
          className="mt-10"
        />
      </div>

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="bg-[#F8FAFC] py-12">
          <div className="container">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">บทความที่เกี่ยวข้อง</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`}>
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      {rp.coverImageUrl && (
                        <img
                          src={cldUrl(rp.coverImageUrl)}
                          alt={rp.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[#0F172A] text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-2">
                        {rp.publishedAt
                          ? format(new Date(rp.publishedAt), "d MMM yyyy", { locale: th })
                          : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
