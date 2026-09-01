export type IconName =
  | "check"
  | "close"
  | "crown"
  | "trophy"
  | "target"
  | "box"
  | "bolt"
  | "shirt"
  | "list"
  | "users"
  | "dice"
  | "stop"
  | "message";

const PATHS: Record<IconName, React.ReactNode> = {
  check: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 6 9 17l-5-5"
    />
  ),
  close: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      d="M18 6 6 18M6 6l12 12"
    />
  ),
  crown: (
    <path
      fill="currentColor"
      d="M2 18h20l-1.5-8-4.5 3-4-6-4 6-4.5-3L2 18Z"
    />
  ),
  trophy: (
    <path
      fill="currentColor"
      d="M6 2h12v2h3v3a5 5 0 0 1-5 5c-.3 1.7-1.5 3-3 3.4V18h3v2H8v-2h3v-2.6c-1.5-.4-2.7-1.7-3-3.4a5 5 0 0 1-5-5V4h3V2Zm-3 4v1a3 3 0 0 0 3 3V6H3Zm15 0v4a3 3 0 0 0 3-3V6h-3Z"
    />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={2} />
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth={2} />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  box: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8"
    />
  ),
  bolt: (
    <path fill="currentColor" d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
  ),
  shirt: (
    <path
      fill="currentColor"
      d="M8 2 3 6l2 3 3-1v11h8V8l3 1 2-3-5-4-3 2h-2L8 2Z"
    />
  ),
  list: (
    <>
      <circle cx="4" cy="6" r="1.4" fill="currentColor" />
      <circle cx="4" cy="12" r="1.4" fill="currentColor" />
      <circle cx="4" cy="18" r="1.4" fill="currentColor" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        d="M9 6h11M9 12h11M9 18h11"
      />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        d="M2.5 20a6.5 6.5 0 0 1 13 0"
      />
      <circle cx="17.5" cy="8.5" r="2.5" fill="none" stroke="currentColor" strokeWidth={1.8} />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        d="M16.2 14.3a5.3 5.3 0 0 1 5.3 5.3"
      />
    </>
  ),
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="currentColor" strokeWidth={2} />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="16" cy="8" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="8" cy="16" r="1.4" fill="currentColor" />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />,
  message: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 5h16v11H9l-4 4V5Z"
    />
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
