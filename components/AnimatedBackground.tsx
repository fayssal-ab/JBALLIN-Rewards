import type { CSSProperties } from "react";

// "Pure CSS Parallax Pixel Stars" (the classic CodePen effect, ported from
// its original Sass `multiple-box-shadow($n)` random-position generator).
// Three star sizes drift downward at different speeds via the same
// `animStar` keyframe (see globals.css) for a parallax-depth illusion.
// Counts are toned down from the original 700/200/100 to keep the
// generated box-shadow list (and thus HTML payload) reasonable.
function multipleBoxShadow(n: number, maxCoord = 2000): string {
  const shadows: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.floor(Math.random() * maxCoord);
    const y = Math.floor(Math.random() * maxCoord);
    shadows.push(`${x}px ${y}px #FFF`);
  }
  return shadows.join(",");
}

export function AnimatedBackground() {
  const shadowsSmall = multipleBoxShadow(400);
  const shadowsMedium = multipleBoxShadow(150);
  const shadowsBig = multipleBoxShadow(80);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b0b0e]">
      <div className="animate-float-a absolute left-[10%] top-[8%] h-80 w-80 rounded-full bg-emerald-500/[0.07] blur-[110px]" />
      <div className="animate-float-b absolute right-[8%] top-[30%] h-96 w-96 rounded-full bg-white/[0.04] blur-[130px]" />
      <div className="animate-float-c absolute left-[30%] bottom-[5%] h-80 w-80 rounded-full bg-emerald-400/[0.05] blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_60%)]" />

      <div
        id="stars"
        style={{ "--shadows-small": shadowsSmall } as CSSProperties}
      />
      <div
        id="stars2"
        style={{ "--shadows-medium": shadowsMedium } as CSSProperties}
      />
      <div
        id="stars3"
        style={{ "--shadows-big": shadowsBig } as CSSProperties}
      />

      {/* 3D perspective grid floor, room-corner style */}
      <div className="grid-floor-wrap">
        <div className="grid-floor-horizon" />
        <div className="grid-floor" />
      </div>
    </div>
  );
}
