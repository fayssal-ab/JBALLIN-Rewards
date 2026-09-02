import Image from "next/image";
import type { MerchItem } from "@/lib/merch";
import { Icon } from "@/components/Icon";

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
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-400/10 to-transparent transition-transform duration-500 ease-out group-hover:scale-110">
      <Icon name="shirt" className="h-12 w-12 text-emerald-300/50" />
      <span className="text-[10px] tracking-widest text-white/25 uppercase">
        Preview coming soon
      </span>
    </div>
  );
}

export function MerchGrid({ items }: { items: MerchItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-16 rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center">
        <p className="text-white/60">The store is on the way — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div
          key={item.id}
          style={{ animationDelay: `${i * 80}ms` }}
          className="animate-fade-in-up group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/40 hover:shadow-[0_0_40px_rgba(52,211,153,0.2)]"
        >
          <div className="relative aspect-square w-full overflow-hidden">
            <ProductImage item={item} />
            {/* Diagonal light sweep on hover — a plain zoom reads static;
                this is what actually sells "premium" on a product card. */}
            <div className="pointer-events-none absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[150%]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div className="p-5 text-center">
            <p className="font-semibold text-white">{item.name}</p>
            <p className="font-display mt-2 text-2xl text-emerald-300 transition-transform duration-300 group-hover:scale-110">
              {currency.format(Number(item.price))}
            </p>
            {item.buy_url ? (
              <a
                href={item.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative mt-4 flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-bold uppercase text-black transition-all duration-300 hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] group-hover:scale-105"
              >
                Shop Now
                <Icon
                  name="bolt"
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                />
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
