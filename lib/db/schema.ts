import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/** Matches Turso tables created by scripts/seed-admin.ts (camelCase columns). */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }),
  image: text("image"),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
  role: text("role"),
  banned: integer("banned", { mode: "boolean" }),
  banReason: text("banReason"),
  banExpires: text("banExpires"),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    token: text("token").notNull().unique(),
    expiresAt: text("expiresAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: text("createdAt"),
    updatedAt: text("updatedAt"),
    impersonatedBy: text("impersonatedBy"),
    activeOrganizationId: text("activeOrganizationId"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    accessTokenExpiresAt: text("accessTokenExpiresAt"),
    refreshTokenExpiresAt: text("refreshTokenExpiresAt"),
    scope: text("scope"),
    idToken: text("idToken"),
    password: text("password"),
    createdAt: text("createdAt"),
    updatedAt: text("updatedAt"),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: text("expiresAt").notNull(),
    createdAt: text("createdAt"),
    updatedAt: text("updatedAt"),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ── Job Postings (pushed from CATS ATS) ──────────────────
export const jobPostings = sqliteTable(
  "job_postings",
  {
    // CATS's own job id — used as the upsert key so re-pushing the same
    // job (e.g. to flip status) updates the row instead of duplicating it.
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    code: text("code"),
    category: text("category").notNull(), // "sales" | "service" | "finance" | "support" | "mgmt"
    branches: text("branches").notNull(), // JSON string array of branch keys (see BRANCH_LABELS)
    salary: text("salary"),
    employmentType: text("employment_type"),
    requirements: text("requirements"), // JSON string array
    description: text("description"),
    urgent: integer("urgent", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("open"), // "open" | "closed"
    source: text("source").notNull().default("cats"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("jp_status_idx").on(t.status),
    index("jp_category_idx").on(t.category),
  ]
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    event: text("event").notNull(), // 'car_view' | 'booking' | 'contact' | 'search'
    path: text("path"),
    brand: text("brand"),
    model: text("model"),
    meta: text("meta"), // JSON string extras
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("ae_event_idx").on(t.event),
    index("ae_created_idx").on(t.createdAt),
    index("ae_brand_idx").on(t.brand),
  ]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ── Audit Log ─────────────────────────────────────────
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    userName: text("user_name"),
    action: text("action").notNull(), // "create" | "update" | "delete" | "login" | "invite"
    resource: text("resource").notNull(), // "car" | "blog" | "user" | "promotion" etc.
    resourceId: text("resource_id"),
    details: text("details"), // JSON string with before/after or extra info
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("audit_user_idx").on(t.userId),
    index("audit_resource_idx").on(t.resource),
    index("audit_created_idx").on(t.createdAt),
  ]
);
