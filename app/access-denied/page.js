import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="glass-card p-8 md:p-10">

          {/* Icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(251, 191, 36, 0.12)" }}
          >
            <svg
              className="w-7 h-7"
              style={{ color: "#f59e0b" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <h1 className="font-sora font-bold text-2xl text-text-primary mb-3">
            Access denied
          </h1>

          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Your email isn&apos;t associated with any project in the portal yet.
            Please contact the admin through the form on the home page and
            they&apos;ll get you set up.
          </p>

          {/* Divider */}
          <div className="border-t border-border/50 mb-6" />

          {/* Primary CTA */}
          <Link
            href="/#contact"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-primary/20 mb-3"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            Go to Contact Form
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/login"
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Back to login
          </Link>

        </div>
      </div>
    </main>
  );
}
