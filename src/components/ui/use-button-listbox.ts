"use client";

import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type ListboxOption = { value: string; label: string };

export function useButtonListbox({
  options,
  value,
  open,
  setOpen,
  onSelect,
  triggerRef,
}: {
  options: readonly ListboxOption[];
  value: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelect: (value: string) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const listboxId = `${useId().replaceAll(":", "")}-listbox`;
  const [activeIndex, setActiveIndex] = useState(-1);
  const typeahead = useRef("");
  const typeaheadTimer = useRef<number | null>(null);

  const selectedIndex = options.length
    ? Math.max(
        0,
        options.findIndex((option) => option.value === value)
      )
    : -1;

  useEffect(
    () => () => {
      if (typeaheadTimer.current !== null)
        window.clearTimeout(typeaheadTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(`${listboxId}-${activeIndex}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, listboxId, open]);

  function show(preferredIndex = selectedIndex) {
    setActiveIndex(preferredIndex);
    setOpen(true);
  }

  function close({ restoreFocus = false } = {}) {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreFocus)
      window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onSelect(option.value);
    close({ restoreFocus: true });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close({ restoreFocus: true });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && activeIndex >= 0) choose(activeIndex);
      else show();
      return;
    }

    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!options.length) return;
      if (!open) {
        if (event.key === "End") show(options.length - 1);
        else show(selectedIndex);
        return;
      }
      setActiveIndex((current) => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return options.length - 1;
        if (event.key === "ArrowDown") return (current + 1) % options.length;
        return (current - 1 + options.length) % options.length;
      });
      return;
    }

    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;

    typeahead.current += event.key.toLocaleLowerCase();
    if (typeaheadTimer.current !== null)
      window.clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = window.setTimeout(() => {
      typeahead.current = "";
    }, 500);
    const start = activeIndex >= 0 ? activeIndex + 1 : selectedIndex + 1;
    for (let offset = 0; offset < options.length; offset += 1) {
      const index = (start + offset) % options.length;
      if (
        options[index]?.label.toLocaleLowerCase().startsWith(typeahead.current)
      ) {
        event.preventDefault();
        setActiveIndex(index);
        setOpen(true);
        break;
      }
    }
  }

  return {
    activeIndex,
    choose,
    close,
    handleKeyDown,
    listboxId,
    optionId: (index: number) => `${listboxId}-${index}`,
    setActiveIndex,
    show,
  };
}
