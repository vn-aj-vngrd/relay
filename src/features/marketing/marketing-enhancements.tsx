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
    const elements = [
      ...document.querySelectorAll<HTMLElement>("[data-marketing-reveal]"),
    ];
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const reduceMotion = motionPreference.matches;
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
        !lenisRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]'
      );
      const hash = link?.hash;
      if (!hash) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      window.history.pushState(null, "", hash);
      lenisRef.current?.scrollTo(target, { offset: -72 });
    };
    document.addEventListener("click", onAnchorClick);

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) =>
        element.classList.add("marketing-reveal-visible")
      );
      return () => {
        document.removeEventListener("click", onAnchorClick);
        lenis?.destroy();
        lenisRef.current = null;
        document.documentElement.classList.remove("marketing-scroll-active");
      };
    }

    // Observe long chapters in pieces so mobile does not reveal the demo early.
    const targets = elements.flatMap((element) =>
      element.dataset.marketingReveal === "sequence"
        ? Array.from(element.children).filter(
            (child): child is HTMLElement => child instanceof HTMLElement
          )
        : [element]
    );
    const reveal = (element: HTMLElement) => {
      element.classList.add("marketing-reveal-visible");
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    const initiallyVisible: HTMLElement[] = [];
    for (const element of targets) {
      element.classList.add("marketing-reveal-ready");
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0)
        initiallyVisible.push(element);
      else observer.observe(element);
    }
    // Roleway's painted start frame makes above-the-fold entrances visible too.
    let revealFrame = 0;
    const paintFrame = window.requestAnimationFrame(() => {
      revealFrame = window.requestAnimationFrame(() =>
        initiallyVisible.forEach(reveal)
      );
    });
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      for (const element of targets) {
        if (element.contains(event.target)) reveal(element);
      }
    };
    const onMotionChange = () => {
      if (!motionPreference.matches) return;
      window.cancelAnimationFrame(paintFrame);
      window.cancelAnimationFrame(revealFrame);
      targets.forEach(reveal);
      observer.disconnect();
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
    document.addEventListener("focusin", onFocus);
    motionPreference.addEventListener("change", onMotionChange);

    return () => {
      window.cancelAnimationFrame(paintFrame);
      window.cancelAnimationFrame(revealFrame);
      document.removeEventListener("focusin", onFocus);
      motionPreference.removeEventListener("change", onMotionChange);
      targets.forEach((element) =>
        element.classList.remove(
          "marketing-reveal-ready",
          "marketing-reveal-visible"
        )
      );
      observer.disconnect();
      document.removeEventListener("click", onAnchorClick);
      lenisRef.current?.destroy();
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
      if (frame.current === null)
        frame.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  function returnToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
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
      className={`marketing-back-to-top pressable fixed bottom-5 right-5 z-30 grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface text-muted shadow-[0_4px_8px_rgb(20_20_23/.08)] hover:border-muted hover:text-ink ${showTop ? "is-visible" : ""}`}
    >
      <ArrowUp aria-hidden size={17} />
    </button>
  );
}
