import type { Metadata } from "next";
import { getActiveMerchItems, getMerchCategories } from "@/lib/merch";
import { MerchGrid } from "@/components/MerchGrid";
import { HeroBannerCarousel } from "@/components/HeroBannerCarousel";
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
      <div className="text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 shadow-[0_0_30px_rgba(52,211,153,0.25)]">
            <div className="animate-glow-pulse absolute inset-0 rounded-2xl" />
            <Icon name="shirt" className="h-7 w-7 text-emerald-300" />
          </div>
          <div className="text-left">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.3em] text-emerald-400/70 uppercase">
              <Icon name="bolt" className="h-3 w-3" />
              Official Store
            </p>
            <h1 className="animate-shimmer-text font-display bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-4xl text-transparent uppercase sm:text-5xl">
              JBALLIN Store
            </h1>
          </div>
        </div>

      </div>

      <HeroBannerCarousel />

      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3">
        {FEATURES.map((f) => (
          <span
            key={f.label}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/40 px-4 py-2 text-xs text-white/60"
          >
            <Icon name={f.icon} className="h-4 w-4 text-emerald-300" />
            {f.label}
          </span>
        ))}
      </div>

      <MerchGrid items={items} categories={categories} />
    </div>
  );
}
