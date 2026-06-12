/**
 * Reliable fetch for Supabase on the server.
 * Next.js can patch global fetch in a way that fails on Windows (ENOTFOUND / "fetch failed");
 * undici uses Node's network stack directly.
 */
import { fetch as undiciFetch } from "undici";

/** @type {typeof fetch} */
export function supabaseFetch(input, init) {
  return undiciFetch(input, init);
}
