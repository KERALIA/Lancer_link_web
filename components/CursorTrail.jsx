"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function CursorTrail() {
  const pathname = usePathname();
  const circlesRef = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });
  const circles = useRef(Array.from({ length: 12 }, () => ({ x: 0, y: 0 })));

  const colors = [
    "var(--color-brand)",
    "#4338ca",
    "#3730a3",
    "#312e81",
    "#1e1b4b",
  ];

  // Disable on dashboard pages AND on touch/pointer-coarse devices (Android, tablets)
  const isDashboard = pathname?.startsWith("/dashboard");
  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  const disabled = isDashboard || isTouchDevice;

  useEffect(() => {
    if (disabled) return;
    // Hide horizontal overflow on the body to prevent scrolling issues
    document.body.style.overflowX = "hidden";

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId;
    const animate = () => {
      let nextX = mouse.current.x;
      let nextY = mouse.current.y;

      circlesRef.current.forEach((circleEl, index) => {
        if (!circleEl) return;

        const circleState = circles.current[index];

        // Easing formula
        circleState.x += (nextX - circleState.x) * 0.65;
        circleState.y += (nextY - circleState.y) * 0.65;

        // Offset by half the width/height (12px) to center the cursor exactly
        const scale = (12 - index) / 12;
        circleEl.style.transform = `translate(${circleState.x - 12}px, ${circleState.y - 12}px) scale(${scale})`;

        // The current circle becomes the target for the next one
        nextX = circleState.x;
        nextY = circleState.y;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      document.body.style.overflowX = "auto";
    };
  }, [disabled]);

  if (disabled) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) circlesRef.current[index] = el;
          }}
          className="pointer-events-none fixed top-0 left-0 rounded-full"
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: colors[index % colors.length],
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
