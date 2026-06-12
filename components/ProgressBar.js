'use client';

import { useState, useEffect } from 'react';

/**
 * ProgressBar — Animated track with a gradient fill, a large percentage readout,
 * and milestone indicators (Design, Development, Testing).
 *
 * @param {number}  percent  — 0-100 target value
 * @param {boolean} animate  — whether to animate from 0 on mount (default true)
 */
export default function ProgressBar({ percent = 0, animate = true }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!animate) return;

    // Kick off animation on next frame so the browser paints the 0-width bar first
    const raf = requestAnimationFrame(() => {
      setAnimatedValue(percent);
    });

    return () => cancelAnimationFrame(raf);
  }, [percent, animate]);

  const displayed = animate ? animatedValue : percent;

  return (
    <div className="space-y-4">
      {/* ── Large percentage readout ── */}
      <p className="text-4xl font-bold font-sora gradient-text">
        {Math.round(displayed)}%
      </p>

      {/* ── Track + Fill ── */}
      <div className="progress-track h-3">
        <div
          className="progress-fill"
          style={{ width: `${displayed}%` }}
        />
      </div>

      {/* ── Milestone indicators ── */}
      <div className="flex items-center gap-6 text-xs font-medium mt-2">
        {/* Design — completed */}
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success inline-block" />
          <span className="text-text-secondary">Design ✓</span>
        </span>

        {/* Development — in progress */}
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning inline-block" />
          <span className="text-text-secondary">Development ◑</span>
        </span>

        {/* Testing — not started */}
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-muted inline-block" />
          <span className="text-text-muted">Testing ○</span>
        </span>
      </div>
    </div>
  );
}
