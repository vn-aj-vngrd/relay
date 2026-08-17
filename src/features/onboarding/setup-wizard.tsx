"use client";

import { ArrowLeft, ArrowRight, LinkSimple, TennisBall, UserCircle } from "@phosphor-icons/react";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { completeProfileSetup, skipProfileSetup, type OnboardingActionState } from "./actions";

const steps = [
  { title: "Your player profile", description: "The name friends will recognize on invites and scoreboards.", icon: UserCircle },
  { title: "How you play", description: "Optional details that make team lists and profiles more useful.", icon: TennisBall },
  { title: "You’re ready", description: "One last optional question, then a quick look around Relay.", icon: LinkSimple },
] as const;

const fieldClass = "mt-1.5 h-12 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="min-w-36" disabled={pending}>{pending ? <><ButtonSpinner />Saving…</> : <>Save and continue<ArrowRight aria-hidden size={16} /></>}</Button>;
}

function Choice({ name, value, label, description, defaultChecked }: { name: string; value: string; label: string; description?: string; defaultChecked?: boolean }) {
  return <label className="pressable flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft/55">
    <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
    <span><strong className="block text-sm font-semibold">{label}</strong>{description ? <span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span> : null}</span>
  </label>;
}

export function SetupWizard({ initial }: { initial: { name: string; username: string; city: string; skillLevel: string; dominantHand: string } }) {
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState("");
  const [state, action] = useActionState<OnboardingActionState, FormData>(completeProfileSetup, {});
  const formRef = useRef<HTMLFormElement>(null);
  const StepIcon = steps[step].icon;

  function continueFromProfile() {
    const data = new FormData(formRef.current ?? undefined);
    const name = String(data.get("name") ?? "").trim();
    const username = String(data.get("username") ?? "").trim();
    if (name.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(username) || username.length < 3) {
      setLocalError("Add your name and a valid username before continuing.");
      return;
    }
    setLocalError("");
    setStep(1);
  }

  return <div className="w-full max-w-[720px]">
    <div className="mb-8 flex items-center justify-between gap-4"><div role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} className="flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((item, index) => <span key={item.title} className={`h-1.5 w-10 rounded-full ${index <= step ? "bg-primary" : "bg-surface-strong"}`} />)}</div><span className="score text-xs font-semibold text-muted">{step + 1} / {steps.length}</span></div>

    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <header><StepIcon aria-hidden size={24} className="text-primary" /><h1 className="mt-5 text-[1.75rem] font-[680] leading-tight tracking-[-0.03em]">{steps[step].title}</h1><p className="mt-3 text-sm leading-6 text-muted">{steps[step].description}</p><p className="mt-4 text-xs text-muted">Usually under a minute.</p></header>

      <div>
        {state.error ? <div role="alert" className="mb-5 rounded-lg bg-danger/8 px-3.5 py-3 text-sm text-danger ring-1 ring-danger/15"><p className="font-semibold">{state.error}</p>{state.fieldErrors?.username ? <button type="button" onClick={() => setStep(0)} className="mt-1 font-semibold underline underline-offset-2">Review profile details</button> : null}</div> : null}
        <form ref={formRef} action={action} noValidate>
          <fieldset hidden={step !== 0} className="space-y-5">
            <legend className="sr-only">Player profile</legend>
            <div><label htmlFor="onboarding-name" className="text-sm font-semibold">Name</label><input id="onboarding-name" name="name" className={fieldClass} defaultValue={initial.name} required minLength={2} maxLength={60} autoComplete="name" /><p className="mt-1.5 text-xs text-muted">Use the name your friends call you.</p>{state.fieldErrors?.name ? <p className="mt-1 text-sm text-danger">{state.fieldErrors.name[0]}</p> : null}</div>
            <div><label htmlFor="onboarding-username" className="text-sm font-semibold">Username</label><div className="relative"><span className="pointer-events-none absolute left-3.5 top-[17px] text-muted">@</span><input id="onboarding-username" name="username" className={`${fieldClass} pl-8`} defaultValue={initial.username} required minLength={3} maxLength={24} autoCapitalize="none" autoCorrect="off" spellCheck={false} /></div><p className="mt-1.5 text-xs text-muted">Lowercase letters, numbers, and hyphens.</p>{state.fieldErrors?.username ? <p className="mt-1 text-sm text-danger">{state.fieldErrors.username[0]}</p> : null}</div>
            <div><label htmlFor="onboarding-city" className="text-sm font-semibold">City <span className="font-normal text-muted">Optional</span></label><input id="onboarding-city" name="city" className={fieldClass} defaultValue={initial.city} maxLength={60} autoComplete="address-level2" placeholder="Mandaluyong" /><p className="mt-1.5 text-xs text-muted">Helps friends recognize the right player.</p></div>
            {localError ? <p role="alert" className="text-sm font-medium text-danger">{localError}</p> : null}
          </fieldset>

          <fieldset hidden={step !== 1} className="space-y-7">
            <legend className="sr-only">Playing preferences</legend>
            <div><p className="text-sm font-semibold">Playing experience <span className="font-normal text-muted">Optional</span></p><div className="mt-2 grid gap-2 sm:grid-cols-2"><Choice name="skillLevel" value="new" label="Just starting" defaultChecked={initial.skillLevel === "new"} /><Choice name="skillLevel" value="casual" label="Casual" description="I play now and then" defaultChecked={initial.skillLevel === "casual"} /><Choice name="skillLevel" value="regular" label="Regular" description="I play most weeks" defaultChecked={initial.skillLevel === "regular"} /><Choice name="skillLevel" value="experienced" label="Experienced" defaultChecked={initial.skillLevel === "experienced"} /></div><p className="mt-2 text-xs leading-5 text-muted">This is social context, not a competitive rating.</p></div>
            <div><p className="text-sm font-semibold">Dominant hand <span className="font-normal text-muted">Optional</span></p><div className="mt-2 grid grid-cols-3 gap-2"><Choice name="dominantHand" value="right" label="Right" defaultChecked={initial.dominantHand === "right"} /><Choice name="dominantHand" value="left" label="Left" defaultChecked={initial.dominantHand === "left"} /><Choice name="dominantHand" value="both" label="Both" defaultChecked={initial.dominantHand === "both"} /></div></div>
          </fieldset>

          <fieldset hidden={step !== 2} className="space-y-5">
            <legend className="sr-only">Finish setup</legend>
            <SelectField id="discovery-source" name="discoverySource" label="How did you discover Relay? (optional)" defaultValue="" options={[{ value: "", label: "Choose an answer" }, { value: "friend", label: "A friend" }, { value: "group_chat", label: "A group chat or shared game" }, { value: "social", label: "Social media" }, { value: "search", label: "Web search" }, { value: "other", label: "Somewhere else" }]} />
            <div className="border-y border-line py-4"><p className="text-sm font-semibold">Next: a quick look around</p><p className="mt-1 text-sm leading-6 text-muted">Relay will point out Create, Games, Search, notifications, and your profile in the real app.</p></div>
          </fieldset>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            {step > 0 ? <Button type="button" variant="quiet" onClick={() => setStep((current) => current - 1)}><ArrowLeft aria-hidden size={16} />Back</Button> : <span />}
            {step === 0 ? <Button type="button" onClick={continueFromProfile}>Continue<ArrowRight aria-hidden size={16} /></Button> : step === 1 ? <Button type="button" onClick={() => setStep(2)}>Continue<ArrowRight aria-hidden size={16} /></Button> : <SubmitButton />}
          </div>
        </form>
      </div>
    </div>

    <form action={skipProfileSetup} className="mt-8 border-t border-line pt-5 text-center"><PendingSubmit pendingLabel="Skipping setup…" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-ink">Skip setup and use my defaults</PendingSubmit></form>
  </div>;
}
