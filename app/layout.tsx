import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://jbalin.netlify.app";
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
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="relative font-sans">
        <AnimatedBackground />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
