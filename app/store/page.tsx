import type { Metadata } from "next";
import { getActiveMerchItems } from "@/lib/merch";
import { MerchGrid } from "@/components/MerchGrid";
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
  const items = await getActiveMerchItems();

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Official Store
        </p>
        <h1 className="font-display animate-shimmer-text mt-2 bg-gradient-to-r from-white via-emerald-300 to-white bg-clip-text text-4xl uppercase text-transparent sm:text-5xl">
          JBALLIN Store
        </h1>

        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-emerald-400/30 bg-emerald-400/5 px-6 py-4">
          <p className="text-base font-semibold text-emerald-300 sm:text-lg">
            Every order directly supports the channel
          </p>
          <p className="mt-1 text-sm text-white/50">
            Rep the brand and help keep the stream running and the giveaways
            coming.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-3">
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
      </div>

      <MerchGrid items={items} />
    </div>
  );
}
