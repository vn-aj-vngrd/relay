"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useTransition,
} from "react";
import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";
import { useGameViewMode } from "./game-view-menu";

const TransitionContext = createContext<ReturnType<
  typeof useTransition
> | null>(null);

export function GameResultsTransition({ children }: { children: ReactNode }) {
  const transition = useTransition();
  return (
    <TransitionContext.Provider value={transition}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useGameResultsTransition() {
  const shared = useContext(TransitionContext);
  const local = useTransition();
  return shared ?? local;
}

export function GameResults({ children }: { children: ReactNode }) {
  const [pending] = useGameResultsTransition();
  const mode = useGameViewMode();
  return (
    <div aria-busy={pending}>
      {pending ? (
        <div
          role="status"
          aria-label="Loading games"
          data-testid="game-results-skeleton"
        >
          {mode === "list" ? (
            <RowsSkeleton rows={4} />
          ) : mode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          )}
        </div>
      ) : null}
      <div hidden={pending}>{children}</div>
    </div>
  );
}
