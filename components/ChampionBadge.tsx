// Premium winner medal — laurel wreath + star medallion + ribbon tails,
// rendered as SVG (not an emoji) so it stays crisp at any size and tints
// to the site's emerald palette via gradient fills.
export function ChampionBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden>
      <defs>
        <linearGradient id="champion-badge-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="45%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="champion-badge-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>

      {/* laurel branches */}
      <g fill="none" stroke="url(#champion-badge-metal)" strokeWidth="2.4" strokeLinecap="round">
        <path d="M18 30c-7-2-11-8-11-16" />
        <path d="M9 20c3 .5 5.5 2.5 6.5 5.5" />
        <path d="M7 13c3 .3 5.5 2 7 4.5" />
        <path d="M8 27c2.8.6 5 2.3 6.3 5" />
        <path d="M46 30c7-2 11-8 11-16" />
        <path d="M55 20c-3 .5-5.5 2.5-6.5 5.5" />
        <path d="M57 13c-3 .3-5.5 2-7 4.5" />
        <path d="M56 27c-2.8.6-5 2.3-6.3 5" />
      </g>

      {/* ribbon tails */}
      <path d="M23 40 17 68 27 60 32 66 30 40Z" fill="url(#champion-badge-ribbon)" />
      <path d="M41 40 47 68 37 60 32 66 34 40Z" fill="url(#champion-badge-ribbon)" />

      {/* medallion */}
      <circle cx="32" cy="30" r="19" fill="url(#champion-badge-metal)" />
      <circle cx="32" cy="30" r="19" fill="none" stroke="#ecfdf5" strokeOpacity="0.5" strokeWidth="1.2" />
      <circle cx="32" cy="30" r="14.5" fill="none" stroke="#022c22" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="1.5 3.5" />
      <path
        d="M32 20.5 35 27.5 42.5 28.3 37 33.3 38.6 40.7 32 36.8 25.4 40.7 27 33.3 21.5 28.3 29 27.5Z"
        fill="#022c22"
      />
    </svg>
  );
}
