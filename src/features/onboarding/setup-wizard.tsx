"use client";

import { ArrowLeft, ArrowRight, Check, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Avatar } from "@/components/shared/avatar-stack";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { ImageFileField } from "@/components/ui/image-file-field";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { SelectField } from "@/components/ui/select-field";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";
import { postSetupDestination } from "@/features/auth/destination-path";
import { playingExperienceLabel, playingExperienceOptions } from "@/features/players/playing-experience";

import { completeProfileSetup, type OnboardingActionState, skipProfileSetup } from "./actions";

const fieldClass =
  "mt-1.5 h-12 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

const phases = ["Identity", "Profile", "Confirm", "All set"] as const;

type InitialProfile = {
  name: string;
  username: string;
  imageUrl?: string;
  city: string;
  skillLevel: string;
  dominantHand: string;
  bio: string;
};

type Review = {
  name: string;
  username: string;
  photo: string;
  city: string;
  experience: string;
  hand: string;
  bio: string;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto sm:min-w-40" disabled={pending}>
      {pending ? (
        <>
          <ButtonSpinner /> Saving profile…
        </>
      ) : (
        <>
          Confirm profile <ArrowRight aria-hidden size={16} />
        </>
      )}
    </Button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">
      {message}
    </p>
  ) : null;
}

export function SetupWizard({ initial, next }: { initial: InitialProfile; next: string }) {
  const [step, setStep] = useState(1);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [review, setReview] = useState<Review | null>(null);
  const [state, action] = useActionState<OnboardingActionState, FormData>(completeProfileSetup, {});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const preserveValues = usePreserveFormValuesOnError(state);
  const tourHref = postSetupDestination(next);
  const activeStep = state.success ? 4 : step;

  useEffect(() => {
    if (state.success) window.requestAnimationFrame(() => headingRef.current?.focus());
  }, [state.success]);

  function focusStep(nextStep: number) {
    setStep(nextStep);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function formData() {
    return new FormData(formRef.current ?? undefined);
  }

  function continueIdentity() {
    const data = formData();
    const name = String(data.get("name") ?? "").trim();
    const username = String(data.get("username") ?? "").trim();
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Add the name your friends know you by.";
    if (username.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(username))
      errors.username = "Use at least 3 lowercase letters, numbers, or single hyphens.";
    setLocalErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) {
      document.getElementById(`onboarding-${first}`)?.focus();
      return;
    }
    focusStep(2);
  }

  function continueProfile() {
    const data = formData();
    const city = String(data.get("city") ?? "").trim();
    const bio = String(data.get("bio") ?? "").trim();
    const errors: Record<string, string> = {};
    if (city.length > 60) errors.city = "Keep your city under 60 characters.";
    if (bio.length > 240) errors.bio = "Keep your About you text under 240 characters.";
    setLocalErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) {
      document.getElementById(`onboarding-${first}`)?.focus();
      return;
    }
    const file = data.get("avatar");
    const hand = String(data.get("dominantHand") ?? "");
    setReview({
      name: String(data.get("name") ?? "").trim(),
      username: String(data.get("username") ?? "").trim(),
      photo: file instanceof File && file.size ? file.name : initial.imageUrl ? "Current photo" : "Not added",
      city: city || "Not added",
      experience: playingExperienceLabel(String(data.get("skillLevel") ?? "")),
      hand: hand ? `${hand[0].toUpperCase()}${hand.slice(1)}` : "Not added",
      bio: bio || "Not added",
    });
    focusStep(3);
  }

  return (
    <div className="w-full max-w-[760px]">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={phases.length}
          aria-valuenow={activeStep}
          aria-label={`Profile setup step ${activeStep} of ${phases.length}: ${phases[activeStep - 1]}`}
          className="flex flex-1 gap-1.5"
        >
          {phases.map((phase, index) => (
            <span
              key={phase}
              aria-hidden
              className={`h-1.5 flex-1 rounded-full ${index < activeStep ? "bg-primary" : "bg-surface-strong"}`}
            />
          ))}
        </div>
        <span className="score shrink-0 text-xs font-semibold text-muted">
          {activeStep} / {phases.length}
        </span>
      </div>

      <form ref={formRef} action={action} onSubmitCapture={preserveValues} noValidate>
        <input type="hidden" name="next" value={next} />

        <section hidden={activeStep !== 1} aria-labelledby="onboarding-step-title" className="mx-auto max-w-xl">
          <UserCircle aria-hidden size={25} className="text-primary" />
          <h1
            ref={activeStep === 1 ? headingRef : undefined}
            tabIndex={-1}
            id="onboarding-step-title"
            className="mt-5 text-[1.75rem] font-[680] leading-tight tracking-[-0.03em] outline-none"
          >
            How should players know you?
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Use the identity friends will recognize in rosters and invites.
          </p>
          <div className="mt-7 space-y-5">
            <div>
              <label htmlFor="onboarding-name" className="text-sm font-semibold">
                Name
              </label>
              <input
                id="onboarding-name"
                name="name"
                className={fieldClass}
                defaultValue={initial.name}
                required
                minLength={2}
                maxLength={60}
                autoComplete="name"
                aria-invalid={Boolean(localErrors.name || state.fieldErrors?.name)}
                aria-describedby="onboarding-name-hint onboarding-name-error"
              />
              <p id="onboarding-name-hint" className="mt-1.5 text-xs text-muted">
                Use the name your pickleball friends call you.
              </p>
              <FieldError id="onboarding-name-error" message={localErrors.name ?? state.fieldErrors?.name?.[0]} />
            </div>
            <div>
              <label htmlFor="onboarding-username" className="text-sm font-semibold">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-[17px] text-muted">@</span>
                <input
                  id="onboarding-username"
                  name="username"
                  className={`${fieldClass} pl-8`}
                  defaultValue={initial.username}
                  required
                  minLength={3}
                  maxLength={24}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={Boolean(localErrors.username || state.fieldErrors?.username)}
                  aria-describedby="onboarding-username-hint onboarding-username-error"
                />
              </div>
              <p id="onboarding-username-hint" className="mt-1.5 text-xs leading-5 text-muted">
                Lowercase letters, numbers, and single hyphens.
              </p>
              <FieldError
                id="onboarding-username-error"
                message={localErrors.username ?? state.fieldErrors?.username?.[0]}
              />
            </div>
          </div>
          <div className="mt-7 flex justify-end border-t border-line pt-5">
            <Button type="button" onClick={continueIdentity}>
              Continue <ArrowRight aria-hidden size={16} />
            </Button>
          </div>
        </section>

        <section hidden={activeStep !== 2} aria-labelledby="onboarding-profile-title" className="mx-auto max-w-2xl">
          <h1
            ref={activeStep === 2 ? headingRef : undefined}
            tabIndex={-1}
            id="onboarding-profile-title"
            className="text-[1.75rem] font-[680] leading-tight tracking-[-0.03em] outline-none"
          >
            Add more about your game
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Everything on this step is optional. Add what helps your crew recognize and place you.
          </p>

          <div className="mt-7 grid gap-7 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div>
              {initial.imageUrl ? <Avatar name={initial.name} imageUrl={initial.imageUrl} size="xl" /> : null}
              <div className={initial.imageUrl ? "mt-4" : ""}>
                <ImageFileField
                  id="onboarding-avatar"
                  name="avatar"
                  label="Profile photo"
                  hint={
                    initial.imageUrl
                      ? "Choose a new photo or keep the current one."
                      : "Choose a clear photo friends will recognize."
                  }
                  buttonLabel={initial.imageUrl ? "Replace photo" : "Choose photo"}
                />
              </div>
              <FieldError id="onboarding-avatar-error" message={state.fieldErrors?.avatar?.[0]} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="onboarding-city" className="text-sm font-semibold">
                  City <span className="font-normal text-muted">Optional</span>
                </label>
                <input
                  id="onboarding-city"
                  name="city"
                  maxLength={60}
                  defaultValue={initial.city}
                  autoComplete="address-level2"
                  placeholder="Mandaluyong"
                  className={fieldClass}
                />
                <FieldError id="onboarding-city-error" message={localErrors.city ?? state.fieldErrors?.city?.[0]} />
              </div>
              <SelectField
                id="onboarding-skillLevel"
                name="skillLevel"
                label="Playing experience (optional)"
                defaultValue={initial.skillLevel}
                options={[
                  { value: "", label: "Not set" },
                  ...playingExperienceOptions.map(({ value, label }) => ({ value, label })),
                ]}
              />
              <SelectField
                id="onboarding-dominantHand"
                name="dominantHand"
                label="Dominant hand (optional)"
                defaultValue={initial.dominantHand}
                options={[
                  { value: "", label: "Not set" },
                  { value: "right", label: "Right" },
                  { value: "left", label: "Left" },
                  { value: "both", label: "Both" },
                ]}
              />
              <div className="sm:col-span-2">
                <label htmlFor="onboarding-bio" className="text-sm font-semibold">
                  About you <span className="font-normal text-muted">Optional</span>
                </label>
                <textarea
                  id="onboarding-bio"
                  name="bio"
                  maxLength={240}
                  rows={3}
                  defaultValue={initial.bio}
                  placeholder="What your pickleball friends should know…"
                  className={`${fieldClass} min-h-24 resize-y py-3.5 leading-6`}
                />
                <FieldError id="onboarding-bio-error" message={localErrors.bio ?? state.fieldErrors?.bio?.[0]} />
              </div>
            </div>
          </div>
          <p className="mt-5 text-xs leading-5 text-muted">
            Experience helps Balanced Mix make closer teams. It is never a public rating.
          </p>
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button type="button" variant="quiet" onClick={() => focusStep(1)}>
              <ArrowLeft aria-hidden size={16} /> Back
            </Button>
            <Button type="button" onClick={continueProfile}>
              Review profile <ArrowRight aria-hidden size={16} />
            </Button>
          </div>
        </section>

        <section hidden={activeStep !== 3} aria-labelledby="onboarding-confirm-title" className="mx-auto max-w-xl">
          <h1
            ref={activeStep === 3 ? headingRef : undefined}
            tabIndex={-1}
            id="onboarding-confirm-title"
            className="text-[1.75rem] font-[680] leading-tight tracking-[-0.03em] outline-none"
          >
            Confirm your profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Check what your crew will see. You can change any of this later.
          </p>
          {state.error ? (
            <div
              role="alert"
              className="mt-5 rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/15"
            >
              <p>{state.error}</p>
              <button
                type="button"
                onClick={() => focusStep(state.fieldErrors?.name || state.fieldErrors?.username ? 1 : 2)}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Review marked details
              </button>
            </div>
          ) : null}
          {review ? (
            <dl className="mt-7 divide-y divide-line border-y border-line">
              {[
                ["Name", review.name],
                ["Username", `@${review.username}`],
                ["Profile photo", review.photo],
                ["City", review.city],
                ["Playing experience", review.experience],
                ["Dominant hand", review.hand],
                ["About you", review.bio],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 py-3.5 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="mt-7 flex items-center justify-between gap-3">
            <Button type="button" variant="quiet" onClick={() => focusStep(2)}>
              <ArrowLeft aria-hidden size={16} /> Edit
            </Button>
            <SaveButton />
          </div>
        </section>

        <section
          hidden={activeStep !== 4}
          aria-labelledby="onboarding-complete-title"
          className="mx-auto max-w-xl py-6 text-center"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
            <Check aria-hidden size={23} weight="bold" />
          </span>
          <h1
            ref={activeStep === 4 ? headingRef : undefined}
            tabIndex={-1}
            id="onboarding-complete-title"
            className="mt-5 text-[1.75rem] font-[680] leading-tight tracking-[-0.03em] outline-none"
          >
            You’re all set
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            Your player profile is ready. Take a short tour, then create your first game or explore Relay.
          </p>
          <Link
            href={tourHref}
            className="pressable mt-7 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-hover"
          >
            Start product tour <ArrowRight aria-hidden size={16} />
          </Link>
        </section>
      </form>

      {activeStep < 3 ? (
        <form action={skipProfileSetup} noValidate className="mx-auto mt-4 max-w-2xl text-center">
          <input type="hidden" name="next" value={next} />
          <PendingSubmit
            pendingLabel="Opening tour…"
            className="pressable inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-ink"
          >
            Use my defaults and start the tour
          </PendingSubmit>
        </form>
      ) : null}
    </div>
  );
}
