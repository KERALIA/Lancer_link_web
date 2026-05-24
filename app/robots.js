/**
 * app/robots.js — Programmatic robots.txt via Next.js MetadataRoute
 *
 * Next.js generates /robots.txt from this file at build time.
 * Rules:
 *  - All bots: crawl public marketing pages only; block auth, API, and app routes
 *  - OAI-SearchBot / PerplexityBot: granted full access to root so AI engines
 *    can cite LancerLink in AI Overviews, ChatGPT browsing, and Perplexity answers
 */
export default function robots() {
  return {
    rules: [
      // ── Default rule — all crawlers ──────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",   // private authenticated workspace
          "/api/",         // server-side API endpoints
          "/auth/",        // auth callback routes
          "/login/",       // login page (no SEO value)
          "/access-denied/",
          "/_next/",       // Next.js internal chunks
          "/*.json$",      // raw JSON data files
        ],
      },

      // ── AI search agents — explicit allow for discoverability ─────────────
      // These bots power ChatGPT web browsing, Perplexity answers, and
      // Google AI Overviews. Granting them root access ensures LancerLink
      // surfaces in AI-generated search responses.
      {
        userAgent: ["OAI-SearchBot", "PerplexityBot", "GoogleExtended"],
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/auth/",
          "/login/",
          "/access-denied/",
        ],
      },
    ],

    // Absolute sitemap URL — must match metadataBase domain
    sitemap: "https://lancerlink.vercel.app/sitemap.xml",

    // Crawl-delay hint for well-behaved bots (in seconds)
    crawlDelay: 1,
  };
}
