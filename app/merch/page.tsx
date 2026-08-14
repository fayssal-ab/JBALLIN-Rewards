import type { Metadata } from "next";
import { getActiveMerchItems } from "@/lib/merch";
import { MerchGrid } from "@/components/MerchGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Merch",
  description: "Support JBALLIN — official merch, shipped worldwide.",
};

export default async function MerchPage() {
  const items = await getActiveMerchItems();

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Support the stream
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          JBALLIN Merch
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Every order directly supports the channel. Printed and shipped
          worldwide.
        </p>
      </div>

      <MerchGrid items={items} />
    </div>
  );
}
