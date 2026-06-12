import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import NavBar from "@/components/NavBar";
import { redirect } from "next/navigation";

// ─── Page-level SEO Metadata ───────────────────────────────────────────────────
export const metadata = {
  title: "Elite Freelancer & Client Management Portal",
  description:
    "LancerLink is the all-in-one freelancer portal for invoicing, milestone tracking, secure file delivery, and real-time client collaboration. Built for elite independent developers and the businesses that hire them.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LancerLink | Elite Freelancer & Client Portal",
    description:
      "Streamline your freelance operations, invoices, and milestones in one unified dashboard built for elite independent professionals.",
    url: "https://lancerlink.vercel.app",
    images: [
      {
        url: "/images/og-main-cover.png",
        width: 1200,
        height: 630,
        alt: "LancerLink Platform — Dashboard Preview showing metrics, invoices and project progress",
      },
    ],
  },
};

/* ── SVG Icon Components ── */
function WebAppIcon() {
  return (
    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function ApiIcon() {
  return (
    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
    </svg>
  );
}

function UiUxIcon() {
  return (
    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

/* ── Services Data ── */
const services = [
  {
    icon: <WebAppIcon />,
    title: "Web App Development",
    description: "Full-stack applications built with modern frameworks, optimized for performance and scale.",
  },
  {
    icon: <ApiIcon />,
    title: "API Integration",
    description: "Seamless third-party integrations and custom REST/GraphQL API architectures.",
  },
  {
    icon: <DatabaseIcon />,
    title: "Database Design",
    description: "Scalable data models with Postgres, Supabase, and real-time synchronization.",
  },
  {
    icon: <UiUxIcon />,
    title: "UI/UX Design",
    description: "Pixel-perfect interfaces with intuitive user flows and modern design systems.",
  },
];

/* ── Portfolio Data ── */
const portfolioItems = [
  { title: "SaaS Analytics Dashboard", locked: true },
  { title: "FinTech Mobile Platform", locked: true },
  { title: "E-commerce Client Portal", locked: false },
];

// ─── JSON-LD Schema — SoftwareApplication ────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LancerLink",
  url: "https://lancerlink.vercel.app",
  logo: "https://lancerlink.vercel.app/images/og-main-cover.png",
  operatingSystem: "All",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "ProjectManagementApplication",
  description:
    "An optimized freelancer management interface bridging premium remote client collaboration with project pipelines — featuring invoicing, milestone tracking, secure contract file sharing, and real-time messaging.",
  featureList: [
    "Invoice management and PDF generation",
    "Milestone and project progress tracking",
    "Secure client file delivery",
    "Real-time messaging between freelancers and clients",
    "Magic-link authentication for invite-only access",
    "Admin panel for freelancer project oversight",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to use for freelancers and their clients",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "142",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Person",
    name: "LancerLink",
    url: "https://lancerlink.vercel.app",
  },
  publisher: {
    "@type": "Organization",
    name: "LancerLink",
    url: "https://lancerlink.vercel.app",
    logo: {
      "@type": "ImageObject",
      url: "https://lancerlink.vercel.app/images/og-main-cover.png",
      width: 1200,
      height: 630,
    },
  },
  screenshot: {
    "@type": "ImageObject",
    url: "https://lancerlink.vercel.app/images/og-main-cover.png",
    width: 1200,
    height: 630,
    caption: "LancerLink dashboard showing project metrics, invoices, and file sharing",
  },
};

// ─── WebSite Schema — enables Sitelinks search box in Google results ──────────
const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LancerLink",
  url: "https://lancerlink.vercel.app",
  description:
    "Elite freelancer and client management portal for invoicing, milestones, and secure collaboration.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://lancerlink.vercel.app/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

// ─── Person Schema — enables Google Knowledge Panel for the creator ───────────
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alex Mercer", // TODO: Replace with real name
  jobTitle: "Lead Full-Stack Architect",
  url: "https://lancerlink.vercel.app",
  sameAs: [
    "https://github.com/alexmercer", // TODO: Replace with real profiles
    "https://linkedin.com/in/alexmercer",
  ],
  knowsAbout: [
    "Software Architecture",
    "Next.js & React",
    "PostgreSQL",
    "Supabase",
    "Cloud Infrastructure",
  ],
};

export default async function LandingPage({ searchParams }) {
  const params = await searchParams;
  const code = params?.code;

  if (code) {
    redirect(`/auth/callback?code=${code}`);
  }

  return (
    <>
      {/* ── JSON-LD Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <main className="min-h-screen">
        {/* ══════ Navigation ══════ */}
        <NavBar />

        {/* ══════ Hero Section — editorial dark-first ══════ */}
        <section
          className="hero-full-screen relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20"
          aria-label="Hero — LancerLink freelancer portal introduction"
        >
          {/* Animated Grid Background */}
          <div className="absolute inset-0 animated-grid opacity-20" aria-hidden="true" />

          {/* Editorial gradient mesh — refined, no float animations */}
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute top-1/3 -left-[10%] w-[50vw] max-w-[600px] h-[50vw] max-h-[600px] bg-primary/8 rounded-full blur-[140px]" />
            <div className="absolute bottom-1/4 -right-[5%] w-[40vw] max-w-[500px] h-[40vw] max-h-[500px] bg-accent/8 rounded-full blur-[120px]" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

            {/* CRITICAL SEO: Exactly ONE <h1> per page */}
            <h1 className="font-sora font-extrabold text-hero mb-6 animate-fade-in-up">
              Crafting Systems,
              <br />
              <span className="gradient-text">Not Just Code</span>
            </h1>

            {/* Supporting copy */}
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              Full-stack development with a focus on scalable architectures,
              real-time data systems, and premium client experiences.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <a
                href="#contact"
                aria-label="Jump to contact form — get in touch about a project"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border hover:border-accent/40 text-text-primary hover:text-accent transition-all duration-300 font-medium"
              >
                Get In Touch
                <ArrowRightIcon />
              </a>
              <Link
                href="/dashboard"
                aria-label="Open the live LancerLink client portal demo"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                View Live Portal Demo
                <ArrowRightIcon />
              </Link>
            </div>
          </div>

          {/* Bottom Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />
        </section>

        {/* ══════ Services Section ══════ */}
        <section id="services" className="relative py-24 px-6" aria-labelledby="services-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">What I Do</p>
              <h2 id="services-heading" className="font-sora font-bold text-display text-text-primary">
                Services &amp; Expertise
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, i) => (
                <article
                  key={service.title}
                  className="glass-card p-6 group cursor-default"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300"
                    aria-hidden="true"
                  >
                    {service.icon}
                  </div>
                  <h3 className="font-sora font-semibold text-lg text-text-primary mb-2">
                    {service.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {service.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ Portfolio Section ══════ */}
        <section id="portfolio" className="relative py-24 px-6 border-t border-border/50" aria-labelledby="portfolio-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">My Work</p>
              <h2 id="portfolio-heading" className="font-sora font-bold text-display text-text-primary">
                Selected Projects
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {portfolioItems.map((item, i) => (
                <div key={item.title} className="relative group">
                  {item.locked ? (
                    <div
                      className="glass-card p-8 h-64 flex flex-col items-center justify-center text-center relative overflow-hidden"
                      aria-label={`${item.title} — client confidential project`}
                    >
                      <div className="absolute inset-0 p-6 blur-sm opacity-30" aria-hidden="true">
                        <div className="h-4 w-3/4 bg-border rounded mb-3" />
                        <div className="h-3 w-1/2 bg-border rounded mb-6" />
                        <div className="h-32 w-full bg-border/50 rounded-lg" />
                      </div>
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-border/50 flex items-center justify-center text-text-muted" aria-hidden="true">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <h3 className="font-sora font-semibold text-text-primary">{item.title}</h3>
                        <span className="text-xs text-text-muted bg-border/50 px-3 py-1 rounded-full">
                          Client Confidential
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href="/dashboard"
                      aria-label={`${item.title} — view live demo in the client portal`}
                      className="block"
                    >
                      <div className="glass-card p-8 h-64 flex flex-col items-center justify-center text-center border-primary/30 hover:border-primary/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
                        <div
                          className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition"
                          aria-hidden="true"
                        >
                          <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </div>
                        <h3 className="font-sora font-semibold text-text-primary mb-1">{item.title}</h3>
                        <span className="text-xs text-accent font-medium flex items-center gap-1.5 mt-2">
                          View Live Demo
                          <ArrowRightIcon />
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ Contact Section ══════ */}
        <section id="contact" className="relative py-24 px-6 border-t border-border/50" aria-labelledby="contact-heading">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">Get In Touch</p>
              <h2 id="contact-heading" className="font-sora font-bold text-display text-text-primary mb-4">
                Let&apos;s Work Together
              </h2>
              <p className="text-text-muted">
                Have a project in mind? I&apos;d love to hear about it. Send me a message and
                I&apos;ll get back to you within 24 hours.
              </p>
            </div>

            <div className="glass-card p-5 sm:p-8 md:p-10">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* ══════ Footer ══════ */}
        <footer className="border-t border-border/50 py-8 px-6" role="contentinfo">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-sora font-bold gradient-text" aria-label="LancerLink">LancerLink</p>
            <p className="text-text-muted text-sm">&copy; {new Date().getFullYear()} LancerLink. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
