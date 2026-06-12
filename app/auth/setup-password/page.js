"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function SetupPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => {
    // Only create the client in the browser — SSR doesn't have env vars
    if (typeof window !== "undefined") {
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      );
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // On mount, verify user has a session (came from invite/recovery link)
  useEffect(() => {
    if (!supabase) return;
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setLoading(false);
    }
    checkSession();
  }, [supabase, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to set password. Try again.");
        setSubmitting(false);
        return;
      }

      // Success — redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Unexpected error. Please try again.");
      setSubmitting(false);
    }
  }

  // Show nothing while checking session
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted text-sm">Verifying session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <p className="font-sora font-bold text-xl gradient-text mb-2">
              LancerLink
            </p>
            <p className="text-text-muted text-sm">Set your password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="setup-password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                New Password
              </label>
              <input
                id="setup-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="Min. 8 characters"
                className="input-field disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="setup-confirm-password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Confirm Password
              </label>
              <input
                id="setup-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                placeholder="Re-enter password"
                className="input-field disabled:opacity-60"
              />
            </div>

            {error && (
              <p
                className="text-sm text-error"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !password || !confirmPassword}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Setting password…" : "Set Password & Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
