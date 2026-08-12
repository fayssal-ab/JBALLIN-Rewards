import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 0%, #12291f 0%, #0b0b0e 60%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            right: 80,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #34d399, transparent)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 12,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
          }}
        >
          Welcome to
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 148,
            fontWeight: 900,
            letterSpacing: 6,
            color: "#ffffff",
            textTransform: "uppercase",
            lineHeight: 1,
            marginTop: 20,
          }}
        >
          JBALLIN
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 148,
            fontWeight: 900,
            letterSpacing: 6,
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
            marginTop: 40,
            fontSize: 30,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          Sign up under code JBALLIN on Rainbet — climb the leaderboard
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            right: 80,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #34d399, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
