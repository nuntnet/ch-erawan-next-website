"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { BlogPost } from "@/lib/notion-types";

type Category = BlogPost["category"];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "review", label: "รีวิว" },
  { value: "tips", label: "เคล็ดลับ" },
  { value: "news", label: "ข่าวสาร" },
  { value: "promotion", label: "โปรโมชัน" },
  { value: "csr", label: "กิจกรรมเพื่อสังคม" },
];

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: Category;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  authorName: string;
}

const emptyForm: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  coverImageUrl: null,
  category: "news",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  authorName: "",
};

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^\u0E00-\u0E7Fa-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

interface BlogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null; // null = create
  onSaved: () => void;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20";
const labelClass = "text-sm font-medium text-gray-700 mb-1 block";

export default function BlogForm({ open, onOpenChange, postId, onSaved }: BlogFormProps) {
  const [form, setForm] = useState<BlogFormState>(emptyForm);
  const [markdown, setMarkdown] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!postId) {
      setForm(emptyForm);
      setMarkdown("");
      setSlugTouched(false);
      return;
    }
    setLoading(true);
    setSlugTouched(true);
    fetch(`/api/admin/blog?id=${postId}`)
      .then((r) => r.json())
      .then((post) => {
        setForm({
          title: post.title ?? "",
          slug: post.slug ?? "",
          excerpt: post.excerpt ?? "",
          coverImageUrl: post.coverImageUrl ?? null,
          category: post.category ?? "news",
          tags: post.tags ?? [],
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          authorName: post.authorName ?? "",
        });
        setMarkdown(post.contentMarkdown ?? "");
      })
      .catch(() => toast.error("โหลดบทความไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [open, postId]);

  const set = <K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTitle = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("กรุณากรอกชื่อบทความ");
      return;
    }
    const meta = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt,
      coverImageUrl: form.coverImageUrl || null,
      category: form.category,
      tags: form.tags,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      authorName: form.authorName,
    };

    setSaving(true);
    try {
      const res = postId
        ? await fetch("/api/admin/blog", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: postId, meta, markdown }),
          })
        : await fetch("/api/admin/blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meta, markdown }),
          });
      if (!res.ok) throw new Error();
      toast.success(postId ? "บันทึกบทความสำเร็จ" : "สร้างบทความสำเร็จ");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">
            {postId ? "แก้ไขบทความ" : "เขียนบทความใหม่"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 text-[#0F172A] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>ชื่อบทความ *</label>
              <input className={inputClass} value={form.title} onChange={(e) => handleTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Slug (URL)</label>
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>หมวดหมู่</label>
                <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>เกริ่นนำ (Excerpt)</label>
              <textarea className={`${inputClass} min-h-[60px]`} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>ผู้เขียน</label>
                <input className={inputClass} value={form.authorName} onChange={(e) => set("authorName", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>แท็ก (คั่นด้วยจุลภาค)</label>
                <input
                  className={inputClass}
                  value={form.tags.join(", ")}
                  onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                  placeholder="มาสด้า, รีวิว"
                />
              </div>
            </div>

            <ImageUploader
              label="รูปปก (Cover Image)"
              value={form.coverImageUrl ? [form.coverImageUrl] : []}
              onChange={(urls) => set("coverImageUrl", urls[0] ?? null)}
            />

            <div>
              <label className={labelClass}>เนื้อหา</label>
              <RichTextEditor value={markdown} onChange={setMarkdown} />
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 font-medium">SEO (ไม่บังคับ)</summary>
              <div className="space-y-3 mt-3">
                <div>
                  <label className={labelClass}>SEO Title</label>
                  <input className={inputClass} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>SEO Description</label>
                  <textarea className={`${inputClass} min-h-[60px]`} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
                </div>
              </div>
            </details>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#1a2a50] transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {postId ? "บันทึก" : "สร้างบทความ"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
