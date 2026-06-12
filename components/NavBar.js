'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * NavBar — Site navigation with theme toggle and a full mobile hamburger menu
 * so all landing page links are accessible on Android/mobile.
 */
export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on outside tap
  useEffect(() => {
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [mobileOpen]);

  const navLinks = [
    { href: '#services', label: 'Services' },
    { href: '#portfolio', label: 'Portfolio' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <nav
      ref={menuRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-sora font-bold text-xl gradient-text">
          LancerLink
        </Link>

        {/* Desktop nav links + controls */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="navbar-link">
              {link.label}
            </a>
          ))}

          <ThemeToggle />

          <Link href="/dashboard" className="navbar-cta-btn">
            Client Portal
          </Link>
        </div>

        {/* Mobile: hamburger + portal button */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <Link href="/dashboard" className="navbar-cta-btn-sm">
            Portal
          </Link>
          {/* Hamburger button */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="flex flex-col justify-center items-center w-10 h-10 rounded-lg border border-border/60 bg-surface/60 transition hover:bg-surface-hover cursor-pointer"
          >
            <span
              className="block w-5 h-0.5 bg-text-primary transition-transform duration-300 rounded-full"
              style={{ transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none' }}
            />
            <span
              className="block w-5 h-0.5 bg-text-primary my-1 rounded-full transition-opacity duration-300"
              style={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="block w-5 h-0.5 bg-text-primary transition-transform duration-300 rounded-full"
              style={{ transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: mobileOpen ? '280px' : '0px',
          opacity: mobileOpen ? 1 : 0,
        }}
      >
        <div
          className="px-6 pb-5 pt-2 flex flex-col gap-1 border-t border-border/50"
          style={{ background: 'var(--background)', paddingBottom: 'calc(1.25rem + var(--safe-bottom, 0px))' }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="navbar-mobile-link"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 pt-3 border-t border-border/40">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-xl transition text-sm"
            >
              Client Portal
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
