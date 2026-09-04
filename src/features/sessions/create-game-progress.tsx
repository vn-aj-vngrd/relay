"use client";

import { WizardProgress } from "@/components/shared/wizard-progress";

const createGameSteps = ["Plan", "Players and access", "Details", "Review"];

export function CreateGameProgress({ step }: { step: number }) {
  return (
    <WizardProgress
      ariaLabel="Create game progress"
      labels={createGameSteps}
      step={step}
    />
  );
}
