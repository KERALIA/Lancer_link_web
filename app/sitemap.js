/**
 * app/sitemap.js — Programmatic XML sitemap via Next.js MetadataRoute
 *
 * Next.js generates /sitemap.xml from this file at build time (or on-demand
 * with ISR). Add new public routes here as the site grows.
 *
 * Priority guide:
 *  1.0 — homepage / most important landing
 *  0.8 — key conversion pages (services, portfolio, contact)
 *  0.5 — supporting informational pages
 */
export default async function sitemap() {
  const baseUrl = "https://lancerlink.vercel.app";
  const now = new Date();

  return [
    // ── Root landing page ─────────────────────────────────────────────────
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },

    // ── Section anchors — treated as separate discoverability signals ──────
    // These aren't separate routes but signal to Google which anchors matter.
    {
      url: `${baseUrl}/#services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#portfolio`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },

    // ── Login page — indexable as an entry point for invited clients ───────
    // We do NOT block login from crawlers (unlike dashboard) because it
    // provides a legitimate user-facing entry point.
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
