import { useEffect, useMemo, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  el?: HTMLDivElement | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createDots(count: number): Dot[] {
  const dots: Dot[] = [];
  const minDist = 42;
  let guard = 0;
  while (dots.length < count && guard++ < count * 250) {
    const r = rand(1.9, 3.6);
    const candidate: Dot = {
      x: rand(0.06, 0.94),
      y: rand(0.06, 0.94),
      vx: rand(-0.00018, 0.00018),
      vy: rand(-0.00018, 0.00018),
      r,
      a: clamp(0.18 + (r - 1.9) * 0.07, 0.18, 0.35),
    };
    const ok = dots.every((d) => {
      const dx = (d.x - candidate.x) * 1000;
      const dy = (d.y - candidate.y) * 1000;
      return dx * dx + dy * dy > minDist * minDist;
    });
    if (ok) dots.push(candidate);
  }
  return dots;
}

/**
 * Ambient green dots with subtle drift + cursor/touch avoidance.
 * Rendered behind the app shell (pointer-events: none).
 */
export function BackgroundDots({
  count = 18,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dots = useMemo(() => createDots(count), [count]);

  const cursor = useRef<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLDivElement>("[data-dot]"));
    els.forEach((el, i) => {
      dots[i].el = el;
    });

    let raf = 0;
    let lastT = performance.now();
    const tick = (t: number) => {
      const dt = clamp(t - lastT, 8, 48);
      lastT = t;

      const c = cursor.current;
      const repel = c.active ? 0.0009 : 0.00025;
      const radius = c.active ? 0.14 : 0.11;
      const ease = 0.98;

      for (const d of dots) {
        // drift
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        // soft bounce
        if (d.x < 0.03 || d.x > 0.97) d.vx *= -1;
        if (d.y < 0.03 || d.y > 0.97) d.vy *= -1;
        d.x = clamp(d.x, 0.03, 0.97);
        d.y = clamp(d.y, 0.03, 0.97);

        // cursor avoidance
        const dx = d.x - c.x;
        const dy = d.y - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < radius) {
          const strength = (1 - dist / radius) ** 2;
          d.vx += (dx / dist) * repel * strength * dt;
          d.vy += (dy / dist) * repel * strength * dt;
        }

        // gentle damping
        d.vx *= ease;
        d.vy *= ease;

        // apply
        if (d.el) {
          d.el.style.transform = `translate3d(${(d.x * 100).toFixed(3)}%, ${(d.y * 100).toFixed(3)}%, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dots]);

  useEffect(() => {
    const update = (clientX: number, clientY: number) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      cursor.current.x = clamp((clientX - rect.left) / rect.width, 0, 1);
      cursor.current.y = clamp((clientY - rect.top) / rect.height, 0, 1);
      cursor.current.active = true;
    };

    const onMove = (e: PointerEvent) => update(e.clientX, e.clientY);
    const onLeave = () => {
      cursor.current.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden
    >
      {/* soft vignette behind the dots */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 95% at 50% 0%, rgba(29,185,84,0.12) 0%, rgba(0,0,0,0.00) 44%), radial-gradient(130% 110% at 50% 110%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 58%)",
        }}
      />
      {/* a few big soft dots so effect is visible on black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(14rem 14rem at 14% 18%, rgba(29,185,84,0.10), rgba(0,0,0,0) 60%), radial-gradient(16rem 16rem at 86% 22%, rgba(29,185,84,0.08), rgba(0,0,0,0) 62%), radial-gradient(18rem 18rem at 24% 84%, rgba(29,185,84,0.06), rgba(0,0,0,0) 64%), radial-gradient(16rem 16rem at 80% 78%, rgba(29,185,84,0.07), rgba(0,0,0,0) 64%)",
          filter: "blur(0.5px)",
        }}
      />
      {dots.map((d, i) => (
        <div
          key={i}
          data-dot
          className="absolute left-0 top-0 rounded-full"
          style={{
            width: d.r * 2,
            height: d.r * 2,
            backgroundColor: "#1DB954",
            opacity: d.a,
            filter:
              "blur(0.9px) drop-shadow(0 0 10px rgba(29,185,84,0.35)) drop-shadow(0 0 22px rgba(29,185,84,0.18))",
            transform: `translate3d(${(d.x * 100).toFixed(3)}%, ${(d.y * 100).toFixed(3)}%, 0)`,
          }}
        />
      ))}
    </div>
  );
}

