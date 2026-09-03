"use client";

import { Bug, ChatCircleText, Lightbulb } from "@phosphor-icons/react";
import { useActionState, useEffect, useRef, useState } from "react";

import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { type FeedbackActionState, submitFeedbackAction } from "./actions";
import {
  type FeedbackType,
  feedbackAreaLabels,
  feedbackAreas,
  feedbackTypeLabels,
  feedbackTypes,
} from "./domain";

const typeDetails: Record<
  FeedbackType,
  { description: string; icon: typeof Bug }
> = {
  bug: { description: "Something is broken or confusing", icon: Bug },
  feature: {
    description: "A useful improvement for game night",
    icon: Lightbulb,
  },
  general: {
    description: "Share what works or could feel better",
    icon: ChatCircleText,
  },
};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? (
    <p className="mt-1.5 text-sm font-medium text-danger" role="alert">
      {errors[0]}
    </p>
  ) : null;
}

export function FeedbackForm({
  gameContext,
}: {
  gameContext?: { sessionId: string; pagePath: string };
}) {
  const [state, action] = useActionState<FeedbackActionState, FormData>(
    submitFeedbackAction,
    {}
  );
  const [type, setType] = useState<FeedbackType>("bug");
  const formRef = useRef<HTMLFormElement>(null);
  const preserveValues = usePreserveFormValuesOnError(state);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      noValidate
      ref={formRef}
      action={action}
      onSubmitCapture={preserveValues}
      className="border-y border-line py-6 sm:py-8"
    >
      {gameContext ? (
        <div className="mb-6 border-y border-line bg-surface-strong px-3 py-3 text-sm">
          <p className="font-semibold">Feedback from your completed game</p>
          <p className="mt-1 leading-5 text-muted">
            The game and recap page will be attached automatically.
          </p>
          <input type="hidden" name="sessionId" value={gameContext.sessionId} />
          <input type="hidden" name="experience" value="issues" />
        </div>
      ) : null}
      <fieldset>
        <legend className="text-sm font-[650]">
          What would you like to share?
        </legend>
        <div className="mt-2 divide-y divide-line border-y border-line">
          {feedbackTypes.map((value) => {
            const Icon = typeDetails[value].icon;
            const selected = type === value;
            return (
              <label
                key={value}
                className="flex min-h-16 cursor-pointer items-center gap-3 px-1 py-3 sm:px-2"
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={selected}
                  onChange={() => setType(value)}
                  className="sr-only"
                />
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-primary-soft text-primary" : "bg-surface-strong text-muted"}`}
                >
                  <Icon
                    aria-hidden
                    size={18}
                    weight={selected ? "fill" : "regular"}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">
                    {feedbackTypeLabels[value]}
                  </strong>
                  <span className="mt-0.5 block text-sm text-muted">
                    {typeDetails[value].description}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`h-4 w-4 rounded-full border-4 ${selected ? "border-primary bg-surface" : "border-line bg-surface"}`}
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-6">
        <div>
          <SelectField
            id="feedback-area"
            name="area"
            label="Which part of Relay?"
            defaultValue={gameContext ? "play" : "general"}
            options={feedbackAreas.map((area) => ({
              value: area,
              label: feedbackAreaLabels[area],
            }))}
          />
          <FieldError errors={state.fieldErrors?.area} />
        </div>
        <div>
          <label htmlFor="feedback-title" className="block text-sm font-[650]">
            Short title
          </label>
          <input
            id="feedback-title"
            name="title"
            required
            minLength={5}
            maxLength={100}
            placeholder={
              type === "bug"
                ? "Score button does not respond"
                : type === "feature"
                  ? "Let hosts copy a player queue"
                  : "The RSVP flow felt clear"
            }
            className="field"
            aria-describedby={
              state.fieldErrors?.title ? "feedback-title-error" : undefined
            }
          />
          <div id="feedback-title-error">
            <FieldError errors={state.fieldErrors?.title} />
          </div>
        </div>
        <div>
          <label
            htmlFor="feedback-description"
            className="block text-sm font-[650]"
          >
            Details
          </label>
          <textarea
            id="feedback-description"
            name="description"
            required
            minLength={15}
            maxLength={3000}
            rows={6}
            placeholder={
              type === "bug"
                ? "What happened, what did you expect, and can you make it happen again?"
                : type === "feature"
                  ? "What are you trying to do, and how would this make game night easier?"
                  : "Tell us what worked well or what could be clearer."
            }
            className="field min-h-36 resize-y !p-3.5 leading-6"
            aria-describedby={
              state.fieldErrors?.description
                ? "feedback-description-error"
                : undefined
            }
          />
          <div id="feedback-description-error">
            <FieldError errors={state.fieldErrors?.description} />
          </div>
        </div>
        <div>
          <label htmlFor="feedback-page" className="block text-sm font-[650]">
            Related Relay page{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="feedback-page"
            name="pagePath"
            maxLength={300}
            defaultValue={gameContext?.pagePath}
            readOnly={Boolean(gameContext)}
            placeholder="/games/…"
            className="field read-only:bg-surface-strong read-only:text-muted"
          />
          <p className="mt-1.5 text-xs leading-5 text-muted">
            Paste the path after relay-pickleball.vercel.app.
          </p>
          <FieldError errors={state.fieldErrors?.pagePath} />
        </div>
      </div>

      <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="contactAllowed"
          defaultChecked
          className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
        />
        <span>
          <strong className="block text-sm">
            Relay may contact me about this
          </strong>
          <span className="mt-0.5 block text-sm text-muted">
            We will use the email on your account only when clarification helps.
          </span>
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="mt-5 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-5 text-sm font-semibold text-success">
          {state.success}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
        <p className="hidden max-w-md text-xs leading-5 text-muted sm:block">
          Please avoid passwords, payment details, or other private information.
        </p>
        <SubmitButton
          pendingLabel="Sending feedback…"
          className="ml-auto w-full sm:w-auto"
        >
          Send feedback
        </SubmitButton>
      </div>
    </form>
  );
}
