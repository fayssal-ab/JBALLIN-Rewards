import { RAINBET_URL } from "@/lib/constants";

const STEPS = [
  {
    title: "Create an account",
    body: "Sign up on Rainbet using code JBALLIN, or follow the referral link.",
  },
  {
    title: "Wager",
    body: "Play any game on Rainbet. Your wagered amount counts toward the current leaderboard period.",
  },
  {
    title: "Climb the ranks",
    body: "Check the leaderboard to see where you stand against other players.",
  },
  {
    title: "Get paid",
    body: "When the period closes, prizes are distributed to the top wagerers.",
  },
];

export default function ReferralPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Referral Program
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Sign Up Under Code JBALLIN
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Every wager placed under code JBALLIN counts toward the leaderboard
          and helps support the stream at no extra cost to you.
        </p>

        <a
          href={RAINBET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-bold tracking-wide text-black uppercase shadow-[0_0_25px_rgba(52,211,153,0.35)] transition-transform hover:scale-105"
        >
          Sign Up Now
        </a>
      </div>

      <div className="mt-20 grid gap-6 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 p-6 transition-colors hover:border-emerald-400/30"
          >
            <p className="font-display text-sm text-emerald-300">
              Step {i + 1}
            </p>
            <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-white/60">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
