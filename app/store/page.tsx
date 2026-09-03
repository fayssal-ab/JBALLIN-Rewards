import type { Metadata } from "next";
import { getActiveMerchItems, getMerchCategories } from "@/lib/merch";
import { MerchGrid } from "@/components/MerchGrid";
import { HeroBannerCarousel } from "@/components/HeroBannerCarousel";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Icon, type IconName } from "@/components/Icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store",
  description: "Support JBALLIN directly — official store, shipped worldwide.",
};

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: "target", label: "Supports the channel directly" },
  { icon: "box", label: "Printed on demand, shipped worldwide" },
  { icon: "bolt", label: "New drops added regularly" },
];

export default async function StorePage() {
  const [items, categories] = await Promise.all([
    getActiveMerchItems(),
    getMerchCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="animate-fade-in-up text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 shadow-[0_0_30px_rgba(52,211,153,0.25)]">
            <div className="animate-glow-pulse absolute inset-0 rounded-2xl" />
            <Icon name="shirt" className="h-7 w-7 text-emerald-300" />
          </div>
          <h1 className="animate-shimmer-text font-display bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-4xl text-transparent uppercase sm:text-5xl">
            JBALLIN Store
          </h1>
        </div>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
          Official merch for the channel — new drops added regularly.
        </p>
      </div>

      <HeroBannerCarousel />

      <ScrollReveal className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3">
        {FEATURES.map((f) => (
          <span
            key={f.label}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/40 px-4 py-2 text-xs text-white/60"
          >
            <Icon name={f.icon} className="h-4 w-4 text-emerald-300" />
            {f.label}
          </span>
        ))}
      </ScrollReveal>

      <MerchGrid items={items} categories={categories} />
    </div>
  );
}
