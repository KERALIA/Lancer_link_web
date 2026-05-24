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

export const metadata = {
  title: "LancerLink — Freelancer Client Portal",
  description:
    "A private workspace where clients track project progress, view invoices, and access shared assets in real time.",
  keywords: [
    "freelancer",
    "client portal",
    "project management",
    "invoicing",
    "dashboard",
  ],
  authors: [{ name: "LancerLink" }],
  openGraph: {
    title: "LancerLink — Freelancer Client Portal",
    description:
      "Track project progress, view invoices, and access shared assets.",
    type: "website",
  },
  // PWA / mobile-ready meta
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LancerLink",
  },
};

// Viewport export — enables safe-area-inset and Android browser chrome color
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",          // for notch / Dynamic Island safe-area support
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

/**
 * Anti-flash theme initialization script.
 *
 * This runs SYNCHRONOUSLY before the browser paints anything, so there
 * is zero flash of the wrong theme. Priority order:
 *   1. localStorage (user's saved preference)
 *   2. prefers-color-scheme (OS setting)
 *   3. Absolute fallback → 'dark'
 */
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
      {/*
        suppressHydrationWarning on <html> is required because:
        - The inline script sets data-theme on the server-rendered HTML
        - React hydration won't warn about this attribute mismatch
      */}
      <head>
        {/* Blocking script — must be the very first thing in <head> */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-inter bg-background text-text-primary">
        <CursorTrail />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
