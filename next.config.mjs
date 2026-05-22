/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly opt into Turbopack for production builds.
  // This prevents Vercel's Webpack-based modifyConfig overlay from running
  // and crashing with "path argument must be of type string. Received undefined".
  turbopack: {},

  // Tell Node.js bundler not to bundle these server-only packages.
  serverExternalPackages: ["undici"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; object-src 'none';"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
