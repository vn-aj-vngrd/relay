"use client";

import { ArrowUp } from "@phosphor-icons/react";
import Lenis from "lenis";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function MarketingEnhancements() {
  const [showTop, setShowTop] = useState(false);
  const frame = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useLayoutEffect(() => {
    document.documentElement.classList.add("marketing-scroll-active");
    const elements = [...document.querySelectorAll<HTMLElement>("[data-marketing-reveal]")];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduceMotion
      ? null
      : new Lenis({
          autoRaf: true,
          lerp: 0.085,
          smoothWheel: true,
          syncTouch: false,
          wheelMultiplier: 0.88,
          prevent: (node) => Boolean(node.closest("[data-lenis-prevent]")),
        });
    lenisRef.current = lenis;
    const onAnchorClick = (event: MouseEvent) => {
      if (
        !lenis ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.hash;
      if (!hash) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      window.history.pushState(null, "", hash);
      lenis.scrollTo(target, { offset: -72 });
    };
    document.addEventListener("click", onAnchorClick);

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("marketing-reveal-visible"));
      return () => {
        document.removeEventListener("click", onAnchorClick);
        lenis?.destroy();
        lenisRef.current = null;
        document.documentElement.classList.remove("marketing-scroll-active");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.classList.add("marketing-reveal-visible");
          observer.unobserve(element);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    for (const element of elements) {
      element.classList.add("marketing-reveal-ready");
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92)
        element.classList.add("marketing-reveal-visible");
      else observer.observe(element);
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onAnchorClick);
      lenis?.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove("marketing-scroll-active");
    };
  }, []);

  useEffect(() => {
    const update = () => {
      frame.current = null;
      setShowTop(window.scrollY > Math.max(900, window.innerHeight));
    };
    const onScroll = () => {
      if (frame.current === null) frame.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  function returnToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && lenisRef.current) lenisRef.current.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <button
      type="button"
      onClick={returnToTop}
      aria-label="Back to top"
      aria-hidden={!showTop}
      tabIndex={showTop ? 0 : -1}
      className={`marketing-back-to-top pressable fixed bottom-5 right-5 z-30 grid h-10 w-10 place-items-center rounded-lg border border-[#d5d5cf] bg-white text-[#55555b] shadow-[0_4px_8px_rgb(20_20_23/.08)] hover:border-[#aaa9a3] hover:text-[#171719] ${showTop ? "is-visible" : ""}`}
    >
      <ArrowUp aria-hidden size={17} />
    </button>
  );
}
