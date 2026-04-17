import type { NextConfig } from "next";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY at build time. " +
      "Check Vercel Production environment variables."
  );
}

const nextConfig: NextConfig = {
  // WARNING: Only NEXT_PUBLIC_* vars belong in this block. Values listed here
  // are inlined into the client bundle at build time. NEVER add
  // SUPABASE_SERVICE_ROLE_KEY, HGS_ADMIN_PASSWORD, or HGS_ADMIN_SESSION_SECRET
  // here — they must stay server-only. Read those via `process.env.*` inside
  // route handlers / `src/lib/supabase-admin.ts` / `src/lib/admin-session.ts`.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
