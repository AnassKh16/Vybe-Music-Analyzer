import { useCallback, useEffect, useRef, useState } from "react";
import { SongCard } from "./SongCard";

interface Song {
  name: string;
  artist: string;
  energy?: number;
  valence?: number;
  tempo?: number;
  genre?: string;
  isPlaying?: boolean;
  matchPct?: number;
}

interface SongCarouselProps {
  songs: Song[];
}

/** Horizontal strip with peek of next card + scroll-linked dots */
export function SongCarousel({ songs }: SongCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const updateActiveFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || songs.length === 0) return;
    const slides = el.querySelectorAll<HTMLElement>("[data-carousel-slide]");
    const first = slides[0];
    if (!first) return;
    const gap =
      slides.length >= 2
        ? slides[1].getBoundingClientRect().left -
          first.getBoundingClientRect().left -
          first.offsetWidth
        : 12;
    const step = Math.max(1, first.offsetWidth + Math.max(gap, 8));
    const idx = Math.round(el.scrollLeft / step);
    setActive(Math.min(Math.max(0, idx), songs.length - 1));
  }, [songs.length]);

  useEffect(() => {
    updateActiveFromScroll();
  }, [songs.length, updateActiveFromScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => updateActiveFromScroll());
    obs.observe(el);
    const slides = el.querySelectorAll("[data-carousel-slide]");
    slides.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [songs.length, updateActiveFromScroll]);

  return (
    <div className="w-full min-w-0">
      {/* Bleed/peek: negative margin aligns first card with page padding; pr gives next-card peek */}
      <div className="-mx-4 px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 snap-x snap-mandatory pr-[clamp(3rem,16vw,7.5rem)] [-webkit-overflow-scrolling:touch]"
          onScroll={updateActiveFromScroll}
        >
          {songs.map((song, i) => (
            <div key={`${song.name}-${i}`} data-carousel-slide className="snap-start shrink-0">
              <SongCard {...song} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-1 px-4">
        {songs.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Song ${i + 1}`}
            className="flex h-11 w-11 items-center justify-center rounded-full touch-manipulation"
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const slide = el.querySelector(`[data-carousel-slide]:nth-child(${i + 1})`) as HTMLElement | null;
              if (!slide) return;
              slide.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
            }}
          >
            <span
              className="block h-[6px] rounded-full transition-[width,background-color] duration-200"
              style={{
                width: i === active ? 18 : 6,
                backgroundColor: i === active ? "#1DB954" : "#333333",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
