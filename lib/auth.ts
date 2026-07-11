import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { cleanBaseUrl } from "@/lib/site";

function createAuth() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.warn("[Auth] TURSO_DATABASE_URL not set — auth disabled");
    return null;
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  // BETTER_AUTH_URL can carry stray whitespace/newlines (e.g. a pasted Vercel
  // env var with a trailing \n) — that would land literally inside generated
  // links (password reset, etc.) and break them mid-URL. Sanitize once.
  const authUrl = process.env.BETTER_AUTH_URL ? cleanBaseUrl(process.env.BETTER_AUTH_URL) : "";

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: authUrl || "http://localhost:3002",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail(user.email, url);
      },
    },
    plugins: [admin()],
    trustedOrigins: [
      "http://localhost:3002",
      authUrl,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
      process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "",
    ].filter(Boolean),
  });
}

export const auth = createAuth();

export type Auth = NonNullable<typeof auth>;
