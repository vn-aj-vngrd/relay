"use client";

import { createContext, useContext } from "react";
import type { GameLifecycleStatus } from "./game-status";

const GameLifecycleContext = createContext<GameLifecycleStatus | null>(null);

// Layouts already load authorized lifecycle data before rendering tab fallbacks.
export const GameLifecycleProvider = GameLifecycleContext.Provider;

export function useGameLifecycle() {
  return useContext(GameLifecycleContext);
}
