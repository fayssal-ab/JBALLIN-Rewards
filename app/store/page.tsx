import type { Metadata } from "next";
import { getActiveMerchItems, getMerchCategories } from "@/lib/merch";
import { MerchGrid } from "@/components/MerchGrid";
import { HeroBannerCarousel } from "@/components/HeroBannerCarousel";
import { StoreSignup } from "@/components/StoreSignup";
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

// Scoped to this page only — the rest of the site keeps its dark/emerald
// theme. This warm streetwear palette (see the redesign spec) lives
// entirely inside this route's own markup.
export default async function StorePage() {
  const [items, categories] = await Promise.all([
    getActiveMerchItems(),
    getMerchCategories(),
  ]);

  return (
    <div className="w-full bg-[#F8F6F3]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-bold tracking-[0.3em] text-[#2D2D2D]/60 uppercase">
            <Icon name="bolt" className="h-3 w-3 text-[#E85D04]" />
            Official Store
          </p>
          <h1 className="mt-2 text-5xl font-bold text-[#E85D04] uppercase sm:text-6xl">
            Store
          </h1>
        </div>

        <div className="mt-10">
          <HeroBannerCarousel />
        </div>

        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="flex items-center gap-2 rounded-full border border-[#E0DCD6] bg-white px-4 py-2 text-xs font-semibold text-[#2D2D2D]"
            >
              <Icon name={f.icon} className="h-4 w-4 text-[#E85D04]" />
              {f.label}
            </span>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-[28px] font-bold text-[#1A1A1A]">Featured Products</h2>
        </div>

        <MerchGrid items={items} categories={categories} />

        <div className="mt-10">
          <StoreSignup />
        </div>
      </div>
    </div>
  );
}
