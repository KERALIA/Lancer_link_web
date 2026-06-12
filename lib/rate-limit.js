/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-process Next.js deployments.
 * Replace with Redis-backed version if scaling to multiple instances.
 */

const store = new Map();

/**
 * @param {object} options
 * @param {string} options.key      — unique identifier for the client (IP hash, email, etc.)
 * @param {number} options.max      — max requests allowed in the window
 * @param {number} options.windowMs — window length in milliseconds
 * @returns {{ ok: boolean, remaining: number, resetInMs: number }}
 */
export function checkRateLimit({ key, max = 10, windowMs = 60_000 }) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.start >= windowMs) {
    store.set(key, { start: now, count: 1 });
    return { ok: true, remaining: max - 1, resetInMs: windowMs };
  }

  entry.count += 1;

  if (entry.count > max) {
    const elapsed = now - entry.start;
    return {
      ok: false,
      remaining: 0,
      resetInMs: Math.max(1, windowMs - elapsed),
    };
  }

  return { ok: true, remaining: max - entry.count, resetInMs: windowMs - (now - entry.start) };
}

/**
 * Periodic cleanup to prevent memory leaks.
 * Run once at startup — sweeps stale entries every 60s.
 */
export function startRateLimitCleanup(intervalMs = 60_000) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.start >= intervalMs) {
        store.delete(key);
      }
    }
  }, intervalMs);
}
