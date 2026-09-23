import type { ReactNode } from "react";

import type { NextRotationPreview } from "./next-rotation";

export function UpNext({
  preview,
  names,
  action,
}: {
  preview: NextRotationPreview;
  names: ReadonlyMap<string, string>;
  action?: ReactNode;
}) {
  const name = (id: string) => names.get(id) ?? "Player";
  const matchups = preview.plans.length
    ? preview.plans
    : preview.upcomingTeams
      ? [
          {
            courtId: "next",
            courtLabel: "Next available court",
            ...preview.upcomingTeams,
          },
        ]
      : [];
  return (
    <section aria-label="Up next" className="mt-6 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Up next</h3>
        {action}
      </div>
      <p className="mt-1 text-sm text-muted">{preview.message}</p>
      {matchups.length ? (
        <ol className="mt-3 divide-y divide-line">
          {matchups.map((plan) => (
            <li
              key={plan.courtId}
              className="grid min-w-0 gap-2 py-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-4"
            >
              <span className="text-sm font-semibold text-muted">
                {plan.courtLabel}
              </span>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm font-semibold">
                <span className="min-w-0 break-words">
                  {plan.teamA.map(name).join(" + ")}
                </span>
                <span className="text-xs font-normal text-muted">vs</span>
                <span className="min-w-0 break-words">
                  {plan.teamB.map(name).join(" + ")}
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : preview.preparing.length ? (
        <div className="mt-3">
          <p className="text-xs text-muted">{preview.preparationLabel}</p>
          <p className="mt-1 break-words text-sm font-semibold">
            {preview.preparing.map(name).join(" · ")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
