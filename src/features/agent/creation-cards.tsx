"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { creationRequest } from "./creation-client";
import { creationProgress } from "./creation-progress";
import type { CreationProposal } from "./creation-schema";
export function useCreationProposals(
  conversationId: string | null,
  busy: boolean,
  enabled: boolean
) {
  const [result, setResult] = useState<{
    conversationId: string;
    rows: CreationProposal[];
  } | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!conversationId || busy || !enabled) return;
    const controller = new AbortController();
    setError("");
    void creationRequest<{ proposals: CreationProposal[] }>(
      `/api/agent/creations?chat=${conversationId}`,
      { signal: controller.signal }
    )
      .then(({ proposals }) => {
        if (!controller.signal.aborted)
          setResult({ conversationId, rows: proposals });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Couldn’t restore action previews. Reload them before confirming."
          );
      });
    return () => controller.abort();
  }, [conversationId, busy, enabled, revision]);
  return {
    proposals: result?.conversationId === conversationId ? result.rows : [],
    error: conversationId ? error : "",
    reload: () => setRevision((value) => value + 1),
  };
}
export function AgentCreationReview({
  proposal,
  disabled,
  onEdit,
  onChange,
}: {
  proposal: CreationProposal;
  disabled: boolean;
  onEdit: () => void;
  onChange: (saved?: CreationProposal) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [replaceLocal, setReplaceLocal] = useState(false);
  const [hasLocal, setHasLocal] = useState(false);
  useEffect(() => {
    if (proposal.input.kind === "quickPlay") {
      try {
        setHasLocal(Boolean(localStorage.getItem("relay-quick-play-session")));
      } catch {
        setError("Device storage is unavailable for Quick Play.");
      }
    }
  }, [proposal.input.kind]);
  async function launchQuickPlay() {
    const { startQuickPlay, serializeQuickPlaySession, quickPlayStorageKey } =
      await import("@/features/matches/quick-play-session");
    if (localStorage.getItem(quickPlayStorageKey) && !replaceLocal) {
      setHasLocal(true);
      throw new Error(
        "Confirm replacing your current local Quick Play session first."
      );
    }
    const session = startQuickPlay({
      players: proposal.input.players!.map((name) => ({
        id: crypto.randomUUID(),
        name,
        experience: 0,
      })),
      courtCount: proposal.input.courts!,
      mode: proposal.input.mode,
      queueRule: "adaptive",
      fixedPairs: [],
      roundDurationMinutes: null,
    });
    localStorage.setItem(
      quickPlayStorageKey,
      serializeQuickPlaySession(session)
    );
    window.location.assign("/play");
  }
  async function act(action: "confirm" | "cancel") {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (
        action === "confirm" &&
        proposal.input.kind === "quickPlay" &&
        localStorage.getItem("relay-quick-play-session") &&
        !replaceLocal
      ) {
        setHasLocal(true);
        throw new Error(
          "Confirm replacing your current local Quick Play session first."
        );
      }
      const result = await creationRequest<CreationProposal>(
        "/api/agent/creations",
        {
          method: "POST",
          body: JSON.stringify({ id: proposal.id, action }),
        }
      );
      if (action === "confirm" && proposal.input.kind === "quickPlay")
        await launchQuickPlay();
      onChange(result);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Couldn’t complete this action. Reload its status."
      );
    } finally {
      setPending(false);
    }
  }
  const expired =
    proposal.status === "expired" ||
    (proposal.status === "pending" &&
      new Date(proposal.expiresAt).getTime() <= Date.now());
  return (
    <section
      aria-label={`${proposal.preview.title} preview`}
      className="mt-4 rounded-xl border border-line p-4"
    >
      <p className="text-xs text-muted">
        {proposal.status === "completed"
          ? proposal.input.kind === "quickPlay"
            ? "Ready for this device"
            : "Created"
          : expired
            ? "Preview expired"
            : proposal.status === "cancelled"
              ? "Cancelled or replaced"
              : "Review before creating"}
      </p>
      <h3 className="mt-1 font-semibold">{proposal.preview.title}</h3>
      <ul className="mt-3 space-y-1 text-sm leading-6 text-muted">
        {proposal.preview.lines.map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
      {proposal.preview.people.length ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer">
            {proposal.input.kind === "group"
              ? "Members to add"
              : "Players to invite"}{" "}
            ({proposal.preview.people.length})
          </summary>
          <ul className="mt-2 max-h-40 overflow-auto text-muted">
            {proposal.preview.people.map((person) => (
              <li key={person.id}>{person.name}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {proposal.input.kind === "quickPlay" && hasLocal ? (
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={replaceLocal}
            onChange={(event) => setReplaceLocal(event.target.checked)}
          />
          Replace my current Quick Play session on this device
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {proposal.status === "pending" && !expired ? (
          <>
            <Button
              disabled={disabled || pending}
              onClick={() => void act("confirm")}
            >
              {pending
                ? "Working…"
                : proposal.input.kind === "quickPlay"
                  ? "Approve & start Quick Play"
                  : proposal.input.kind === "group"
                    ? "Approve & create group"
                    : proposal.input.intent === "draft"
                      ? "Approve & save draft"
                      : "Approve & create game"}
            </Button>
            <Button
              variant="quiet"
              disabled={disabled || pending}
              onClick={onEdit}
            >
              Edit details
            </Button>
            <Button
              variant="quiet"
              disabled={disabled || pending}
              onClick={() => void act("cancel")}
            >
              Cancel
            </Button>
          </>
        ) : null}
        {proposal.status === "completed" &&
        proposal.destination &&
        proposal.input.kind !== "quickPlay" ? (
          <Link
            className="text-sm font-medium text-primary"
            href={proposal.destination}
          >
            Open {proposal.input.kind === "group" ? "group" : "game"}
          </Link>
        ) : null}
        {proposal.status === "completed" &&
        proposal.input.kind === "quickPlay" ? (
          <Button
            disabled={pending || disabled}
            variant="secondary"
            onClick={() => {
              setPending(true);
              void launchQuickPlay()
                .catch((failure: unknown) =>
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Couldn’t open Quick Play."
                  )
                )
                .finally(() => setPending(false));
            }}
          >
            Start on this device
          </Button>
        ) : null}
        {expired || error ? (
          <Button
            variant="quiet"
            disabled={pending || disabled}
            onClick={onEdit}
          >
            Prepare a fresh preview
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function AgentCreationCard({
  proposal: supplied,
  disabled,
  onChange,
  onContinue,
}: {
  proposal: CreationProposal;
  disabled: boolean;
  onChange: () => void;
  onContinue: (prompt: string) => void;
}) {
  const [proposal, setProposal] = useState(supplied);
  useEffect(() => setProposal(supplied), [supplied]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function cancel() {
    setPending(true);
    setError("");
    try {
      const saved = await creationRequest<CreationProposal>(
        "/api/agent/creations",
        {
          method: "POST",
          body: JSON.stringify({ id: proposal.id, action: "cancel" }),
        }
      );
      setProposal(saved);
      onChange();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Couldn’t cancel. Try again."
      );
    } finally {
      setPending(false);
    }
  }
  if (proposal.status !== "collecting")
    return (
      <AgentCreationReview
        proposal={proposal}
        disabled={disabled}
        onEdit={() =>
          onContinue(
            "I want to revise my creation setup. Ask me what I want to change, one question at a time."
          )
        }
        onChange={(saved) => {
          if (saved) setProposal(saved);
          onChange();
        }}
      />
    );
  const progress = creationProgress(proposal.input);
  return (
    <section aria-label="Creation progress" className="mt-3 text-sm text-muted">
      <p>
        {proposal.preview.title} · {progress.completed} of {progress.total}{" "}
        details collected
      </p>
      <progress
        className="mt-2 h-1 w-full accent-primary"
        aria-label="Creation details collected"
        value={progress.completed}
        max={progress.total}
      />
      <p className="mt-2">
        {progress.next
          ? `Next: ${progress.next}`
          : "Checking details before review"}
        . Approval required before creation.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <Button
          variant="quiet"
          disabled={disabled || pending}
          onClick={() =>
            onContinue(
              "Continue my creation setup using my saved answers. Ask me only the next missing question."
            )
          }
        >
          Continue in chat
        </Button>
        <Button
          variant="quiet"
          disabled={disabled || pending}
          onClick={() => void cancel()}
        >
          {pending ? "Cancelling…" : "Cancel"}
        </Button>
      </div>
    </section>
  );
}
