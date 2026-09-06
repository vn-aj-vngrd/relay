"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useTransition,
} from "react";
import { GameResultsSkeleton } from "./game-results-skeleton";

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

export function GameResults({
  children,
  discovery = false,
  invitations = false,
}: {
  children: ReactNode;
  discovery?: boolean;
  invitations?: boolean;
}) {
  const [pending] = useGameResultsTransition();
  return (
    <div aria-busy={pending}>
      {pending ? (
        <GameResultsSkeleton discovery={discovery} invitations={invitations} />
      ) : null}
      <div hidden={pending}>{children}</div>
    </div>
  );
}
