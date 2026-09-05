"use client";

import Link from "next/link";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { WizardProgress } from "@/components/shared/wizard-progress";
import { Button } from "@/components/ui/button";

import { PlaySetupForm } from "./play-setup-form";

export function PlaySetupWizard({
  arrivals,
  play,
}: {
  arrivals: ReactNode;
  play: ComponentProps<typeof PlaySetupForm>;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const container = useRef<HTMLDivElement>(null);

  const goTo = useCallback((next: 1 | 2 | 3) => {
    setStep(next);
    requestAnimationFrame(() => {
      const heading = Array.from(
        container.current?.querySelectorAll<HTMLElement>(
          `[data-setup-step="${next}"] h2`
        ) ?? []
      ).find((element) => !element.closest("[hidden]"));
      heading?.focus();
      heading?.scrollIntoView?.({ block: "start" });
    });
  }, []);

  useEffect(() => {
    function followSetupLink() {
      if (
        ["#setup-arrivals-title", "#setup-readiness"].includes(
          window.location.hash
        )
      )
        goTo(1);
    }
    followSetupLink();
    window.addEventListener("hashchange", followSetupLink);
    return () => window.removeEventListener("hashchange", followSetupLink);
  }, [goTo]);

  return (
    <div ref={container}>
      <WizardProgress
        ariaLabel="Play setup progress"
        labels={["Players", "Game options", "Review"]}
        step={step}
      />
      <section
        data-setup-step="1"
        hidden={step !== 1}
        aria-labelledby="setup-players-title"
      >
        <h2
          id="setup-players-title"
          tabIndex={-1}
          className="text-lg font-bold outline-none"
        >
          Confirm who’s playing
        </h2>
        <p className="mt-1 mb-5 text-sm leading-6 text-muted">
          Check arrivals before choosing the rotation. You need at least four
          eligible players.
        </p>
        {arrivals}
        {(play.players?.length ?? play.playerCount) < 4 ? (
          <Link
            href={`/games/${play.sessionId}/players`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary"
          >
            Add or invite players (opens a new tab)
          </Link>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-line pt-5">
          <Button
            type="button"
            disabled={play.playerCount < 4}
            onClick={() => goTo(2)}
          >
            Continue to game options
          </Button>
        </div>
      </section>
      <div hidden={step === 1} data-setup-step={step === 3 ? "3" : "2"}>
        <PlaySetupForm
          {...play}
          wizardStep={step === 3 ? "review" : "options"}
          onReview={() => goTo(3)}
          onBack={() => goTo(step === 3 ? 2 : 1)}
          onPlayers={() => goTo(1)}
        />
      </div>
    </div>
  );
}
