"use client";

import { Check, Question, ShareNetwork, UserCircle, X } from "@phosphor-icons/react";
import { useActionState, useState } from "react";

import { Button, ButtonLink, ButtonSpinner } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { playingExperienceOptions } from "@/features/players/playing-experience";

import { rsvpAction } from "./actions";

type Choice = "going" | "maybe" | "declined";
type CurrentRsvp = Choice | "invited" | "pending" | "waitlisted";

const choices = [
  { value: "going" as const, label: "Going", icon: Check },
  { value: "maybe" as const, label: "Maybe", icon: Question },
  { value: "declined" as const, label: "Can’t go", icon: X },
];

function initialChoice(rsvp?: CurrentRsvp): Choice {
  return rsvp === "maybe" || rsvp === "declined" ? rsvp : "going";
}

export function RsvpControl({
  sessionId,
  slug,
  signedIn = false,
  accountName,
  guestName,
  currentRsvp,
  currentSkillLevel,
  locked = false,
  instance = "default",
}: {
  sessionId: string;
  slug: string;
  signedIn?: boolean;
  accountName?: string;
  guestName?: string | null;
  currentRsvp?: CurrentRsvp;
  currentSkillLevel?: string | null;
  locked?: boolean;
  instance?: "mobile" | "desktop" | "default";
}) {
  const [choice, setChoice] = useState<Choice>(() => initialChoice(currentRsvp));
  const [state, action, pending] = useActionState(rsvpAction, {});
  const [shareMessage, setShareMessage] = useState("");
  const isReturningGuest = Boolean(guestName);
  const nameInputId = `guest-${instance}-${sessionId}`;
  const signInHref = `/login?next=${encodeURIComponent(`/s/${slug}`)}`;

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage("Link copied");
        window.setTimeout(() => setShareMessage(""), 2500);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setShareMessage("Copy the address from your browser to share.");
    }
  }

  const responseMessage = state.success
    ? state.rsvp === "pending"
      ? "Request sent. The host will approve your spot."
      : state.rsvp === "waitlisted"
        ? "The game is full. You’re on the waitlist."
        : "Response saved."
    : null;

  return (
    <div>
      {locked ? (
        <div className="rounded-lg bg-surface-strong px-4 py-4">
          <p className="font-semibold">The roster is closed</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            The host has paused new responses. You can still view the plan, players, and live scores.
          </p>
        </div>
      ) : (
        <>
          <form action={action} className="space-y-3">
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="choice" value={choice} />
            {isReturningGuest ? (
              <div className="flex min-h-14 items-center gap-3 rounded-lg bg-surface-strong px-3 py-2.5">
                <UserCircle aria-hidden size={21} className="shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{guestName}</p>
                  <p className="text-xs text-muted">Guest player</p>
                </div>
              </div>
            ) : signedIn ? (
              <div className="flex min-h-14 items-center gap-3 rounded-lg bg-surface-strong px-3 py-2.5">
                <UserCircle aria-hidden size={21} className="shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{accountName || "Your Relay account"}</p>
                  <p className="text-xs text-muted">Signed in</p>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor={nameInputId} className="text-sm font-semibold">
                  Your name
                </label>
                <input
                  id={nameInputId}
                  name="guestName"
                  required
                  minLength={2}
                  maxLength={60}
                  autoComplete="name"
                  placeholder="e.g. Mika Reyes…"
                  className="mt-1.5 h-12 w-full rounded-[10px] border border-line bg-surface px-3.5 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <p className="mt-1.5 text-xs text-muted">Your name is only visible in this game.</p>
              </div>
            )}
            <SelectField
              id={`rsvp-experience-${instance}-${sessionId}`}
              name="skillLevel"
              label="Playing experience (optional)"
              defaultValue={currentSkillLevel ?? ""}
              options={[
                { value: "", label: "Prefer not to say" },
                ...playingExperienceOptions.map(({ value, label }) => ({ value, label })),
              ]}
            />
            <p className="-mt-1 text-xs leading-5 text-muted">
              Helps Relay make closer teams when the host chooses Balanced Mix.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {choices.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setChoice(value)}
                  aria-pressed={choice === value}
                  className={`pressable inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2 text-[13px] font-[600] leading-none ${choice === value ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface hover:bg-surface-strong"}`}
                >
                  <Icon
                    aria-hidden
                    className="shrink-0"
                    size={15}
                    weight={value === "going" && choice === value ? "bold" : "regular"}
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <>
                  <ButtonSpinner />
                  Saving…
                </>
              ) : currentRsvp ? (
                "Update response"
              ) : choice === "going" ? (
                "Confirm I’m going"
              ) : (
                "Save response"
              )}
            </Button>
            {state.error ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {state.error}
              </p>
            ) : responseMessage ? (
              <p role="status" className="text-sm font-medium text-primary">
                {responseMessage}
              </p>
            ) : currentRsvp ? (
              <p className="text-xs text-muted">
                Current response: <span className="font-medium capitalize text-ink">{currentRsvp}</span>
              </p>
            ) : null}
          </form>
          {!signedIn && !isReturningGuest ? (
            <div className="mt-4 border-t border-line pt-4 text-center">
              <ButtonLink href={signInHref} variant="secondary" className="w-full">
                Use a Relay account
              </ButtonLink>
              <p className="mt-1.5 text-xs text-muted">Keep this game and future sessions in your history.</p>
            </div>
          ) : null}
        </>
      )}
      <Button type="button" variant="secondary" onClick={share} className="mt-3 w-full">
        <ShareNetwork aria-hidden size={16} />
        <span>{shareMessage === "Link copied" ? "Link copied" : "Share game"}</span>
      </Button>
      {shareMessage && shareMessage !== "Link copied" ? (
        <p aria-live="polite" className="mt-2 text-center text-xs text-danger">
          {shareMessage}
        </p>
      ) : (
        <span className="sr-only" aria-live="polite">
          {shareMessage}
        </span>
      )}
    </div>
  );
}
