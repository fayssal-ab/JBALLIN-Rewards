import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

// Site-wide decorative layer (rendered once from AnimatedBackground, fixed
// to the viewport like the starfield) — drop PNGs into public/particles/
// named to match `src` below and they show up automatically. Half drift
// around on a wide diagonal path, half stay put with just a soft glow —
// a mix of moving and fixed, not everything animated at once.
const PARTICLES = [
  { src: "/particles/particle-1.png", top: "8%", left: "5%", size: 104, drift: 1, duration: 22, delay: 0 },
  { src: "/particles/particle-2.png", top: "14%", left: "88%", size: 88, drift: 2, duration: 26, delay: 3 },
  { src: "/particles/particle-3.png", top: "46%", left: "3%", size: 78, drift: null },
  { src: "/particles/particle-4.png", top: "58%", left: "93%", size: 82, drift: null },
  { src: "/particles/particle-5.png", top: "84%", left: "8%", size: 96, drift: 3, duration: 24, delay: 5 },
  { src: "/particles/particle-6.png", top: "88%", left: "84%", size: 100, drift: 4, duration: 20, delay: 2 },
] as const;

function particleExists(src: string): boolean {
  return existsSync(join(process.cwd(), "public", src));
}

export function FloatingParticles() {
  const particles = PARTICLES.filter((p) => particleExists(p.src));

  // Absolute, not fixed — the parent (AnimatedBackground) is already a
  // fixed, full-viewport, overflow-hidden layer; this just fills it.
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.src}
          className={p.drift ? "animate-particle-drift absolute" : "absolute"}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationName: p.drift ? `particle-drift-${p.drift}` : undefined,
            animationDuration: p.drift ? `${p.duration}s` : undefined,
            animationDelay: p.drift ? `${p.delay}s` : undefined,
          }}
        >
          <div className="animate-glow-pulse h-full w-full overflow-hidden rounded-2xl border border-emerald-400/15 bg-white/[0.03] p-2 backdrop-blur-sm">
            <div className="relative h-full w-full">
              <Image src={p.src} alt="" fill sizes={`${p.size}px`} className="object-contain" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
