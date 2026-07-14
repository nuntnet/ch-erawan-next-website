import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  JOB_CATEGORIES,
  JOB_BRANCHES,
  JOB_STATUSES,
  upsertJobPosting,
  setJobPostingStatus,
  listAllJobPostings,
  type JobPostingInput,
} from "@/lib/jobs";

// ───────────────────────────────────────────────────────
// Inbound sync endpoint for CATS (the ATS at cats.ch-erawan.com).
// CATS pushes job postings here; this site is a pure receiver.
// Auth: `Authorization: Bearer <CATS_SYNC_SECRET>` shared secret.
// ───────────────────────────────────────────────────────

const jobSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  code: z.string().nullable().optional(),
  category: z.enum(JOB_CATEGORIES),
  branches: z.array(z.enum(JOB_BRANCHES)).min(1),
  salary: z.string().nullable().optional(),
  employmentType: z.string().nullable().optional(),
  requirements: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  urgent: z.boolean().optional(),
  status: z.enum(JOB_STATUSES),
});

const batchSchema = z.object({ jobs: z.array(z.unknown()).min(1) });

function checkSecret(req: NextRequest): boolean {
  const expected = process.env.CATS_SYNC_SECRET;
  if (!expected) return false; // fail closed if not configured
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function revalidateCareer() {
  revalidatePath("/career");
}

/** Create/update one or many job postings. Body: { jobs: [...] } or a single job object. */
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const candidates =
    raw && typeof raw === "object" && "jobs" in (raw as Record<string, unknown>)
      ? batchSchema.parse(raw).jobs
      : [raw];

  const upserted: string[] = [];
  const errors: { externalId?: string; issues: unknown }[] = [];

  for (const candidate of candidates) {
    const parsed = jobSchema.safeParse(candidate);
    if (!parsed.success) {
      const externalId =
        candidate && typeof candidate === "object" && "externalId" in (candidate as Record<string, unknown>)
          ? String((candidate as Record<string, unknown>).externalId)
          : undefined;
      errors.push({ externalId, issues: parsed.error.issues });
      continue;
    }
    const job: JobPostingInput = parsed.data;
    try {
      await upsertJobPosting(job);
      upserted.push(job.externalId);
    } catch (err) {
      console.error("[CATS sync] upsert failed:", err);
      errors.push({ externalId: job.externalId, issues: "db write failed" });
    }
  }

  if (upserted.length > 0) revalidateCareer();

  return NextResponse.json({ ok: errors.length === 0, upserted, errors });
}

/** Lightweight status-only toggle. Body: { externalId, status }. */
export async function PATCH(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({ externalId: z.string().min(1), status: z.enum(JOB_STATUSES) })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const found = await setJobPostingStatus(parsed.data.externalId, parsed.data.status);
  if (!found) {
    return NextResponse.json({ error: "Unknown externalId — push it via POST first" }, { status: 404 });
  }

  revalidateCareer();
  return NextResponse.json({ ok: true });
}

/** Verification endpoint — returns everything currently stored, any status. */
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized();
  const jobs = await listAllJobPostings();
  return NextResponse.json({ jobs });
}
