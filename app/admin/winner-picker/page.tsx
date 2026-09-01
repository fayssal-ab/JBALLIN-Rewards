import { Press_Start_2P } from "next/font/google";
import { WinnerPicker } from "@/components/WinnerPicker";

// Scoped to this one admin tool, same pattern as --font-brand (Righteous)
// being scoped to just the wordmark — a deliberate retro "loot vault" skin
// for the giveaway roller, not a site-wide font change.
const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export default function WinnerPickerPage() {
  return (
    <div className={pixelFont.variable}>
      <WinnerPicker />
    </div>
  );
}
