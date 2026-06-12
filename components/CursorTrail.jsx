"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring } from "motion/react";

const DOT_SIZE = 9; // px
const RING_SIZE = 26; // px
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, .cursor-pointer, [role="button"]';

/**
 * CursorTrail — Optimized "Magnetic Blend"
 *
 * - Dot: 6px solid brand circle at cursor, scales down to 0 on hover
 * - Ring: 26px solid brand border, scales to 1.6x on hover with brand fill
 * - Opacity: smooth visibility fade in/out when entering/leaving document viewport
 * - Zero React re-renders: position, scales, and opacity powered entirely by Framer Motion springs
 */
export default function CursorTrail() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // ── Motion Values & Springs ─────────────────────────────────────
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Position spring for elegant fluid trailing
  const ringX = useSpring(cursorX, { stiffness: 160, damping: 22 });
  const ringY = useSpring(cursorY, { stiffness: 160, damping: 22 });

  // Interactive springs
  const targetRingScale = useMotionValue(1);
  const ringScale = useSpring(targetRingScale, { stiffness: 300, damping: 25 });

  const targetRingOpacity = useMotionValue(0.4);
  const ringOpacity = useSpring(targetRingOpacity, { stiffness: 300, damping: 25 });

  const targetRingBgOpacity = useMotionValue(0);
  const ringBgOpacity = useSpring(targetRingBgOpacity, { stiffness: 300, damping: 25 });

  const targetDotScale = useMotionValue(1);
  const dotScale = useSpring(targetDotScale, { stiffness: 300, damping: 25 });

  const targetVisibility = useMotionValue(0);
  const cursorOpacity = useSpring(targetVisibility, { stiffness: 250, damping: 25 });

  // ── Refs for event coordination ─────────────────────────────────
  const isHoveringRef = useRef(false);
  const isPressedRef = useRef(false);

  // ── Guard conditions ────────────────────────────────────────────
  const isDashboard = pathname?.startsWith("/dashboard");
  const isMobile =
    typeof window !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  const disabled = isDashboard || isMobile;

  // ── Event listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (disabled) return;

    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      // Fade cursor in on first mouse move
      if (targetVisibility.get() === 0) {
        targetVisibility.set(1);
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target.closest(INTERACTIVE_SELECTOR);
      if (target) {
        isHoveringRef.current = true;
        if (!isPressedRef.current) {
          targetRingScale.set(1.6);
          targetRingOpacity.set(1.0);
          targetRingBgOpacity.set(0.08);
          targetDotScale.set(0);
        }
      } else {
        isHoveringRef.current = false;
        if (!isPressedRef.current) {
          targetRingScale.set(1.0);
          targetRingOpacity.set(0.4);
          targetRingBgOpacity.set(0);
          targetDotScale.set(1.0);
        }
      }
    };

    const handleMouseDown = () => {
      isPressedRef.current = true;
      targetRingScale.set(0.65);
      targetRingOpacity.set(0.8);
      targetRingBgOpacity.set(0.15);
      targetDotScale.set(0.65);
    };

    const handleMouseUp = () => {
      isPressedRef.current = false;
      if (isHoveringRef.current) {
        targetRingScale.set(1.6);
        targetRingOpacity.set(1.0);
        targetRingBgOpacity.set(0.08);
        targetDotScale.set(0);
      } else {
        targetRingScale.set(1.0);
        targetRingOpacity.set(0.4);
        targetRingBgOpacity.set(0);
        targetDotScale.set(1.0);
      }
    };

    const handleMouseLeave = () => {
      targetVisibility.set(0);
    };

    const handleMouseEnter = () => {
      targetVisibility.set(1);
    };

    document.body.classList.add('custom-cursor-active');

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, true);
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true });

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver, true);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [
    disabled,
    cursorX,
    cursorY,
    targetRingScale,
    targetRingOpacity,
    targetRingBgOpacity,
    targetDotScale,
    targetVisibility,
  ]);

  if (!mounted || disabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
      style={{ opacity: cursorOpacity }}
    >
      {/* ── Ring ── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none"
        style={{ x: ringX, y: ringY, scale: ringScale }}
      >
        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
          style={{
            width: RING_SIZE,
            height: RING_SIZE,
            border: "1.5px solid var(--color-brand)",
            opacity: ringOpacity,
            willChange: "transform",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "var(--color-brand)",
              opacity: ringBgOpacity,
            }}
          />
        </motion.div>
      </motion.div>

      {/* ── Dot ── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none"
        style={{ x: cursorX, y: cursorY, scale: dotScale }}
      >
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            background: "var(--color-brand)",
            willChange: "transform",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
