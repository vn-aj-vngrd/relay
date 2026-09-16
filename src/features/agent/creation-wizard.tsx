"use client";
import { Check, X } from "@phosphor-icons/react";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  DatePickerField,
  TimeComboboxField,
} from "@/components/ui/date-time-picker";

import { sessionAccents } from "@/features/sessions/accent";
import {
  type CourtSuggestion,
  VenueCombobox,
} from "@/features/venues/venue-combobox";
import { CreationRequestError, creationRequest } from "./creation-client";
import {
  applyReplaySource,
  creationFlow,
  type ReplaySource,
} from "./creation-form-model";
import {
  creationQuestions,
  questionErrors,
  questionLabels,
  questionTitle,
} from "./creation-questions";
import type { CreationInput, CreationProposal } from "./creation-schema";
import { agentPopoverSurface } from "./popover-surface";

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
  panelHost,
  beforeChat,
  onChatMode,
}: {
  onChatMode?: () => void;
  panelHost?: HTMLElement | null;
  beforeChat?: RefObject<(() => Promise<void>) | null>;
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
  const steps = creationQuestions(input);
  const [step, setStep] = useState(() => {
    if (proposal.status === "pending") return steps.length;
    const missing = steps.findIndex(
      (item) => Object.keys(questionErrors(input, item)).length
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
  const panel = useRef<HTMLElement>(null);
  const [maxHeight, setMaxHeight] = useState(420);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const review = step === steps.length;
  const current = steps[step];
  const flow = creationFlow(input);
  const blocked = disabled || pending || reviewPending;
  useEffect(() => {
    if (!open) return;
    const resize = () => {
      const viewportTop = window.visualViewport?.offsetTop ?? 0;
      const available = panelHost
        ? panelHost.getBoundingClientRect().bottom - viewportTop - 12
        : window.innerHeight * 0.55;
      setMaxHeight(Math.max(140, Math.min(460, available)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (panelHost?.parentElement) observer.observe(panelHost.parentElement);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
    };
  }, [open, panelHost]);
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [step, open]);
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
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
  async function persist(
    action: "save" | "review",
    draft: CreationInput = { ...input, interactionMode: "questions" }
  ) {
    const signature = JSON.stringify({ action, id: saved.id, input: draft });
    let currentId = saved.id;
    // Resolve an ambiguous previous transition before changing its payload or identity.
    if (attempt.current && attempt.current.signature !== signature) {
      const recovered = await submitAttempt();
      currentId = recovered.id;
      setSaved(recovered);
      attempt.current = null;
    }
    attempt.current ??= {
      signature: JSON.stringify({ action, id: currentId, input: draft }),
      payload: {
        action,
        id: currentId,
        input: draft,
        requestId: crypto.randomUUID(),
      },
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
    if (step === steps.length - 1) {
      const missing = steps.findIndex(
        (question) => Object.keys(questionErrors(input, question)).length
      );
      if (missing >= 0 && missing !== step) {
        setStep(missing);
        setErrors(questionErrors(input, steps[missing]));
        return;
      }
    }
    const issues = questionErrors(input, current);
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
  useEffect(() => {
    if (!beforeChat || !open) return;
    const save = async () => {
      if (locked.current || reviewPending)
        throw new Error("Wait for the current creation step to finish.");
      locked.current = true;
      setPending(true);
      try {
        await persist("save");
        onDismiss();
      } finally {
        locked.current = false;
        setPending(false);
      }
    };
    beforeChat.current = save;
    return () => {
      if (beforeChat.current === save) beforeChat.current = null;
    };
  });
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
  function choices<K extends keyof CreationInput>(
    key: K,
    label: string,
    values: { value: CreationInput[K]; label: string; description?: string }[]
  ) {
    return (
      <fieldset className="space-y-1">
        <legend className="sr-only">{label}</legend>
        {values.map((item) => (
          <label
            key={String(item.value)}
            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors motion-reduce:transition-none hover:bg-surface-strong ${input[key] === item.value ? "bg-surface-strong text-ink" : "text-muted"}`}
          >
            <input
              type="radio"
              name={`${id}-${key}`}
              checked={input[key] === item.value}
              onChange={() => change(key, item.value)}
              className="mt-1 accent-primary"
            />
            <span className="min-w-0">
              <span className="font-medium">{item.label}</span>
              {item.description ? (
                <span className="mt-0.5 block text-xs text-muted">
                  {item.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>
    );
  }
  if (!open) return null;
  const content = (
    <section
      ref={panel}
      role="region"
      aria-label="Creation questions"
      style={{ maxHeight }}
      className={`flex flex-col ${agentPopoverSurface}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          if (!blocked) close();
        }
      }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <nav
          aria-label="Creation steps"
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)"
              )
            );
            const currentIndex = buttons.indexOf(
              document.activeElement as HTMLButtonElement
            );
            buttons[
              (currentIndex +
                (event.key === "ArrowRight" ? 1 : buttons.length - 1)) %
                buttons.length
            ]?.focus();
          }}
        >
          {[...steps, "review" as const].map((item, index) => (
            <button
              type="button"
              key={item}
              aria-label={`Go to ${item === "review" ? "review" : questionLabels[item].toLowerCase()}`}
              disabled={blocked}
              aria-current={step === index ? "step" : undefined}
              onClick={() => {
                if (index === steps.length) {
                  const missing = steps.findIndex(
                    (question) =>
                      Object.keys(questionErrors(input, question)).length
                  );
                  if (missing >= 0) {
                    void edit(missing);
                    return;
                  }
                  void run(async () => {
                    await persist("review");
                    setStep(steps.length);
                  });
                } else void edit(index);
              }}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium ${step === index ? "bg-surface-strong text-ink" : "text-muted hover:text-ink"}`}
            >
              {item !== "review" &&
              !Object.keys(questionErrors(input, item)).length ? (
                <Check size={12} aria-hidden />
              ) : null}
              {item === "review" ? "Review" : questionLabels[item]}
            </button>
          ))}
        </nav>
        <button
          type="button"
          aria-label="Save and close setup"
          disabled={blocked}
          onClick={close}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink"
        >
          <X size={16} aria-hidden />
        </button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4">
        <h2
          ref={heading}
          tabIndex={-1}
          className="text-sm font-semibold outline-none"
        >
          {review ? "Review and approve" : questionTitle(input, current)}
        </h2>
        <p className="mb-4 mt-1 text-xs text-muted">
          {review
            ? "Nothing is created until you approve."
            : "Choose an answer here, or tell Agent what to change in the chat below."}
        </p>
        {error ? (
          <div className="mb-3">
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
            <Button variant="quiet" disabled={blocked} onClick={onDismiss}>
              Keep answers and close
            </Button>
          </div>
        ) : null}
        {optionsError && !review ? (
          <p className="mb-3 text-sm text-muted">
            Couldn’t load courts and sources.{" "}
            <button
              type="button"
              className="text-primary"
              onClick={() => setRevision((value) => value + 1)}
            >
              Retry
            </button>
          </p>
        ) : null}
        {review ? (
          renderReview(
            saved,
            () => edit(0),
            (result) => onClose(result ?? saved),
            setReviewPending,
            pending
          )
        ) : (
          <fieldset disabled={blocked} className="space-y-4">
            {current === "source"
              ? (() => {
                  const group = flow === "groupGame";
                  const rows = group
                    ? (options?.groups ?? []).map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))
                    : (options?.hostedGames ?? [])
                        .filter(
                          (game) =>
                            game.status === "completed" &&
                            (flow === "replay" || !game.groupId)
                        )
                        .map((game) => ({ value: game.id, label: game.title }));
                  const key = group ? "groupId" : "sourceSessionId";
                  const value = input[key];
                  if (value && !rows.some((row) => row.value === value))
                    rows.unshift({ value, label: "Current selection" });
                  return (
                    <fieldset className="space-y-1">
                      <legend className="sr-only">
                        {group ? "Group" : "Your game"}
                      </legend>
                      {rows.map((row) => (
                        <label
                          key={row.value}
                          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-strong ${value === row.value ? "bg-surface-strong" : ""}`}
                        >
                          <input
                            type="radio"
                            name={`${id}-source`}
                            checked={value === row.value}
                            onChange={() => {
                              if (flow === "replay")
                                setInput((previous) =>
                                  applyReplaySource(
                                    previous,
                                    options?.hostedGames.find(
                                      (game) =>
                                        game.id === previous.sourceSessionId
                                    ),
                                    options?.hostedGames.find(
                                      (game) => game.id === row.value
                                    )
                                  )
                                );
                              else change(key, row.value);
                            }}
                          />
                          <span className="truncate">{row.label}</span>
                        </label>
                      ))}
                      {!options ? (
                        <p role="status" className="text-sm text-muted">
                          Loading choices…
                        </p>
                      ) : !rows.length ? (
                        <p className="text-sm text-muted">
                          No eligible {group ? "groups" : "completed games"}{" "}
                          found. Tell Agent a game link, or cancel to use the
                          regular creation page.
                        </p>
                      ) : null}
                      <p className="pt-2 text-xs text-muted">
                        Up to 30 recent choices.{" "}
                        {flow === "crew"
                          ? "Only completed games without a group are eligible."
                          : flow === "replay"
                            ? "Only completed games can be replayed."
                            : "You’ll review the people invited before approval."}
                      </p>
                      {errors[key] ? (
                        <p role="alert" className="text-sm text-danger">
                          {errors[key]}
                        </p>
                      ) : null}
                    </fieldset>
                  );
                })()
              : null}
            {current === "name" ? (
              <>
                {field(
                  "title",
                  input.kind === "group" ? "Group name" : "Game name",
                  input.kind === "group" ? 60 : 80
                )}
                {input.kind === "group"
                  ? field("description", "Description (optional)", 300)
                  : null}
              </>
            ) : null}
            {current === "court" ? (
              <div>
                <label htmlFor="venue" className="block text-sm font-medium">
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
                  <p id="venue-error" className="mt-1 text-xs text-danger">
                    {errors.venue}
                  </p>
                ) : null}
              </div>
            ) : null}
            {current === "schedule" ? (
              <>
                <DatePickerField
                  id={`${id}-date`}
                  label="Date (Philippine time)"
                  value={input.date ?? ""}
                  error={errors.date}
                  onValueChange={(value) => change("date", value || undefined)}
                />
                <div className="grid grid-cols-2 gap-3">
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
                    onValueChange={(value) => change("end", value || undefined)}
                  />
                </div>
              </>
            ) : null}
            {current === "players" ? (
              <div>
                <label
                  htmlFor={`${id}-players`}
                  className="text-sm font-medium"
                >
                  Player names, one per line
                </label>
                <textarea
                  id={`${id}-players`}
                  rows={4}
                  className="field mt-1.5 w-full"
                  defaultValue={input.players?.join("\n")}
                  aria-invalid={Boolean(errors.players)}
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
                  <p className="text-xs text-danger">{errors.players}</p>
                ) : null}
              </div>
            ) : null}
            {current === "roster" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {field("capacity", "Player capacity")}
                  {field("courts", "Court count")}
                </div>
                {choices("hostPlaying", "Your participation", [
                  { value: true, label: "I’m playing" },
                  { value: false, label: "I’m organizing only" },
                ])}
              </>
            ) : null}
            {current === "courts" ? field("courts", "Court count") : null}
            {current === "format"
              ? choices("mode", "Format", [
                  {
                    value: "queue",
                    label: "Paddle Stack",
                    description: "Rotate through a player queue.",
                  },
                  {
                    value: "random",
                    label: "Mix It Up",
                    description: "Randomize the matchups.",
                  },
                  {
                    value: "balanced",
                    label: "Balanced Mix",
                    description: "Balance matchups across players.",
                  },
                  {
                    value: "king_of_court",
                    label: "Court Climb",
                    description: "Move between courts based on results.",
                  },
                ])
              : null}
            {current === "access" ? (
              <>
                {choices("visibility", "Visibility", [
                  {
                    value: "link",
                    label: "Anyone with the link",
                    description: "Share the game directly with your players.",
                  },
                  {
                    value: "private",
                    label: "Private",
                    description: "Keep the game for invited players.",
                  },
                  {
                    value: "public",
                    label: "Public",
                    description:
                      "List the game when its publication requirements are met.",
                  },
                ])}
                {choices("requiresApproval", "Join approval", [
                  { value: false, label: "No approval needed" },
                  { value: true, label: "Approve requests to join" },
                ])}
              </>
            ) : null}
            {current === "payment"
              ? choices("costKind", "Payment", [
                  { value: "unspecified", label: "Decide later" },
                  { value: "free", label: "Free to play" },
                  {
                    value: "collect",
                    label: "Collect payment",
                    description:
                      "Set up amounts and instructions after creation.",
                  },
                ])
              : null}
            {current === "finish" ? (
              <>
                {choices("intent", "Create as", [
                  {
                    value: "published",
                    label: "Publish the game",
                    description: "Send the invitations shown in your review.",
                  },
                  {
                    value: "draft",
                    label: "Save a draft",
                    description: "Keep planning; no invitations are sent.",
                  },
                ])}
                <details>
                  <summary className="cursor-pointer text-sm text-muted">
                    Game color and notes
                  </summary>
                  <div className="mt-3 space-y-3">
                    {choices(
                      "accentColor",
                      "Game color",
                      sessionAccents.map((accent) => ({
                        value: accent.id,
                        label: accent.label,
                      }))
                    )}
                    {field("notes", "Notes (optional)", 1200)}
                  </div>
                </details>
              </>
            ) : null}
          </fieldset>
        )}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
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
        {!review && onChatMode ? (
          <Button
            variant="quiet"
            disabled={blocked}
            onClick={() =>
              void run(async () => {
                const result = await persist("save", {
                  ...input,
                  interactionMode: "chat",
                });
                if (beforeChat) beforeChat.current = null;
                onClose(result);
                onChatMode();
              })
            }
          >
            Answer in chat
          </Button>
        ) : null}
        <span className="text-xs text-muted">
          {step + 1} of {steps.length + 1}
        </span>
        <div className="flex gap-2">
          {step > 0 ? (
            <Button
              variant="quiet"
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
    </section>
  );
  return panelHost ? createPortal(content, panelHost) : content;
}
