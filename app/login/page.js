"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── SEO Note ─────────────────────────────────────────────────────────────────
// Login page metadata is intentionally NOT exported here because this is a
// "use client" component. Instead, a separate metadata file handles it.
// See: app/login/layout.js (created alongside this file)

const AUTH_ERRORS = {
  auth_failed: "Login link expired or invalid. Request a new link below.",
  missing_code: "Invalid login link. Request a new link below.",
  no_email: "Could not read your email from the session. Try again.",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(() => {
    if (typeof window !== "undefined") {
      const code = new URLSearchParams(window.location.search).get("error");
      return code && AUTH_ERRORS[code] ? AUTH_ERRORS[code] : null;
    }
    return null;
  });
  const [sentEmail, setSentEmail] = useState("");

  const resetForm = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  // ── Password sign in ──
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setStatus("error");
          setError(
            body?.error || "Too many attempts. Please wait before trying again.",
          );
          return;
        }
        if (res.status === 403 && body?.notRegistered) {
          setStatus("not_registered");
          return;
        }
        setStatus("error");
        setError(
          body?.error || "Email or password is incorrect",
        );
        return;
      }

      // Success — navigate to dashboard
      router.push("/dashboard");
    } catch (err) {
      setStatus("error");
      const msg = err?.message || "";
      setError(
        msg.toLowerCase().includes("fetch")
          ? "Cannot reach the server. Make sure the app is running and try again."
          : "Network error. Please try again.",
      );
    }
  }

  // ── Magic link send (existing OTP flow) ──
  async function handleMagicSubmit(e) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (body?.notRegistered) {
          setStatus("not_registered");
          return;
        }
        setStatus("error");
        setError(body?.error || "Failed to send login link");
        return;
      }

      setSentEmail(email.trim());
      setStatus("success");
    } catch (err) {
      setStatus("error");
      const msg = err?.message || "";
      setError(
        msg.toLowerCase().includes("fetch")
          ? "Cannot reach the server. Make sure the app is running and try again."
          : "Network error. Please try again.",
      );
    }
  }

  // ── Forgot password — send reset email ──
  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setError(body?.error || "Something went wrong. Try again later.");
        return;
      }

      setSentEmail(email.trim());
      setStatus("password_reset_sent");
    } catch (err) {
      setStatus("error");
      const msg = err?.message || "";
      setError(
        msg.toLowerCase().includes("fetch")
          ? "Cannot reach the server. Make sure the app is running and try again."
          : "Network error. Please try again.",
      );
    }
  }

  // ── Shared: Email not registered screen ──
  if (status === "not_registered") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 md:p-10">
            <div className="text-center space-y-5" role="alert" aria-live="assertive">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "var(--warning-muted)" }}
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: "var(--warning)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-sora font-semibold text-lg text-text-primary mb-1">
                  Email not registered
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  <span className="text-text-primary font-medium">
                    {email.trim()}
                  </span>{" "}
                  hasn&apos;t been added to the portal yet.
                  <br />
                  Please contact the admin through the form on the home page and
                  they&apos;ll get you set up.
                </p>
              </div>

              <div className="border-t border-border/50" role="separator" />

              <div className="flex flex-col gap-3">
                <Link
                  href="/#contact"
                  aria-label="Go to the LancerLink contact form to request portal access"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-primary/20"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  Go to Contact Form
                </Link>

                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="Try a different email address"
                  className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  Try a different email
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Shared: Magic link sent ──
  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 md:p-10">
            <div
              className="text-center space-y-4"
              role="status"
              aria-live="polite"
              aria-label="Magic link sent successfully"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "var(--success-muted)" }}
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: "var(--success)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h2 className="font-sora font-semibold text-lg text-text-primary">
                Check your email
              </h2>
              <p className="text-sm text-text-secondary">
                We sent a link to{" "}
                <span className="text-text-primary font-medium">
                  {sentEmail}
                </span>
              </p>
              <p className="text-xs text-text-muted">
                The link expires in 1 hour. Access is invite-only — your project
                manager must add your email to the portal.
              </p>
              <button
                type="button"
                onClick={resetForm}
                aria-label="Use a different email address"
                className="text-sm text-accent hover:underline cursor-pointer"
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Shared: Password reset sent ──
  if (status === "password_reset_sent") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 md:p-10">
            <div
              className="text-center space-y-4"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "var(--success-muted)" }}
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: "var(--success)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h2 className="font-sora font-semibold text-lg text-text-primary">
                Check your email for a password reset link
              </h2>
              <p className="text-sm text-text-secondary">
                If an account exists for{" "}
                <span className="text-text-primary font-medium">
                  {sentEmail}
                </span>
                , you&apos;ll receive a reset link shortly.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-accent hover:underline cursor-pointer"
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Main form (idle / error / loading) ──
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <p
              className="font-sora font-bold text-xl gradient-text mb-2"
              aria-label="LancerLink"
            >
              LancerLink
            </p>
            <p className="text-text-muted text-sm">
              {mode === "password"
                ? "Sign in with your email and password"
                : "Sign in with a magic link sent to your email"}
            </p>
          </div>

          {/* ── Password form (default) ── */}
          {mode === "password" && (
            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  placeholder="you@company.com"
                  aria-describedby={error ? "login-error" : undefined}
                  className="input-field disabled:opacity-60"
                  style={{ fontSize: "16px" }}
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "loading"}
                  placeholder="Enter your password"
                  aria-describedby={error ? "login-error" : undefined}
                  className="input-field disabled:opacity-60"
                  style={{ fontSize: "16px" }}
                />
              </div>

              {error && (
                <p
                  id="login-error"
                  className="text-sm text-error"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !email.trim() || !password}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Signing in…" : "Sign In"}
              </button>

              <div className="flex flex-col items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={status === "loading"}
                  className="text-sm text-accent hover:underline cursor-pointer disabled:opacity-50"
                >
                  Forgot password?
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("magic");
                    resetForm();
                  }}
                  className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  Sign in with a magic link instead
                </button>
              </div>
            </form>
          )}

          {/* ── Magic link form (toggle) ── */}
          {mode === "magic" && (
            <form
              onSubmit={handleMagicSubmit}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="login-email-magic"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Email address
                </label>
                <input
                  id="login-email-magic"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  placeholder="you@company.com"
                  aria-describedby={error ? "login-error" : undefined}
                  className="input-field disabled:opacity-60"
                  style={{ fontSize: "16px" }}
                />
              </div>

              {error && (
                <p
                  id="login-error"
                  className="text-sm text-error"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending…" : "Send login link"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("password");
                    resetForm();
                  }}
                  className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  Sign in with password instead
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
