const FAQ = [
  {
    q: "How do I join the leaderboard?",
    a: "Sign up on Rainbet under code JBALLIN and start wagering. Your wagers during the active period count automatically — no extra sign-up step.",
  },
  {
    q: "How often does the leaderboard update?",
    a: "Rainbet's affiliate data can take up to 10 minutes to reflect new wagers, so the leaderboard may lag slightly behind your account.",
  },
  {
    q: "When do prizes get paid out?",
    a: "Once the current period ends, results are locked in and prizes are distributed to the top wagerers shortly after.",
  },
  {
    q: "Can I use an existing Rainbet account?",
    a: "Only wagers placed under code JBALLIN count toward the leaderboard, so you'll need to sign up (or switch your code) to participate.",
  },
];

export default function InstructionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Instructions
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          How It Works
        </h1>
      </div>

      <div className="mt-16 space-y-6">
        {FAQ.map((item) => (
          <div
            key={item.q}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 p-6 transition-colors hover:border-emerald-400/30"
          >
            <h3 className="font-semibold text-emerald-300">{item.q}</h3>
            <p className="mt-2 text-sm text-white/60">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
