import { Sora, Inter } from "next/font/google";
import "./globals.css";
import CursorTrail from "@/components/CursorTrail";
import { ThemeProvider } from "@/components/ThemeProvider";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// ─── Metadata ───────────────────────────────────────────────────────────────
// metadataBase resolves all relative image/canonical URLs to the production
// domain. Update this URL before deploying to a custom domain.
export const metadata = {
  metadataBase: new URL("https://lancerlink.vercel.app"),

  // Title template: sub-pages get "<Page Title> | LancerLink" automatically
  title: {
    default: "LancerLink | Elite Freelancer & Client Management Portal",
    template: "%s | LancerLink",
  },

  description:
    "Streamline your freelance operations end-to-end. LancerLink bridges independent developers and premium clients with seamless invoicing workflows, milestone tracking, contract-secure file sharing, and real-time project collaboration — all from one unified portal.",

  keywords: [
    "freelancer portal",
    "client management software",
    "secure contract tracking",
    "developer invoicing tool",
    "freelance milestone tracking",
    "client collaboration dashboard",
    "invoice automation",
    "remote team management",
    "project delivery portal",
    "freelancer onboarding platform",
  ],

  // Canonical self-reference for the root layout
  alternates: {
    canonical: "/",
  },

  // ── OpenGraph ──────────────────────────────────────────────────────────────
  openGraph: {
    title: "LancerLink | Elite Freelancer & Client Management Portal",
    description:
      "Streamline your freelance operations, invoices, and milestones in one unified dashboard built for elite independent professionals.",
    url: "https://lancerlink.vercel.app",
    siteName: "LancerLink",
    images: [
      {
        url: "/images/og-main-cover.png",
        width: 1200,
        height: 630,
        alt: "LancerLink Platform — Dashboard Preview showing metrics, invoices and project progress",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "LancerLink | Elite Freelancer & Client Portal",
    description:
      "The ultimate interface connecting remote engineers and designers directly to businesses — invoicing, milestones, and secure collaboration in one place.",
    images: ["/images/og-main-cover.png"],
    creator: "@lancerlink",
  },

  // ── Robot directives — public pages indexable by default ──────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── PWA / mobile-ready meta ───────────────────────────────────────────────
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LancerLink",
  },
};

// ─── Viewport ─────────────────────────────────────────────────────────────────
// Exported separately per Next.js 14+ App Router convention.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

// ─── Anti-flash theme script ──────────────────────────────────────────────────
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
      return;
    }
  } catch (e) {}
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
})();
`.trim();

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking script — must run before first paint to prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-inter bg-background text-text-primary">
        <CursorTrail />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
