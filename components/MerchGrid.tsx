import Image from "next/image";
import type { MerchItem } from "@/lib/merch";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function ProductImage({ item }: { item: MerchItem }) {
  if (item.image_url) {
    return (
      <Image
        src={item.image_url}
        alt={item.name}
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400/10 to-transparent text-5xl">
      👕
    </div>
  );
}

export function MerchGrid({ items }: { items: MerchItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-16 rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center">
        <p className="text-white/60">Merch is on the way — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-[0_0_35px_rgba(52,211,153,0.15)]"
        >
          <div className="relative aspect-square w-full overflow-hidden">
            <ProductImage item={item} />
          </div>
          <div className="p-5 text-center">
            <p className="font-semibold text-white">{item.name}</p>
            <p className="font-display mt-2 text-2xl text-emerald-300">
              {currency.format(Number(item.price))}
            </p>
            {item.buy_url ? (
              <a
                href={item.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-bold uppercase text-black transition-transform group-hover:scale-105"
              >
                Shop Now
              </a>
            ) : (
              <span className="mt-4 inline-block w-full cursor-not-allowed rounded-lg border border-white/10 px-4 py-2.5 text-sm font-bold uppercase text-white/30">
                Coming Soon
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
