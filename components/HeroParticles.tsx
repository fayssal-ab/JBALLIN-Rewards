import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

// Drop small PNGs into public/particles/ named to match `src` below and
// they'll appear here automatically. Scoped to (and absolutely positioned
// within) the hero section only — NOT fixed to the viewport — so they
// scroll away with the hero instead of drifting on top of every section
// below it.
const PARTICLES = [
  { src: "/particles/particle-1.png", top: "10%", left: "6%", size: 112, duration: 16, delay: 0 },
  { src: "/particles/particle-2.png", top: "16%", left: "82%", size: 96, duration: 20, delay: 2 },
  { src: "/particles/particle-5.png", top: "70%", left: "10%", size: 100, duration: 22, delay: 4 },
  { src: "/particles/particle-6.png", top: "74%", left: "80%", size: 104, duration: 17, delay: 1.5 },
];

function particleExists(src: string): boolean {
  return existsSync(join(process.cwd(), "public", src));
}

export function HeroParticles() {
  const particles = PARTICLES.filter((p) => particleExists(p.src));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={p.src}
          className="animate-particle-drift absolute"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationName: i % 2 === 0 ? "particle-drift-a" : "particle-drift-b",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div className="animate-glow-pulse h-full w-full overflow-hidden rounded-2xl border border-emerald-400/15 bg-white/[0.03] p-2 backdrop-blur-sm">
            <div className="relative h-full w-full">
              <Image
                src={p.src}
                alt=""
                fill
                sizes={`${p.size}px`}
                priority
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
