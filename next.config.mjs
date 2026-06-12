/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';

const isDev = process.env.NODE_ENV === 'development';

// ─── Bundle Analyzer ──────────────────────────────────────────────────────────
// Enable with: ANALYZE=true npm run build
const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// ─── Content Security Policy ─────────────────────────────────────────────────
// Dev relaxes script-src to allow webpack eval() source maps and HMR websocket.
// Production stays strict — no eval, no external WS.
const csp = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.supabase.co",
  isDev
    ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* http://localhost:*"
    : "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join('; ');

const nextConfig = {
  // Disable x-powered-by header for security
  poweredByHeader: false,

  // React Strict Mode for detecting side effects
  reactStrictMode: true,

  // Explicitly opt into Turbopack for production builds.
  turbopack: {},

  // Tell Node.js bundler not to bundle these server-only packages.
  serverExternalPackages: ['undici'],

  // Compression enabled locally for dev-prod parity
  compress: true,

  // Compile optimizations
  compiler: {
    // Strip console.log in production (preserve error + warn)
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },

  // Advanced Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      // Long-term cache headers for images in public/images/
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Short cache for manifest.json
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default analyzer(nextConfig);
