"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, Clock, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/lib/notion-types";
import { cldUrl } from "@/lib/cloudinary";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const categories = ["ทั้งหมด", "รีวิวรถ", "เคล็ดลับ", "ข่าวสาร", "โปรโมชัน", "CSR"];

const categoryMap: Record<string, string> = {
  review: "รีวิวรถ",
  tips: "เคล็ดลับ",
  news: "ข่าวสาร",
  promotion: "โปรโมชัน",
  csr: "CSR",
};

const categoryColors: Record<string, string> = {
  review: "bg-blue-50 text-blue-600",
  tips: "bg-emerald-50 text-emerald-600",
  news: "bg-gray-100 text-gray-600",
  promotion: "bg-amber-50 text-amber-600",
  csr: "bg-rose-50 text-rose-600",
};

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");

  const filtered = posts.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategory === "ทั้งหมด" ||
      categoryMap[p.category] === activeCategory;
    return matchSearch && matchCat;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="container py-10 lg:py-14">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาบทความ..."
            className="pl-10 border-gray-200 focus:border-[#0F172A]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-[#0F172A] text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Post */}
      {featured && (
        <Link href={`/blog/${featured.slug}`}>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-10 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <div className="grid md:grid-cols-2">
              <div className="aspect-video md:aspect-auto min-h-[280px] relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#334155] img-shimmer">
                {featured.coverImageUrl && (
                  <img
                    src={cldUrl(featured.coverImageUrl, "full")}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${categoryColors[featured.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {categoryMap[featured.category] ?? featured.category}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.publishedAt
                      ? format(new Date(featured.publishedAt), "d MMM yyyy", { locale: th })
                      : ""}
                  </span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-[#0F172A] mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {featured.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
                  {featured.excerpt}
                </p>
                <span className="text-[#0F172A] text-sm font-medium flex items-center gap-1">
                  อ่านต่อ <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Post Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group h-full flex flex-col">
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#334155]">
                {post.coverImageUrl && (
                  <img
                    src={cldUrl(post.coverImageUrl)}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[post.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {categoryMap[post.category] ?? post.category}
                  </span>
                </div>
                <h3 className="font-bold text-[#0F172A] mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "d MMM yyyy", { locale: th })
                      : ""}
                  </span>
                  <span className="text-[#0F172A] text-xs font-medium flex items-center gap-1">
                    อ่านต่อ <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <p className="font-semibold text-[#0F172A] mb-1">ไม่พบบทความที่ตรงกับการค้นหา</p>
          <p className="text-sm text-gray-500">ลองใช้คำค้นอื่น หรือเลือกหมวดหมู่ทั้งหมด</p>
        </div>
      )}
    </div>
  );
}
