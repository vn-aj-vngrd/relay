"use client";

import { Check } from "@phosphor-icons/react";

export function CreateGameProgress({ step }: { step: number }) {
  const labels = ["Plan", "Players and access", "Details", "Review"];
  return (
    <nav aria-label="Create game progress" className="mb-8">
      <p className="text-sm font-semibold text-muted">Step {step} of 4</p>
      <ol className="mt-4 grid grid-cols-4">
        {labels.map((label, index) => {
          const number = index + 1;
          const complete = number < step;
          const current = number === step;
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={`relative flex min-w-0 flex-col items-center gap-2 text-center text-xs font-semibold after:absolute after:left-[calc(50%+1rem)] after:right-[calc(-50%+1rem)] after:top-3.5 after:h-px last:after:hidden sm:text-sm ${complete ? "after:bg-success" : "after:bg-line"} ${current ? "text-primary" : complete ? "text-ink" : "text-muted"}`}
            >
              <span
                aria-hidden
                className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${current ? "border-primary bg-primary text-white ring-4 ring-primary/10" : complete ? "border-success bg-success text-white" : "border-line bg-surface"}`}
              >
                {complete ? <Check size={14} weight="bold" /> : number}
              </span>
              <span className="max-w-28 leading-4">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
