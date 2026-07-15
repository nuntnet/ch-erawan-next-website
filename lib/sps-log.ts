import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { spsCallLog } from "@/lib/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";

export type SpsCallLog = typeof spsCallLog.$inferSelect;

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return drizzle(client);
}

/**
 * Records the outcome of a single SPS service-booking proxy call — the
 * fields the route already computes but previously only logged to
 * console.error (and only on failure). Never throws — logging must not
 * break the actual booking request.
 */
export async function logSpsCall(opts: {
  branch: string;
  branchId?: string;
  customerName?: string;
  customerPhone?: string;
  preferredDate?: string;
  preferredTime?: string;
  requestPayload?: Record<string, string>;
  responseStatus?: number;
  responseBody?: string;
  success: boolean;
  errorMessage?: string;
  notionPageId?: string;
}) {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(spsCallLog).values({
      branch: opts.branch,
      branchId: opts.branchId ?? null,
      customerName: opts.customerName ?? null,
      customerPhone: opts.customerPhone ?? null,
      preferredDate: opts.preferredDate ?? null,
      preferredTime: opts.preferredTime ?? null,
      requestPayload: opts.requestPayload ? JSON.stringify(opts.requestPayload) : null,
      responseStatus: opts.responseStatus ?? null,
      responseBody: opts.responseBody ? opts.responseBody.slice(0, 2000) : null,
      success: opts.success,
      errorMessage: opts.errorMessage ?? null,
      notionPageId: opts.notionPageId ?? null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("[SPS Log] Failed to log:", err);
  }
}

export async function getSpsLogById(id: number): Promise<SpsCallLog | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(spsCallLog).where(eq(spsCallLog.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getSpsLogs(opts?: {
  days?: number;
  branch?: string;
  success?: boolean;
  limit?: number;
}) {
  const db = getDb();
  if (!db) return [];
  const days = opts?.days ?? 30;
  const limit = opts?.limit ?? 200;
  const since = new Date(Date.now() - days * 86400000);

  const conditions = [gte(spsCallLog.createdAt, since)];
  if (opts?.branch) conditions.push(eq(spsCallLog.branch, opts.branch));
  if (opts?.success !== undefined) conditions.push(eq(spsCallLog.success, opts.success));

  return db.select().from(spsCallLog)
    .where(and(...conditions))
    .orderBy(desc(spsCallLog.createdAt))
    .limit(limit);
}
