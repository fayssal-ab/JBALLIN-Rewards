import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Baked-in-text mascot avatar (see public/og/logo.png — a real PNG copy of
// the site's public/logo.png, which is actually WebP despite the
// extension; satori/resvg doesn't reliably rasterize WebP).
function logoDataUri(): string {
  const bytes = readFileSync(join(process.cwd(), "public/og/logo.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

const DOTS = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 137) % 1200,
  y: (i * 71 + (i % 5) * 60) % 630,
  r: (i % 3) + 1,
}));

export default function OpengraphImage() {
  const logo = logoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "radial-gradient(circle at 30% 40%, #12291f 0%, #0b0b0e 65%)",
        }}
      >
        {DOTS.map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: d.y,
              width: d.r,
              height: d.r,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
              display: "flex",
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            top: 48,
            left: 64,
            right: 64,
            height: 2,
            background: "linear-gradient(90deg, transparent, #34d399, transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 64,
            right: 64,
            height: 2,
            background: "linear-gradient(90deg, transparent, #34d399, transparent)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: "100%",
            padding: "0 90px",
            gap: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(52,211,153,0.35) 0%, rgba(52,211,153,0) 70%)",
              flexShrink: 0,
            }}
          >
            <img
              src={logo}
              width={300}
              height={300}
              style={{
                borderRadius: "50%",
                border: "6px solid rgba(52,211,153,0.7)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: 610 }}>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: 10,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
              }}
            >
              Welcome to
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                fontWeight: 900,
                letterSpacing: 2,
                color: "#ffffff",
                textTransform: "uppercase",
                lineHeight: 1,
                marginTop: 12,
              }}
            >
              JBALLIN
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                fontWeight: 900,
                letterSpacing: 2,
                color: "#34d399",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              REWARDS
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 27,
                color: "rgba(255,255,255,0.65)",
              }}
            >
              Sign up under code JBALLIN on Rainbet — climb the leaderboard
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
