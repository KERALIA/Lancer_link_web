/**
 * Reliable fetch for Supabase on the server.
 *
 * - Windows dev: Next.js patches global fetch in a way that causes ENOTFOUND
 *   errors. We use undici (Node's raw HTTP stack) to bypass it.
 * - Vercel / Linux / production: native globalThis.fetch works correctly.
 *   undici v8 can crash serverless functions silently on Vercel, so we
 *   deliberately fall back to native fetch in non-Windows environments.
 */

const isWindows = process.platform === "win32";

/** @type {typeof fetch} */
export async function supabaseFetch(input, init) {
  if (isWindows) {
    const { fetch: undiciFetch } = await import("undici");
    return undiciFetch(input, init);
  }
  return globalThis.fetch(input, init);
}
