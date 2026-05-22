import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="glass-card p-8 md:p-10">
          <h1 className="font-sora font-bold text-2xl text-text-primary mb-3">
            Access denied
          </h1>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Your email is not associated with any project. Please contact your
            project manager.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
