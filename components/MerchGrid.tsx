"use client";

import { useState } from "react";
import Image from "next/image";
import type { MerchItem, MerchCategory } from "@/lib/merch";
import { Icon } from "@/components/Icon";
import { ScrollReveal } from "@/components/ScrollReveal";

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

function CategoryBanner({
  category,
  active,
  onClick,
}: {
  category: MerchCategory;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-32 w-52 shrink-0 snap-start items-end overflow-hidden rounded-2xl border transition-all duration-300 ${
        active
          ? "border-emerald-400/60 shadow-[0_0_25px_rgba(52,211,153,0.25)]"
          : "border-white/10 hover:border-emerald-400/30"
      }`}
    >
      {category.image_url ? (
        <Image
          src={category.image_url}
          alt={category.name}
          fill
          sizes="176px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 to-zinc-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <span className="relative z-10 p-3 text-left text-sm font-bold text-white uppercase">
        {category.name}
      </span>
    </button>
  );
}

export function MerchGrid({
  items,
  categories,
}: {
  items: MerchItem[];
  categories: MerchCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <div className="mt-16 rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center">
        <p className="text-white/60">The store is on the way — check back soon.</p>
      </div>
    );
  }

  const visibleItems = items.filter(
    (item) => activeCategory === null || item.category_id === activeCategory
  );

  return (
    <div>
      {categories.length > 0 ? (
        <ScrollReveal className="mt-16 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex h-32 w-32 shrink-0 snap-start items-center justify-center rounded-2xl border text-sm font-bold uppercase transition-all duration-300 ${
              activeCategory === null
                ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.25)]"
                : "border-white/10 text-white/50 hover:border-emerald-400/30"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <CategoryBanner
              key={category.id}
              category={category}
              active={activeCategory === category.id}
              onClick={() =>
                setActiveCategory(activeCategory === category.id ? null : category.id)
              }
            />
          ))}
        </ScrollReveal>
      ) : null}

      <ScrollReveal className="mt-16 flex items-end justify-between border-b border-white/10 pb-4">
        <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
          Shop The Collection
        </h2>
        <span className="text-xs tracking-[0.2em] text-white/40 uppercase">
          {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}
        </span>
      </ScrollReveal>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item, i) => (
          <ScrollReveal key={item.id} delayMs={(i % 3) * 100}>
            <div className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/40 hover:shadow-[0_0_40px_rgba(52,211,153,0.2)]">
              <div className="relative aspect-square w-full overflow-hidden">
                <ProductImage item={item} />
                {/* Diagonal light sweep on hover — a plain zoom reads static;
                    this is what actually sells "premium" on a product card. */}
                <div className="pointer-events-none absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[150%]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <div className="p-5 text-center">
                <p className="text-sm font-semibold tracking-wide text-white/80 uppercase">
                  {item.name}
                </p>
                <p className="font-display mt-2 text-3xl text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)] transition-transform duration-300 group-hover:scale-110">
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
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
