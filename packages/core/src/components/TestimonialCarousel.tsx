"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";

export type TestimonialCarouselItem = {
  quote: string;
  author: string;
  role: string;
  avatar: string;
};

export function TestimonialCarousel({ items }: { items: TestimonialCarouselItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));
    if (slides.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible slide as the "active" one for the dot nav.
        let best: { i: number; ratio: number } | null = null;
        for (const e of entries) {
          const i = Number(e.target.getAttribute("data-slide"));
          if (Number.isNaN(i)) continue;
          if (!best || e.intersectionRatio > best.ratio) best = { i, ratio: e.intersectionRatio };
        }
        if (best && best.ratio > 0.4) setActive(best.i);
      },
      { root: track, threshold: [0.4, 0.6, 0.8, 1] },
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  function scrollTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = track.querySelector<HTMLElement>(`[data-slide="${i}"]`);
    if (target) target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => (
          <figure
            key={i}
            data-slide={i}
            className="w-[88%] flex-shrink-0 snap-center sm:w-[72%] md:w-[60%]"
          >
            <Quote className="mx-auto h-10 w-10 text-brand-accent-soft" />
            <blockquote
              className="mt-6 text-center text-xl md:text-2xl font-medium leading-relaxed text-brand-ink-inverse font-brand-heading"
              dangerouslySetInnerHTML={{ __html: it.quote }}
            />
            <div className="mt-8 flex flex-col items-center gap-3">
              {it.avatar && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={it.avatar}
                  alt={it.author}
                  className="h-12 w-12 rounded-full object-cover bg-brand-ink-subtle"
                />
              )}
              <div className="text-center">
                <p className="text-sm font-semibold text-brand-ink-inverse">{it.author}</p>
                <p className="text-xs text-brand-ink-inverse/60">{it.role}</p>
              </div>
            </div>
          </figure>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-8 bg-brand-accent" : "w-2 bg-brand-ink-inverse/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
