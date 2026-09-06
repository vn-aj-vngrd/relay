"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { storyComposition } from "./story-theme";

/** Fit complete factual copy inside the expressive artwork's reserved region.
 * No names are removed. Expanded preview provides a larger reading surface. */
export function StoryFactFrame({
  children,
  position,
  enabled,
  className,
}: {
  children: ReactNode;
  enabled: boolean;
  className: string;
  position: "top" | "center" | "bottom";
}) {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = frame.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const fitContent = () => {
      const scale = Math.min(
        1,
        outer.clientHeight / Math.max(1, inner.scrollHeight)
      );
      const free = Math.max(0, outer.clientHeight - inner.scrollHeight * scale);
      const y =
        position === "top" ? 0 : position === "center" ? free / 2 : free;
      inner.style.transform = `translateY(${y}px) scale(${scale})`;
    };
    fitContent();
    const observer = new ResizeObserver(fitContent);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [position, enabled]);
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <div
      ref={frame}
      data-story-region="facts"
      className="absolute inset-x-0"
      style={{
        top: `${storyComposition.factsTop / 19.2}%`,
        bottom: `${(1920 - storyComposition.factsBottom) / 19.2}%`,
      }}
    >
      <div
        ref={content}
        className="flow-root origin-top"
        data-story-fitted-content
      >
        {children}
      </div>
    </div>
  );
}
