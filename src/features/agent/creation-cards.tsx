"use client";
import Link from "next/link";
import { type RefObject, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { creationRequest } from "./creation-client";
import type { CreationProposal } from "./creation-schema";
import { AgentCreationWizard } from "./creation-wizard";
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
  onPendingChange,
  embedded = false,
}: {
  proposal: CreationProposal;
  disabled: boolean;
  onEdit: () => void;
  onChange: (saved?: CreationProposal) => void;
  onPendingChange?: (pending: boolean) => void;
  embedded?: boolean;
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
    onPendingChange?.(true);
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
      onPendingChange?.(false);
    }
  }
  const expired =
    proposal.status === "expired" ||
    (proposal.status === "pending" &&
      new Date(proposal.expiresAt).getTime() <= Date.now());
  return (
    <section
      aria-label={`${proposal.preview.title} preview`}
      className={embedded ? "mt-4" : "mt-4 rounded-xl border border-line p-4"}
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
            {!embedded ? (
              <Button
                variant="quiet"
                disabled={disabled || pending}
                onClick={onEdit}
              >
                Edit details
              </Button>
            ) : null}
            {!embedded ? (
              <Button
                variant="quiet"
                disabled={disabled || pending}
                onClick={() => void act("cancel")}
              >
                Cancel
              </Button>
            ) : null}
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
  onChatMode,
  panelHost,
  beforeChat,
  proposal,
  disabled,
  onChange,
}: {
  onChatMode?: () => void;
  panelHost?: HTMLElement | null;
  beforeChat?: RefObject<(() => Promise<void>) | null>;
  proposal: CreationProposal;
  disabled: boolean;
  onEdit?: () => void;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(
    proposal.status === "collecting" &&
      proposal.input.interactionMode !== "chat"
  );
  const [started, setStarted] = useState(
    proposal.status === "collecting" &&
      proposal.input.interactionMode !== "chat"
  );
  function showSetup() {
    setStarted(true);
    setOpen(true);
  }
  const [current, setCurrent] = useState(proposal);
  useEffect(() => {
    setCurrent(proposal);
  }, [proposal]);
  return (
    <>
      {current.status === "collecting" ? (
        <section
          aria-label="Creation setup"
          className="mt-4 rounded-xl border border-line p-4"
        >
          <h3 className="font-semibold">{current.preview.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {current.input.interactionMode === "chat"
              ? "Continue in chat—Agent will ask one question at a time."
              : "Answer a few questions above the input, or tell Agent what to change."}{" "}
            Nothing is created until you approve.
          </p>
          <Button className="mt-3" disabled={disabled} onClick={showSetup}>
            {current.input.interactionMode === "chat"
              ? "Answer with choices"
              : "Continue setup"}
          </Button>
        </section>
      ) : (
        <AgentCreationReview
          proposal={current}
          disabled={disabled}
          onEdit={showSetup}
          onChange={(result) => {
            if (result) setCurrent(result);
            onChange();
          }}
        />
      )}
      {started ? (
        <AgentCreationWizard
          proposal={current}
          panelHost={panelHost}
          beforeChat={beforeChat}
          onChatMode={onChatMode}
          open={open}
          onDismiss={() => setOpen(false)}
          disabled={disabled}
          onClose={(saved) => {
            setCurrent(saved);
            setOpen(false);
            onChange();
          }}
          renderReview={(saved, edit, changed, pendingChanged, formBusy) => (
            <AgentCreationReview
              embedded
              proposal={saved}
              disabled={disabled || formBusy}
              onEdit={edit}
              onChange={changed}
              onPendingChange={pendingChanged}
            />
          )}
        />
      ) : null}
    </>
  );
}
