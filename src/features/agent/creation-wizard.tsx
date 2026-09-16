"use client";
import { X } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DatePickerField,
  TimeComboboxField,
} from "@/components/ui/date-time-picker";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { sessionAccents } from "@/features/sessions/accent";
import {
  type CourtSuggestion,
  VenueCombobox,
} from "@/features/venues/venue-combobox";
import { CreationRequestError, creationRequest } from "./creation-client";
import {
  applyReplaySource,
  creationFieldErrors,
  creationFlow,
  creationFlowLabels,
  creationStepLabels,
  creationSteps,
  type ReplaySource,
} from "./creation-form-model";
import type { CreationInput, CreationProposal } from "./creation-schema";

type Options = {
  groups: { id: string; name: string }[];
  hostedGames: (ReplaySource & {
    status: string;
    groupId: string | null;
  })[];
  courts: (Omit<CourtSuggestion, "address"> & { address: string | null })[];
};
export function AgentCreationWizard({
  proposal,
  open,
  disabled,
  onClose,
  onDismiss,
  renderReview,
}: {
  proposal: CreationProposal;
  open: boolean;
  disabled: boolean;
  onClose: (saved: CreationProposal) => void;
  onDismiss: () => void;
  renderReview: (
    saved: CreationProposal,
    edit: () => void,
    changed: (saved?: CreationProposal) => void,
    pendingChanged: (pending: boolean) => void,
    busy: boolean
  ) => ReactNode;
}) {
  const [saved, setSaved] = useState(proposal);
  const [input, setInput] = useState(proposal.input);
  const steps = creationSteps(input);
  const [step, setStep] = useState(() => {
    if (proposal.status === "pending") return steps.length;
    const missing = steps.findIndex(
      (item) => Object.keys(creationFieldErrors(input, item)).length
    );
    return missing < 0 ? steps.length - 1 : missing;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);
  const locked = useRef(false);
  const attempt = useRef<{
    signature: string;
    payload: {
      action: "save" | "review";
      id: string;
      input: CreationInput;
      requestId: string;
    };
  } | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [revision, setRevision] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const review = step === steps.length;
  const current = steps[step];
  const flow = creationFlow(input);
  const blocked = disabled || pending || reviewPending;
  useEffect(() => {
    const element = dialog.current;
    if (!open) {
      element?.close();
      return;
    }
    element?.showModal();
    const resize = () => {
      if (element && window.visualViewport) {
        element.style.transform = window.matchMedia("(max-width: 639px)")
          .matches
          ? `translateY(-${Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop)}px)`
          : "";
        element.style.maxHeight = `${Math.max(120, window.visualViewport.height - 24)}px`;
      }
    };
    resize();
    window.visualViewport?.addEventListener("resize", resize);
    return () => {
      window.visualViewport?.removeEventListener("resize", resize);
      element?.close();
    };
  }, [open]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    dialog.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [errors]);
  useEffect(() => {
    const controller = new AbortController();
    setOptionsError(false);
    void creationRequest<Options>("/api/agent/creations?options=true", {
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) setOptions(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setOptionsError(true);
      });
    return () => controller.abort();
  }, [revision]);
  function change<K extends keyof CreationInput>(
    key: K,
    value: CreationInput[K]
  ) {
    setInput((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setError("");
  }
  async function submitAttempt() {
    if (!attempt.current) throw new Error("No setup request to retry.");
    try {
      return await creationRequest<CreationProposal>("/api/agent/creations", {
        method: "PUT",
        body: JSON.stringify(attempt.current.payload),
      });
    } catch (failure) {
      if (failure instanceof CreationRequestError && failure.status < 500)
        attempt.current = null;
      throw failure;
    }
  }
  async function persist(action: "save" | "review") {
    const signature = JSON.stringify({ action, id: saved.id, input });
    let currentId = saved.id;
    // Resolve an ambiguous previous transition before changing its payload or identity.
    if (attempt.current && attempt.current.signature !== signature) {
      const recovered = await submitAttempt();
      currentId = recovered.id;
      setSaved(recovered);
      attempt.current = null;
    }
    attempt.current ??= {
      signature: JSON.stringify({ action, id: currentId, input }),
      payload: { action, id: currentId, input, requestId: crypto.randomUUID() },
    };
    const next = await submitAttempt();
    attempt.current = null;
    setSaved(next);
    setInput(next.input);
    return next;
  }
  async function run(work: () => Promise<void>) {
    if (locked.current || disabled || reviewPending) return;
    locked.current = true;
    setPending(true);
    setError("");
    try {
      await work();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Couldn’t save setup. Try again."
      );
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  function next() {
    const issues = creationFieldErrors(input, current);
    setErrors(issues);
    if (Object.keys(issues).length) return;
    void run(async () => {
      await persist(step === steps.length - 1 ? "review" : "save");
      setStep(step + 1);
    });
  }
  function edit(index: number) {
    void run(async () => {
      if (review) await persist("save");
      setErrors({});
      setStep(index);
    });
  }
  function close() {
    void run(async () => {
      onClose(review ? saved : await persist("save"));
    });
  }
  const field = (
    key: "title" | "description" | "capacity" | "courts" | "notes",
    label: string,
    maxLength?: number
  ) => (
    <div>
      <label className="block text-sm font-medium" htmlFor={`${id}-${key}`}>
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        className="field mt-1.5 w-full"
        type={key === "capacity" || key === "courts" ? "number" : "text"}
        value={input[key] ?? ""}
        maxLength={maxLength}
        min={key === "capacity" ? 2 : key === "courts" ? 1 : undefined}
        max={
          key === "capacity"
            ? 40
            : key === "courts"
              ? input.kind === "quickPlay"
                ? 6
                : 20
              : undefined
        }
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
        onChange={(event) => {
          const value = event.target.value;
          if (key === "capacity" || key === "courts")
            change(key, value ? Number(value) : undefined);
          else change(key, value || undefined);
        }}
      />
      {errors[key] ? (
        <span
          id={`${id}-${key}-error`}
          className="mt-1 block text-xs text-danger"
        >
          {errors[key]}
        </span>
      ) : null}
    </div>
  );
  const select = <
    K extends "visibility" | "costKind" | "mode" | "intent" | "accentColor",
  >(
    key: K,
    label: string,
    values: { value: NonNullable<CreationInput[K]>; label: string }[]
  ) => (
    <SelectField
      id={`${id}-${key}`}
      label={label}
      value={input[key] ?? (key === "accentColor" ? "violet" : "")}
      options={values}
      onValueChange={(value) => change(key, value as CreationInput[K])}
    />
  );
  return (
    <Dialog
      ref={dialog}
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-hint`}
      onCancel={(event) => {
        event.preventDefault();
        if (!blocked) close();
      }}
      className="!mb-0 !mt-auto !w-full !max-w-3xl !rounded-b-none sm:!mb-auto sm:!w-[calc(100%_-_2rem)] sm:!rounded-xl"
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs text-muted">
              Step {step + 1} of {steps.length + 1} · {creationFlowLabels[flow]}
            </p>
            <h2
              ref={heading}
              tabIndex={-1}
              id={`${id}-heading`}
              className="mt-1 text-lg font-semibold outline-none"
            >
              {review
                ? "Review and approve"
                : current === "source"
                  ? flow === "groupGame"
                    ? "Choose your group"
                    : "Choose a game"
                  : current === "details"
                    ? input.kind === "group"
                      ? "Group details"
                      : "Court and schedule"
                    : current === "players"
                      ? "Who’s playing?"
                      : input.kind === "quickPlay"
                        ? "Courts and format"
                        : "Players and settings"}
            </h2>
            <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
              Nothing is created until you approve the final review.
            </p>
          </div>
          <button
            type="button"
            aria-label="Save and close setup"
            disabled={blocked}
            onClick={close}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5">
          {error ? (
            <div className="mb-4">
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
              <Button variant="quiet" disabled={blocked} onClick={onDismiss}>
                Keep answers and close
              </Button>
            </div>
          ) : null}
          {optionsError && !review ? (
            <div className="mb-4 text-sm text-muted">
              Couldn’t load courts and sources.{" "}
              <button
                type="button"
                className="text-primary"
                onClick={() => setRevision((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          ) : null}
          {review ? (
            <>
              <div className="flex flex-wrap gap-2">
                {steps.map((item, index) => (
                  <Button
                    key={item}
                    variant="quiet"
                    disabled={blocked}
                    onClick={() => edit(index)}
                  >
                    Edit {creationStepLabels[item].toLowerCase()}
                  </Button>
                ))}
              </div>
              {renderReview(
                saved,
                () => edit(0),
                (result) => onClose(result ?? saved),
                setReviewPending,
                pending
              )}
            </>
          ) : (
            <fieldset disabled={blocked} className="space-y-5">
              {current === "source"
                ? (() => {
                    const group = flow === "groupGame";
                    const rows = group
                      ? (options?.groups ?? []).map((item) => ({
                          value: item.id,
                          label: item.name,
                        }))
                      : (options?.hostedGames ?? [])
                          .filter((game) =>
                            flow === "replay"
                              ? game.status === "completed"
                              : game.status === "completed" && !game.groupId
                          )
                          .map((game) => ({
                            value: game.id,
                            label: game.title,
                          }));
                    const value = group ? input.groupId : input.sourceSessionId;
                    if (value && !rows.some((item) => item.value === value))
                      rows.unshift({ value, label: "Current selection" });
                    return (
                      <>
                        <SelectField
                          id={`${id}-source`}
                          label={group ? "Group" : "Your game"}
                          value={value ?? ""}
                          options={[
                            {
                              value: "",
                              label: options ? "Choose one" : "Loading…",
                            },
                            ...rows,
                          ]}
                          error={errors[group ? "groupId" : "sourceSessionId"]}
                          onValueChange={(selected) => {
                            change(
                              group ? "groupId" : "sourceSessionId",
                              selected || undefined
                            );
                            const game = options?.hostedGames.find(
                              (item) => item.id === selected
                            );
                            if (flow === "replay" && (game || !selected))
                              setInput((previous) =>
                                applyReplaySource(
                                  previous,
                                  options?.hostedGames.find(
                                    (item) => item.id === input.sourceSessionId
                                  ),
                                  game
                                )
                              );
                          }}
                        />
                        <p className="text-xs text-muted">
                          Shows up to 30 of your recent games and groups.{" "}
                          {flow === "replay"
                            ? "Only completed games can be replayed."
                            : flow === "crew"
                              ? "Only your completed games without a group are eligible."
                              : "The final review lists everyone who will be invited."}
                        </p>
                        {options && !rows.length ? (
                          <p className="text-sm text-muted">
                            No eligible {group ? "groups" : "games"} found.
                            Cancel and use the regular creation page, or give
                            Agent a game link.
                          </p>
                        ) : null}
                      </>
                    );
                  })()
                : null}
              {current === "details" ? (
                <>
                  {field(
                    "title",
                    input.kind === "group" ? "Group name" : "Game name",
                    input.kind === "group" ? 60 : 80
                  )}
                  {input.kind === "group" ? (
                    field("description", "Description (optional)", 300)
                  ) : (
                    <>
                      <div>
                        <label
                          htmlFor="venue"
                          className="block text-sm font-medium"
                        >
                          Court
                        </label>
                        <VenueCombobox
                          courts={(options?.courts ?? []).map((court) => ({
                            ...court,
                            address: court.address ?? "",
                          }))}
                          defaultValue={input.venue}
                          defaultVenueId={input.venueId}
                          defaultAddress={input.venueAddress}
                          error={errors.venue}
                          onSelectionChange={(value) =>
                            setInput((previous) => ({
                              ...previous,
                              venue: value.venue || undefined,
                              venueId: value.venueId,
                              venueAddress: value.venueAddress,
                            }))
                          }
                        />
                        {errors.venue ? (
                          <p
                            id="venue-error"
                            className="mt-1 text-xs text-danger"
                          >
                            {errors.venue}
                          </p>
                        ) : null}
                      </div>
                      <DatePickerField
                        id={`${id}-date`}
                        label="Date (Philippine time)"
                        value={input.date ?? ""}
                        error={errors.date}
                        onValueChange={(value) =>
                          change("date", value || undefined)
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <TimeComboboxField
                          id={`${id}-start`}
                          label="Start time"
                          value={input.start ?? ""}
                          error={errors.start}
                          onValueChange={(value) =>
                            change("start", value || undefined)
                          }
                        />
                        <TimeComboboxField
                          id={`${id}-end`}
                          label="End time"
                          value={input.end ?? ""}
                          error={errors.end}
                          onValueChange={(value) =>
                            change("end", value || undefined)
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              ) : null}
              {current === "players" ? (
                <label
                  className="block text-sm font-medium"
                  htmlFor={`${id}-players`}
                >
                  Player names, one per line
                  <textarea
                    id={`${id}-players`}
                    rows={5}
                    className="field mt-1.5 w-full"
                    defaultValue={input.players?.join("\n")}
                    aria-invalid={Boolean(errors.players)}
                    aria-describedby={
                      errors.players ? `${id}-players-error` : undefined
                    }
                    onChange={(event) =>
                      change(
                        "players",
                        event.target.value
                          .split("\n")
                          .map((name) => name.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                  {errors.players ? (
                    <span
                      id={`${id}-players-error`}
                      className="mt-1 block text-xs text-danger"
                    >
                      {errors.players}
                    </span>
                  ) : null}
                </label>
              ) : null}
              {current === "settings" ? (
                <>
                  {input.kind === "game"
                    ? field("capacity", "Player capacity")
                    : null}
                  {field("courts", "Court count")}
                  {input.kind === "quickPlay" ? (
                    select("mode", "Format", [
                      { value: "queue", label: "Paddle Stack" },
                      { value: "random", label: "Mix It Up" },
                      { value: "balanced", label: "Balanced Mix" },
                      { value: "king_of_court", label: "Court Climb" },
                    ])
                  ) : (
                    <>
                      {select("visibility", "Visibility", [
                        { value: "link", label: "Link only" },
                        { value: "private", label: "Private" },
                        { value: "public", label: "Public" },
                      ])}
                      {select(
                        "accentColor",
                        "Game color",
                        sessionAccents.map((accent) => ({
                          value: accent.id,
                          label: accent.label,
                        }))
                      )}
                      {select("costKind", "Payment", [
                        { value: "unspecified", label: "Decide later" },
                        { value: "free", label: "Free" },
                        {
                          value: "collect",
                          label: "Set up collection after creation",
                        },
                      ])}
                      {select("intent", "Create as", [
                        { value: "published", label: "Published game" },
                        { value: "draft", label: "Draft (no invitations)" },
                      ])}
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={input.hostPlaying}
                          onChange={(event) =>
                            change("hostPlaying", event.target.checked)
                          }
                        />
                        I’m playing
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={input.requiresApproval}
                          onChange={(event) =>
                            change("requiresApproval", event.target.checked)
                          }
                        />
                        Require approval to join
                      </label>
                      {field("notes", "Notes (optional)", 1200)}
                    </>
                  )}
                </>
              ) : null}
            </fieldset>
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="quiet"
            disabled={blocked}
            onClick={() =>
              void run(async () => {
                const current = attempt.current ? await submitAttempt() : saved;
                attempt.current = null;
                setSaved(current);
                const cancelled = await creationRequest<CreationProposal>(
                  "/api/agent/creations",
                  {
                    method: "POST",
                    body: JSON.stringify({ id: current.id, action: "cancel" }),
                  }
                );
                onClose(cancelled);
              })
            }
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button
                variant="secondary"
                disabled={blocked}
                onClick={() => edit(step - 1)}
              >
                Back
              </Button>
            ) : null}
            {!review ? (
              <Button disabled={blocked} onClick={next}>
                {pending
                  ? "Saving…"
                  : step === steps.length - 1
                    ? "Review"
                    : "Next"}
              </Button>
            ) : null}
          </div>
        </footer>
      </div>
    </Dialog>
  );
}
