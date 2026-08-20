"use client";

import { useEffect, useRef, useState } from "react";

const sections = [
  { id: "highlights", label: "Highlights" },
  { id: "court-finder", label: "Court" },
  { id: "plan", label: "Plan & invite" },
  { id: "play", label: "Play" },
  { id: "payments", label: "Repay" },
  { id: "story", label: "Story" },
] as const;

type SectionId = (typeof sections)[number]["id"];
type Indicator = { left: number; width: number };

function sectionAtScrollPosition(marker: number) {
  let current: SectionId | null = null;
  for (const section of sections) {
    const element = document.getElementById(section.id);
    if (element && element.getBoundingClientRect().top + window.scrollY <= marker) current = section.id;
  }
  return current;
}

export function MarketingSectionNav() {
  const [active, setActive] = useState<SectionId | null>(null);
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, width: 0 });
  const navRef = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    function update() {
      frame.current = null;
      const next = sectionAtScrollPosition(window.scrollY + 64 + window.innerHeight * 0.28);
      setActive(next);
      const nav = navRef.current;
      const link = next ? nav?.querySelector<HTMLElement>(`[data-section="${next}"]`) : null;
      setIndicator(link ? { left: link.offsetLeft, width: link.offsetWidth } : { left: 0, width: 0 });
    }
    function scheduleUpdate() {
      if (frame.current === null) frame.current = window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <nav ref={navRef} aria-label="Marketing navigation" className="relative hidden items-center gap-6 md:flex">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          data-section={section.id}
          aria-current={active === section.id ? "location" : undefined}
          onClick={(event) => {
            setActive(section.id);
            setIndicator({ left: event.currentTarget.offsetLeft, width: event.currentTarget.offsetWidth });
          }}
          className={`inline-flex min-h-11 items-center text-[13px] font-medium transition-colors duration-150 ${
            active === section.id ? "text-[#171719]" : "text-[#66666c] hover:text-[#171719]"
          }`}
        >
          {section.label}
        </a>
      ))}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 h-0.5 bg-[#5962d9] transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: indicator.width,
          opacity: active ? 1 : 0,
          transform: `translateX(${indicator.left}px)`,
        }}
      />
    </nav>
  );
}
