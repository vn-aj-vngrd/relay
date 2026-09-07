"use client";

import { type RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Tooltip } from "./tooltip";

type Target = { element: HTMLElement; label: string; key: number };

/** Bridge third-party DOM-owned controls (MapLibre) into Relay's tooltip.
 * React-owned controls should use Tooltip directly, not a title attribute.
 */
export function DomTooltips({
  rootRef,
}: {
  rootRef: RefObject<HTMLElement | null>;
}) {
  const [targets, setTargets] = useState<Target[]>([]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const known = new Map<HTMLElement, Target>();
    let nextKey = 0;
    const reconcile = () => {
      let changed = false;
      for (const element of known.keys()) {
        if (!root.contains(element)) {
          known.delete(element);
          changed = true;
        }
      }
      for (const element of root.querySelectorAll<HTMLElement>("[title]")) {
        const label = element.getAttribute("title")?.trim();
        element.removeAttribute("title");
        if (!label) continue;
        const previous = known.get(element);
        if (previous?.label === label) continue;
        known.set(element, { element, label, key: previous?.key ?? nextKey++ });
        changed = true;
      }
      if (changed) setTargets([...known.values()]);
    };
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["title"],
    });
    return () => {
      observer.disconnect();
      for (const { element, label } of known.values()) {
        if (!element.hasAttribute("title"))
          element.setAttribute("title", label);
      }
    };
  }, [rootRef]);
  return targets.map(({ element, label, key }) =>
    createPortal(
      <Tooltip content={label} side="top" align="center" />,
      element,
      String(key)
    )
  );
}
