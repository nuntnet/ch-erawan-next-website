import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { auditFromSession } from "@/lib/audit";
import {
  getAllBlogPostsAdmin,
  getBlogPostForEdit,
  createBlogPost,
  updateBlogPost,
  setBlogPublished,
  archiveBlogPost,
} from "@/lib/notion";
import type { BlogMetaInput } from "@/lib/notion-types";

const metaSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string(),
  coverImageUrl: z.string().nullable().or(z.literal("")),
  category: z.enum(["review", "tips", "news", "promotion", "csr"]),
  tags: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
  authorName: z.string(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
});

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/");
  if (slug) revalidatePath(`/blog/${slug}`);
}

// GET — list all posts (admin) OR single post for edit via ?id=
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const post = await getBlogPostForEdit(id);
      if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(post);
    }
    const posts = await getAllBlogPostsAdmin();
    return NextResponse.json(posts);
  } catch (err) {
    console.error("Admin blog GET error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST — create a post
const createSchema = z.object({
  meta: metaSchema,
  markdown: z.string(),
});

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { meta, markdown } = createSchema.parse(await req.json());
    const post = await createBlogPost(
      { ...meta, coverImageUrl: meta.coverImageUrl || null } as BlogMetaInput,
      markdown
    );
    revalidateBlog(post.slug);
    await auditFromSession({ action: "create", resource: "blog", resourceId: post.id, details: { title: post.title } });
    return NextResponse.json(post);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Admin blog POST error:", err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

// PATCH — update post, OR toggle publish via { id, publish }
const patchSchema = z.object({
  id: z.string().min(1),
  meta: metaSchema.partial().optional(),
  markdown: z.string().optional(),
  publish: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id, meta, markdown, publish } = patchSchema.parse(await req.json());

    if (publish !== undefined && meta === undefined && markdown === undefined) {
      await setBlogPublished(id, publish);
      revalidateBlog();
      await auditFromSession({ action: "update", resource: "blog", resourceId: id, details: { publish } });
      return NextResponse.json({ success: true });
    }

    const metaPayload: Partial<BlogMetaInput> | undefined = meta
      ? { ...meta, ...(meta.coverImageUrl !== undefined ? { coverImageUrl: meta.coverImageUrl || null } : {}) }
      : undefined;

    const post = await updateBlogPost(id, metaPayload ?? {}, markdown);
    revalidateBlog(post.slug);
    await auditFromSession({ action: "update", resource: "blog", resourceId: id, details: { title: post.title } });
    return NextResponse.json(post);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: err.issues }, { status: 400 });
    }
    console.error("Admin blog PATCH error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE — archive (soft delete)
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await archiveBlogPost(id);
    revalidateBlog();
    await auditFromSession({ action: "delete", resource: "blog", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin blog DELETE error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
