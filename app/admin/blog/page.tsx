"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Pencil, Plus, Search, Trash2, Filter } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import BlogForm from "@/components/admin/BlogForm";
import type { BlogPost } from "@/lib/notion-types";

const CATEGORY_LABEL: Record<string, string> = {
  review: "รีวิว",
  tips: "เคล็ดลับ",
  news: "ข่าวสาร",
  promotion: "โปรโมชัน",
  csr: "เพื่อสังคม",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPosts = () => {
    setLoading(true);
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const togglePublish = async (post: BlogPost, value: boolean) => {
    setBusyId(post.id);
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPublished: value } : p)));
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, publish: value }),
      });
      if (!res.ok) throw new Error();
      toast.success(value ? "เผยแพร่บทความแล้ว" : "เปลี่ยนเป็นฉบับร่างแล้ว");
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPublished: !value } : p)));
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    setDeleting(null);
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("ลบบทความสำเร็จ");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  // Reset to page 1 when filters change
  const resetPage = () => setPage(1);

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchPub = publishedFilter === "all" || (publishedFilter === "published" ? p.isPublished : !p.isPublished);
    return matchSearch && matchCat && matchPub;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">บทความ</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการบทความและข่าวสารทั้งหมด</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a2a50] transition-colors"
        >
          <Plus className="w-4 h-4" />
          เขียนบทความ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาบทความ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 w-56"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
        >
          <option value="all">ทุกหมวด</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={publishedFilter}
          onChange={(e) => { setPublishedFilter(e.target.value); resetPage(); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
        >
          <option value="all">ทั้งเผยแพร่และฉบับร่าง</option>
          <option value="published">เผยแพร่แล้ว</option>
          <option value="draft">ฉบับร่าง</option>
        </select>
        {(search || categoryFilter !== "all" || publishedFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setCategoryFilter("all"); setPublishedFilter("all"); resetPage(); }}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <Filter className="w-3.5 h-3.5" /> ล้าง filter
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} บทความ</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <BookOpen className="w-10 h-10" />
            <p className="text-sm">ยังไม่มีบทความ</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">ชื่อบทความ</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-28">หมวดหมู่</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-32">วันที่เผยแพร่</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3 uppercase tracking-wider w-24">เผยแพร่</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-300 shrink-0" />
                      <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm font-medium text-[#0F172A] hover:underline line-clamp-1">
                        {post.title}
                      </Link>
                    </div>
                    {post.excerpt && <p className="text-xs text-gray-400 mt-0.5 ml-6 line-clamp-1">{post.excerpt}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {CATEGORY_LABEL[post.category] ?? post.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
                      : "—"}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <Switch
                      checked={post.isPublished}
                      disabled={busyId === post.id}
                      onCheckedChange={(v) => togglePublish(post, v)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingId(post.id);
                          setFormOpen(true);
                        }}
                        className="p-2 text-gray-500 hover:text-[#0F172A] hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="แก้ไข"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(post)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <BlogForm open={formOpen} onOpenChange={setFormOpen} postId={editingId} onSaved={fetchPosts} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบบทความ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ &ldquo;{deleting?.title}&rdquo; หรือไม่? บทความจะถูกย้ายไปถังขยะใน Notion
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
