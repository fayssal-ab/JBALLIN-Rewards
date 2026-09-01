import type { Metadata } from "next";
import { Bangers, Righteous, Inter } from "next/font/google";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import "./globals.css";

// Bold, energetic comic-style display face — replaces Anton everywhere
// `font-display` is used (headings, prize numbers, countdown) since it maps
// through the --font-display -> --font-bangers chain in globals.css.
const bangers = Bangers({
  variable: "--font-bangers",
  weight: "400",
  subsets: ["latin"],
});

// Second display face, same bold-urban energy as Bangers but distinct —
// used just for the "JBALLIN" wordmark in the navbar and footer (see
// --font-brand in globals.css), not the general font-display headings.
const righteous = Righteous({
  variable: "--font-righteous",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://jballin.com";
const TITLE = "JBALLIN Rewards";
const DESCRIPTION =
  "Sign up under JBALLIN's Rainbet code, wager, and compete on the leaderboard for a share of the prize pool.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${TITLE}`,
  },
  description: DESCRIPTION,
  keywords: [
    "JBALLIN",
    "Rainbet",
    "Rainbet code",
    "Kick",
    "wager leaderboard",
    "crypto casino leaderboard",
    "rainbet leaderboard",
  ],
  authors: [{ name: "JBALLIN" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bangers.variable} ${righteous.variable} ${inter.variable}`}>
      <body className="relative font-sans">
        <AnimatedBackground />
        <SiteHeader />
        <ConfirmProvider>
          <main>{children}</main>
        </ConfirmProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
