"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POPOVER_EXIT_MS = 120;

export function usePopoverTransition() {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExitTimer = useCallback(() => {
    if (!exitTimer.current) return;
    clearTimeout(exitTimer.current);
    exitTimer.current = null;
  }, []);

  const show = useCallback(() => {
    clearExitTimer();
    setRendered(true);
    setOpen(true);
  }, [clearExitTimer]);

  const hide = useCallback(() => {
    setOpen(false);
    clearExitTimer();
    exitTimer.current = setTimeout(() => {
      setRendered(false);
      exitTimer.current = null;
    }, POPOVER_EXIT_MS);
  }, [clearExitTimer]);

  const toggle = useCallback(() => {
    if (open) hide();
    else show();
  }, [hide, open, show]);

  useEffect(() => clearExitTimer, [clearExitTimer]);

  return { open, rendered, show, hide, toggle };
}
