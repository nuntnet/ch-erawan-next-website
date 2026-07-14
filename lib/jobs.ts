import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { jobPostings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return drizzle(client);
}

export const JOB_CATEGORIES = ["sales", "service", "finance", "support", "mgmt"] as const;
export const JOB_BRANCHES = [
  "mazda_npt", "mazda_salaya", "deepal_salaya", "ford_omnoi",
  "mitsubishi_npt", "gwm_npt", "kia_sampran", "hq",
] as const;
export const JOB_STATUSES = ["open", "closed"] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
export type JobBranch = (typeof JOB_BRANCHES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobPostingInput {
  externalId: string;
  title: string;
  code?: string | null;
  category: JobCategory;
  branches: JobBranch[];
  salary?: string | null;
  employmentType?: string | null;
  requirements?: string[] | null;
  description?: string | null;
  urgent?: boolean;
  status: JobStatus;
}

export interface JobPosting {
  id: string;
  title: string;
  code: string | null;
  category: string;
  branches: string[];
  salary: string | null;
  employmentType: string | null;
  requirements: string[];
  description: string | null;
  urgent: boolean;
  status: string;
}

function toRow(job: JobPostingInput, now: Date) {
  return {
    id: job.externalId,
    title: job.title,
    code: job.code ?? null,
    category: job.category,
    branches: JSON.stringify(job.branches),
    salary: job.salary ?? null,
    employmentType: job.employmentType ?? null,
    requirements: job.requirements ? JSON.stringify(job.requirements) : null,
    description: job.description ?? null,
    urgent: job.urgent ?? false,
    status: job.status,
    source: "cats",
    updatedAt: now,
  };
}

/** Upsert a job posting (create if new externalId, otherwise full replace). */
export async function upsertJobPosting(job: JobPostingInput) {
  const db = getDb();
  if (!db) throw new Error("Turso not configured");
  const now = new Date();
  const row = toRow(job, now);
  await db
    .insert(jobPostings)
    .values({ ...row, createdAt: now })
    .onConflictDoUpdate({ target: jobPostings.id, set: row });
}

/** Lightweight status-only update — used for a bare open/close toggle. */
export async function setJobPostingStatus(externalId: string, status: JobStatus) {
  const db = getDb();
  if (!db) throw new Error("Turso not configured");
  const result = await db
    .update(jobPostings)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobPostings.id, externalId))
    .returning({ id: jobPostings.id });
  return result.length > 0;
}

function fromRow(r: typeof jobPostings.$inferSelect): JobPosting {
  return {
    id: r.id,
    title: r.title,
    code: r.code,
    category: r.category,
    branches: JSON.parse(r.branches || "[]"),
    salary: r.salary,
    employmentType: r.employmentType,
    requirements: r.requirements ? JSON.parse(r.requirements) : [],
    description: r.description,
    urgent: r.urgent,
    status: r.status,
  };
}

/** Open postings only — what the public career page renders. */
export async function listOpenJobPostings(): Promise<JobPosting[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(jobPostings).where(eq(jobPostings.status, "open"));
  return rows.map(fromRow);
}

/** All postings regardless of status — for CATS-side verification / admin. */
export async function listAllJobPostings(): Promise<JobPosting[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(jobPostings);
  return rows.map(fromRow);
}
