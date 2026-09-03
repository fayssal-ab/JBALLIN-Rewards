"use client";

import { useState } from "react";
import Image from "next/image";
import type { MerchItem, MerchCategory } from "@/lib/merch";
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
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F0EDE8]">
      <Icon name="shirt" className="h-12 w-12 text-[#E0DCD6]" />
      <span className="text-[10px] tracking-widest text-[#2D2D2D]/40 uppercase">
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
          ? "border-[#E85D04] shadow-[0_4px_12px_rgba(232,93,4,0.2)]"
          : "border-[#E0DCD6] bg-white hover:border-[#E85D04]/50"
      }`}
    >
      {category.image_url ? (
        <Image
          src={category.image_url}
          alt={category.name}
          fill
          sizes="176px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-[#F0EDE8]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/70 via-transparent to-transparent" />
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
      <div className="mt-10 rounded-3xl border border-[#E0DCD6] bg-white p-12 text-center shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <p className="text-[#2D2D2D]">The store is on the way — check back soon.</p>
      </div>
    );
  }

  const visibleItems = items.filter(
    (item) => activeCategory === null || item.category_id === activeCategory
  );

  return (
    <div>
      {categories.length > 0 ? (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex h-32 w-32 shrink-0 snap-start items-center justify-center rounded-2xl border text-sm font-bold uppercase transition-all duration-300 ${
              activeCategory === null
                ? "border-[#E85D04] bg-[#E85D04] text-white shadow-[0_4px_12px_rgba(232,93,4,0.25)]"
                : "border-[#E0DCD6] bg-white text-[#2D2D2D] hover:border-[#E85D04]/50 hover:text-[#E85D04]"
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
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item, i) => (
          <div
            key={item.id}
            style={{ animationDelay: `${i * 80}ms` }}
            className="animate-fade-in-up group overflow-hidden rounded-2xl border border-[#E0DCD6] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              <ProductImage item={item} />
            </div>
            <div className="p-5 text-center">
              <p className="text-[18px] font-bold text-[#1A1A1A]">{item.name}</p>
              <p className="mt-2 text-[20px] font-bold text-[#F5A623]">
                {currency.format(Number(item.price))}
              </p>
              {item.buy_url ? (
                <a
                  href={item.buy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#E85D04] px-4 py-2.5 text-sm font-bold text-white uppercase transition-colors duration-200 hover:bg-[#FF6B35]"
                >
                  Shop Now
                  <Icon name="bolt" className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="mt-4 inline-block w-full cursor-not-allowed rounded-lg border border-[#E0DCD6] px-4 py-2.5 text-sm font-bold text-[#2D2D2D]/40 uppercase">
                  Coming Soon
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
