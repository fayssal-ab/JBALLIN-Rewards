"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Placeholder slides at /public/banners/banner-{1,2,3}.jpg, 1600x500 (16:5).
// Swap these three files for real banner art whenever it's ready — same
// filenames, same aspect ratio, nothing else to change.
const SLIDES = [
  { src: "/banners/banner-1.jpg", alt: "New drops weekly — TYPESHIT" },
  { src: "/banners/banner-2.jpg", alt: "Every order supports the channel" },
  { src: "/banners/banner-3.jpg", alt: "Official store — shop the collection" },
];

const INTERVAL_MS = 5000;

function goto(index: number, length: number): number {
  return ((index % length) + length) % length;
}

export function HeroBannerCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => goto(i + 1, SLIDES.length));
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="group/carousel relative mt-10 aspect-[16/5] w-full overflow-hidden rounded-3xl border border-white/10">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 1152px, 100vw"
            className={`object-cover transition-transform duration-[6000ms] ease-out ${
              i === active ? "scale-110" : "scale-100"
            }`}
          />
        </div>
      ))}

      <button
        onClick={() => setActive((i) => goto(i - 1, SLIDES.length))}
        aria-label="Previous slide"
        className="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/carousel:opacity-100 hover:border-emerald-400/50 hover:bg-black/60"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => setActive((i) => goto(i + 1, SLIDES.length))}
        aria-label="Next slide"
        className="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/carousel:opacity-100 hover:border-emerald-400/50 hover:bg-black/60"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            onClick={() => setActive(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-emerald-400" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
