import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getActivePeriod, getLiveEntries, type LiveEntry } from "@/lib/periods";
import { maskUsername } from "@/lib/mask";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Baked-in-text mascot avatar (see public/og/logo.png — a real PNG copy of
// the site's public/logo.png, which is actually WebP despite the
// extension; satori/resvg doesn't reliably rasterize WebP).
function logoDataUri(): string {
  const bytes = readFileSync(join(process.cwd(), "public/og/logo.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

const DOTS = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 137) % 1200,
  y: (i * 71 + (i % 5) * 60) % 630,
  r: (i % 3) + 1,
}));

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Frame({
  children,
  hideBottomLine = false,
}: {
  children: React.ReactNode;
  hideBottomLine?: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "radial-gradient(circle at 30% 30%, #12291f 0%, #0b0b0e 65%)",
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
            background: "rgba(255,255,255,0.3)",
            display: "flex",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 64,
          right: 64,
          height: 2,
          background: "linear-gradient(90deg, transparent, #34d399, transparent)",
        }}
      />
      {hideBottomLine ? null : (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 64,
            right: 64,
            height: 2,
            background: "linear-gradient(90deg, transparent, #34d399, transparent)",
          }}
        />
      )}
      {children}
    </div>
  );
}

function PodiumCard({
  rank,
  entry,
  height,
}: {
  rank: number;
  entry: LiveEntry | undefined;
  height: number;
}) {
  const isFirst = rank === 1;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 220,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          marginBottom: -28,
          zIndex: 2,
          background: isFirst ? "#34d399" : "#0b0b0e",
          border: isFirst ? "none" : "3px solid #34d399",
          color: isFirst ? "#08120d" : "#34d399",
          fontSize: 26,
          fontWeight: 900,
        }}
      >
        {rank}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          width: "100%",
          height,
          paddingTop: 40,
          paddingBottom: 24,
          borderRadius: 20,
          background: "rgba(255,255,255,0.04)",
          border: isFirst ? "2px solid rgba(52,211,153,0.7)" : "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {entry ? maskUsername(entry.username) : "———"}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 10,
            fontSize: isFirst ? 34 : 28,
            fontWeight: 900,
            color: "#34d399",
          }}
        >
          {entry ? money.format(Number(entry.wagered_amount)) : "—"}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 4,
            fontSize: 14,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Wagered
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({
  prizePool,
  entries,
}: {
  prizePool: string;
  entries: LiveEntry[];
}) {
  const byRank = (rank: number) => entries.find((e) => e.rank === rank);

  return (
    <Frame hideBottomLine>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          paddingTop: 44,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 900,
            color: "#34d399",
            lineHeight: 1,
          }}
        >
          {money.format(Number(prizePool))}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#ffffff",
          }}
        >
          Live Leaderboard
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#08120d",
            background: "#34d399",
            padding: "10px 24px",
            borderRadius: 999,
          }}
        >
          Must sign up under code JBALLIN to be eligible
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 28,
            marginTop: 52,
          }}
        >
          <PodiumCard rank={2} entry={byRank(2)} height={180} />
          <PodiumCard rank={1} entry={byRank(1)} height={222} />
          <PodiumCard rank={3} entry={byRank(3)} height={160} />
        </div>
      </div>
    </Frame>
  );
}

function WelcomeCard({ logo }: { logo: string }) {
  return (
    <Frame>
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
            style={{ borderRadius: "50%", border: "6px solid rgba(52,211,153,0.7)" }}
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
          <div style={{ display: "flex", marginTop: 28, fontSize: 27, color: "rgba(255,255,255,0.65)" }}>
            Sign up under code JBALLIN on Rainbet — climb the leaderboard
          </div>
        </div>
      </div>
    </Frame>
  );
}

export default async function OpengraphImage() {
  const period = await getActivePeriod();
  const entries = period ? await getLiveEntries(period.id, 3) : [];

  const content =
    period && entries.length > 0 ? (
      <LeaderboardCard prizePool={period.prize_pool} entries={entries} />
    ) : (
      <WelcomeCard logo={logoDataUri()} />
    );

  return new ImageResponse(content, { ...size });
}
