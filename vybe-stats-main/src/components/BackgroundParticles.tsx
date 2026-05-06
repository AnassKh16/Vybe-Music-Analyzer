import { useEffect, useMemo, useRef, useState } from "react";
import { getVybeSettings, subscribeVybeSettings } from "../lib/settingsStore";

type Particle = {
  x: number; // px
  y: number; // px
  hx: number; // home x
  hy: number; // home y
  vx: number; // px/ms
  vy: number; // px/ms
  r: number; // px
  a: number; // alpha
  phase: number;
  amp: number; // px
  freq: number; // rad/ms
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createParticles(count: number, w: number, h: number) {
  const particles: Particle[] = [];
  const minDist = Math.min(w, h) * 0.07; // avoid obvious clusters
  let guard = 0;
  while (particles.length < count && guard++ < count * 400) {
    const r = rand(1.6, 4.8);
    const x = rand(w * 0.06, w * 0.94);
    const y = rand(h * 0.06, h * 0.94);
    const p: Particle = {
      x,
      y,
      hx: x,
      hy: y,
      // much slower drift; spring will keep them near home
      vx: rand(-0.006, 0.006), // ~6px/s
      vy: rand(-0.006, 0.006),
      r,
      a: clamp(0.10 + (r / 6) * 0.18, 0.10, 0.32),
      phase: rand(0, Math.PI * 2),
      amp: rand(2.5, 7.5),
      freq: rand(0.00045, 0.00105), // ~0.45–1.05 rad/s
    };
    const ok = particles.every((q) => {
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      return dx * dx + dy * dy > minDist * minDist;
    });
    if (ok) particles.push(p);
  }
  return particles;
}

/**
 * Canvas particle background (Stitch-like): soft glow, drift, and pointer repulsion.
 * Render behind the app shell (pointer-events: none).
 */
export function BackgroundParticles({
  className = "",
  density = 0.000045, // particles per px^2 (tuned for ~390px shell)
  accentRgb = "29,185,84",
  forceVisible = false,
}: {
  className?: string;
  density?: number;
  accentRgb?: string;
  forceVisible?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [bgOn, setBgOn] = useState(true);

  const pointer = useRef({ x: 0, y: 0, active: false });
  const parallax = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setBgOn(getVybeSettings().backgroundEffects);
    return subscribeVybeSettings(() => setBgOn(getVybeSettings().backgroundEffects));
  }, []);

  const settings = useMemo(
    () => ({
      green: accentRgb,
      repelRadiusPx: 120,
      repelStrength: 0.08, // gentler impulse
      driftDamping: 0.988,
      homeSpring: 0.00022, // pulls back to home position
      homeDamp: 0.0065, // critical-ish damping (per ms)
      maxSpeed: 0.03, // px/ms (~30px/s)
      edgePad: 18,
    }),
    [accentRgb]
  );

  useEffect(() => {
    if (!bgOn) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = clamp(Math.round(w * h * density), 14, 44);
      particles = createParticles(count, w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    let raf = 0;
    let last = performance.now();

    const draw = (t: number) => {
      const dt = clamp(t - last, 8, 40);
      last = t;

      // clear
      ctx.clearRect(0, 0, w, h);

      // background wash (tinted to current accent color)
      const g1 = ctx.createRadialGradient(w * 0.5, h * 0.1, 20, w * 0.5, h * 0.1, Math.max(w, h) * 0.9);
      g1.addColorStop(0, `rgba(${settings.green},0.10)`);
      g1.addColorStop(0.42, `rgba(${settings.green},0.03)`);
      g1.addColorStop(0.78, "rgba(0,0,0,0.02)");
      g1.addColorStop(1, "rgba(0,0,0,0.18)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // update pointer parallax smoothing
      const pr = parallax.current;
      pr.x *= 0.92;
      pr.y *= 0.92;

      const p = pointer.current;
      const r = settings.repelRadiusPx;
      const r2 = r * r;

      for (const dot of particles) {
        // tiny idle float around home (keeps it alive, not static)
        const fx = Math.sin(t * dot.freq + dot.phase) * dot.amp;
        const fy = Math.cos(t * dot.freq * 0.92 + dot.phase * 1.3) * dot.amp * 0.75;
        const homeX = dot.hx + fx;
        const homeY = dot.hy + fy;

        // spring back to home (keeps particles from scattering forever)
        const hx = homeX - dot.x;
        const hy = homeY - dot.y;
        // spring-damper (prevents jitter/oscillation)
        dot.vx += hx * settings.homeSpring * dt - dot.vx * settings.homeDamp * dt;
        dot.vy += hy * settings.homeSpring * dt - dot.vy * settings.homeDamp * dt;

        // bounce inside bounds
        const pad = settings.edgePad;
        if (dot.x < pad || dot.x > w - pad) dot.vx *= -1;
        if (dot.y < pad || dot.y > h - pad) dot.vy *= -1;

        // repulsion
        if (p.active) {
          const dx = dot.x - p.x;
          const dy = dot.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0.0001 && d2 < r2) {
            const d = Math.sqrt(d2);
            const strength = (1 - d / r) ** 2;
            const nx = dx / d;
            const ny = dy / d;
            const impulse = settings.repelStrength * strength * (dt / 16);
            dot.vx += nx * impulse;
            dot.vy += ny * impulse;
          }
        }

        // damping
        dot.vx *= settings.driftDamping;
        dot.vy *= settings.driftDamping;

        // cap speed
        dot.vx = clamp(dot.vx, -settings.maxSpeed, settings.maxSpeed);
        dot.vy = clamp(dot.vy, -settings.maxSpeed, settings.maxSpeed);

        // integrate
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;
        dot.x = clamp(dot.x, pad, w - pad);
        dot.y = clamp(dot.y, pad, h - pad);

        // draw (with subtle parallax offset)
        const ox = pr.x * 10;
        const oy = pr.y * 10;
        const x = dot.x + ox;
        const y = dot.y + oy;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${settings.green},${dot.a})`;
        ctx.shadowColor = `rgba(${settings.green},0.26)`;
        ctx.shadowBlur = 14;
        ctx.arc(x, y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // vignette (keeps it "behind", but not hiding particles)
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.6, Math.min(w, h) * 0.1, w * 0.5, h * 0.6, Math.max(w, h) * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(0.6, "rgba(0,0,0,0.25)");
      vg.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.shadowBlur = 0;
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [bgOn, density, settings]);

  useEffect(() => {
    const update = (clientX: number, clientY: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      pointer.current.x = clamp(clientX - rect.left, 0, rect.width);
      pointer.current.y = clamp(clientY - rect.top, 0, rect.height);
      pointer.current.active = true;

      // parallax target (normalized)
      const nx = (pointer.current.x / rect.width - 0.5) * 2;
      const ny = (pointer.current.y / rect.height - 0.5) * 2;
      parallax.current.x += nx * 0.08;
      parallax.current.y += ny * 0.08;
    };

    const onMove = (e: PointerEvent) => update(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => update(e.clientX, e.clientY);
    const onLeave = () => {
      pointer.current.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  if (!forceVisible && !bgOn) return null;

  return (
    <div ref={wrapperRef} className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

