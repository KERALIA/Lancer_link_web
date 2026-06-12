import { z } from 'zod';

/**
 * Runtime environment variable validation using Zod.
 * Validates required vars at startup so missing config fails fast.
 *
 * ── Non-blocking in dev (warns only) ─────────────────────────────────
 * During local development, missing env vars produce a warning so the
 * dev server can still start. Create a `.env.local` file to supply them.
 *
 * ── Blocking in production ───────────────────────────────────────────
 * On Vercel/vendor builds the env vars are injected at build time via
 * the project dashboard. If they're absent the build aborts — no silent
 * runtime failures in production.
 *
 * ── Usage ─────────────────────────────────────────────────────────────
 *   import { env } from '@/lib/env';
 *   const url = env.NEXT_PUBLIC_SUPABASE_URL;
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),

  // Upstash Redis — optional
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(5).optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (!parsed.success) {
    const isProd = process.env.NODE_ENV === 'production';
    const msg = `${isProd ? '❌' : '⚠️'} Invalid environment variables:\n${JSON.stringify(parsed.error.format(), null, 2)}`;
    if (isProd) {
      console.error(msg);
      throw new Error('Invalid environment variables. Aborting.');
    }
    console.warn(msg, '\nSet missing vars in .env.local to silence this warning.');
    return null;
  }

  return parsed.data;
}

export const env = validateEnv();
