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

export const metadata: Metadata = {
  title: "JBALLIN Rewards",
  description:
    "Sign up under JBALLIN's Rainbet code, wager, and compete on the leaderboard for a share of the prize pool.",
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
