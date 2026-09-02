"use client";

import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import type { PointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const AUTOPLAY_DELAY_MS = 6500;

type HeroSessionSlide = {
  id: string;
  label: string;
  moment: string;
  summary: string;
  content: ReactNode;
};

export function HeroSessionCarousel({ slides }: { slides: readonly HeroSessionSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activityVersion, setActivityVersion] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      const fallback = globalThis.setTimeout(() => setIsInViewport(true), 0);
      return () => globalThis.clearTimeout(fallback);
    }

    const visibility = { carousel: false, footer: false };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === carouselRef.current) visibility.carousel = entry.intersectionRatio >= 0.98;
          if (entry.target === footerRef.current) visibility.footer = entry.isIntersecting;
        }
        setIsInViewport(visibility.carousel || visibility.footer);
      },
      { threshold: [0, 0.98] },
    );
    if (carouselRef.current) observer.observe(carouselRef.current);
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion || isPaused || !isInViewport || slides.length < 2) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, activityVersion, isInViewport, isPaused, slides.length]);

  function selectSlide(index: number) {
    setActiveIndex((index + slides.length) % slides.length);
    setActivityVersion((version) => version + 1);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    pointerStart.current = event.clientX;
    setActivityVersion((version) => version + 1);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start === null) return;
    const distance = event.clientX - start;
    if (Math.abs(distance) < 44) return;
    selectSlide(activeIndex + (distance < 0 ? 1 : -1));
  }

  return (
    <figure>
      <div
        ref={carouselRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="A Relay game from overview to story"
        className="overflow-hidden rounded-xl border border-line bg-surface text-left text-ink [--session-cover:#18233b]"
      >
        <div
          id="hero-session-panel"
          role="group"
          aria-roledescription="slide"
          aria-label={`${activeIndex + 1} of ${slides.length}: ${activeSlide.label}`}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="marketing-hero-slide touch-pan-y bg-surface"
        >
          <div key={activeSlide.id} inert className="marketing-hero-slide-content">
            {activeSlide.content}
          </div>
        </div>

        <div
          ref={footerRef}
          className="flex min-h-16 items-center gap-3 border-t border-line bg-canvas px-3 sm:gap-4 sm:px-6"
        >
          <div className="flex min-w-16 flex-1 gap-1.5" aria-label="Choose a game moment">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show ${slide.label}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => selectSlide(index)}
                className="group flex min-h-9 flex-1 items-center"
              >
                <span aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-line">
                  <span
                    key={`${activeIndex}-${activityVersion}-${isInViewport}-${isPaused}`}
                    className={`block h-full origin-left rounded-full bg-primary ${index === activeIndex ? "marketing-hero-progress" : index < activeIndex ? "scale-x-100" : "scale-x-0"}`}
                    style={
                      index === activeIndex
                        ? {
                            animationDuration: `${AUTOPLAY_DELAY_MS}ms`,
                            animationPlayState: isPaused || !isInViewport ? "paused" : "running",
                          }
                        : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>

          <span className="score hidden shrink-0 text-xs text-muted md:inline">
            {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              aria-label={isPaused ? "Resume automatic preview" : "Pause automatic preview"}
              aria-pressed={isPaused}
              onClick={() => {
                setIsPaused((paused) => !paused);
                setActivityVersion((version) => version + 1);
              }}
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-ink hover:bg-surface-strong"
            >
              {isPaused ? <Play aria-hidden size={15} weight="fill" /> : <Pause aria-hidden size={15} weight="fill" />}
            </button>
            <button
              type="button"
              aria-label="Previous game moment"
              onClick={() => selectSlide(activeIndex - 1)}
              className="hidden h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-ink hover:bg-surface-strong sm:grid"
            >
              <CaretLeft aria-hidden size={16} weight="bold" />
            </button>
            <button
              type="button"
              aria-label="Next game moment"
              onClick={() => selectSlide(activeIndex + 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-ink hover:bg-surface-strong"
            >
              <CaretRight aria-hidden size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </figure>
  );
}
