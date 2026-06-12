"use client";

import { useState, useRef, useEffect, startTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

function emailInitials(email) {
  const local = (email || "").split("@")[0] || "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return local.slice(0, 1).toUpperCase() || "?";
}

const NAV_LINKS = [
  { label: "Overview", href: "/dashboard", clientOnly: true },
  { label: "Projects", hrefAdmin: "/dashboard/admin", hrefClient: "/dashboard" },
  { label: "Invoices", href: "/dashboard/invoices" },
  { label: "Files", href: "/dashboard/files" },
  { label: "Messages", href: "/dashboard/messages" },
];

/**
 * @param {object} props
 * @param {string} props.userEmail
 * @param {'client'|'admin'} props.role
 */
export default function DashboardTopNav({ userEmail, role }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = role === "admin";
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const avatarRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    startTransition(() => { setMobileNavOpen(false); });
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  function isActive(href) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/admin") {
      return pathname.startsWith("/dashboard/admin");
    }
    return pathname.startsWith(href);
  }

  function linkHref(item) {
    if (item.label === "Projects") {
      return isAdmin ? item.hrefAdmin : item.hrefClient;
    }
    if (item.clientOnly && isAdmin) return "/dashboard/admin";
    return item.href;
  }

  const navItems = NAV_LINKS.filter((item) => !(item.clientOnly && isAdmin));

  const logoHref = isAdmin ? "/dashboard/admin" : "/dashboard";

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-primary)",
        backdropFilter: "blur(8px)",
        /* Account for Android notch / status bar */
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div
        className="max-w-[1280px] mx-auto px-4 flex items-center justify-between gap-4"
        style={{ height: 52 }}
      >
        <Link href={logoHref} className="flex items-center gap-2 shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect
              width="20"
              height="20"
              rx="5"
              fill="var(--color-brand)"
            />
          </svg>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-primary)",
            }}
          >
            LancerLink
          </span>
        </Link>

        {/* Desktop / tablet nav links — visible from md (768px) up */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto">
          {navItems.map((item) => {
            const href = linkHref(item);
            const active = isActive(href);
            return (
              <Link
                key={item.label}
                href={href}
                className="transition whitespace-nowrap"
                style={{
                  /* Slightly tighter padding on tablet to fit all items */
                  fontSize: 13,
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  fontWeight: active ? 500 : 400,
                  background: active ? "var(--color-bg-secondary)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--color-bg-tertiary)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile hamburger — visible below md */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md cursor-pointer"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((o) => !o)}
            style={{ color: "var(--color-text-primary)" }}
          >
            {mobileNavOpen ? (
              /* X icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Admin "New project" CTA — icon-only on xs, text on sm+ */}
          {isAdmin && (
            <Link
              href="/dashboard/admin?tab=add"
              className="hidden sm:inline-flex items-center transition"
              style={{
                background: "var(--color-brand)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              + New project
            </Link>
          )}

          {/* Avatar / account menu */}
          <div className="relative" ref={avatarRef}>
            <button
              type="button"
              onClick={() => setAvatarOpen((o) => !o)}
              className="rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: 28,
                height: 28,
                background: "var(--color-brand-soft)",
                color: "var(--color-brand-text)",
                fontSize: 11,
                fontWeight: 500,
              }}
              aria-label="Account menu"
            >
              {emailInitials(userEmail)}
            </button>
            {avatarOpen && (
              <div
                className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-md shadow-lg z-50"
                style={{
                  background: "var(--color-bg-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Link
                  href={logoHref}
                  className="block px-3 py-2 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                  onClick={() => setAvatarOpen(false)}
                >
                  Profile
                </Link>
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Theme
                  </span>
                  <ThemeToggle />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-3 py-2 text-sm cursor-pointer disabled:opacity-50"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {loggingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown — slides down below the header */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: mobileNavOpen ? "400px" : "0px",
          opacity: mobileNavOpen ? 1 : 0,
        }}
      >
        <nav
          className="border-t px-4 py-3 flex flex-col gap-1 overflow-y-auto"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg-primary)",
            maxHeight: "60dvh",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {navItems.map((item) => {
            const href = linkHref(item);
            const active = isActive(href);
            return (
              <Link
                key={item.label}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  fontSize: 14,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  fontWeight: active ? 500 : 400,
                  background: active ? "var(--color-bg-secondary)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          {/* Show "New project" in mobile menu for admin */}
          {isAdmin && (
            <Link
              href="/dashboard/admin?tab=add"
              onClick={() => setMobileNavOpen(false)}
              className="mt-2 flex items-center justify-center"
              style={{
                background: "var(--color-brand)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
              }}
            >
              + New project
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
