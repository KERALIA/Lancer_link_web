'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * NavBar — Site navigation with theme toggle.
 * This is a Client Component so it can render the ThemeToggle.
 */
export default function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-sora font-bold text-xl gradient-text">
          LancerLink
        </Link>

        {/* Desktop nav links + controls */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#services"
            className="text-text-secondary hover:text-text-primary transition text-sm"
          >
            Services
          </a>
          <a
            href="#portfolio"
            className="text-text-secondary hover:text-text-primary transition text-sm"
          >
            Portfolio
          </a>
          <a
            href="#contact"
            className="text-text-secondary hover:text-text-primary transition text-sm"
          >
            Contact
          </a>

          {/* Theme toggle sits right before the CTA button */}
          <ThemeToggle />

          <Link
            href="/dashboard"
            className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Client Portal
          </Link>
        </div>

        {/* Mobile: show toggle + portal button */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-2 rounded-lg transition"
          >
            Portal
          </Link>
        </div>
      </div>
    </nav>
  );
}
