"use client";

import { CheckCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

import { dismissCreatedGameShare } from "./actions";
import { GameQrShare } from "./game-qr-share";
import { ShareButton } from "./share-button";

export function CreatedGameShare({
  sessionId,
  title,
  shareUrl,
  details,
  inviteeCount,
  qrEnabled,
  pendingPublicPrice = false,
  canConfigurePayment = false,
}: {
  sessionId: string;
  title: string;
  shareUrl: string;
  details: string;
  inviteeCount: number;
  qrEnabled: boolean;
  pendingPublicPrice?: boolean;
  canConfigurePayment?: boolean;
}) {
  const [state, dismissAction, pending] = useActionState(
    dismissCreatedGameShare,
    {}
  );
  const [announcement, setAnnouncement] = useState("");
  const dismissFormId = useId();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("created")) return;
    url.searchParams.delete("created");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {state.success ? "Game created message dismissed" : announcement}
      </p>
      {!state.success ? (
        <section
          className="mb-5 rounded-xl border border-line bg-surface p-4 sm:mb-6 sm:p-5"
          aria-labelledby="created-game-title"
        >
          <div className="flex items-start gap-3">
            <CheckCircle
              aria-hidden
              size={21}
              weight="fill"
              className="mt-0.5 shrink-0 text-success"
            />
            <div className="min-w-0 flex-1">
              <h2 id="created-game-title" className="text-lg font-[680]">
                Game created
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {inviteeCount
                  ? `${inviteeCount} Relay ${inviteeCount === 1 ? "player was" : "players were"} invited. ${qrEnabled ? "Share the link or show the QR to bring everyone else in." : "Only invited Relay players can open this private game."}`
                  : qrEnabled
                    ? "Share the link or show the QR so players can view the plan and RSVP."
                    : "This private game is visible only to Relay players you invite."}
              </p>
              {pendingPublicPrice ? (
                <p className="mt-2 text-sm leading-6 text-muted">
                  Your public game can be shared now. It will appear in Open
                  games once a player price is available.{" "}
                  {canConfigurePayment ? (
                    <Link
                      href={`/games/${sessionId}/settings?section=payments#player-payment`}
                      className="font-semibold text-primary"
                    >
                      Edit payment settings
                    </Link>
                  ) : (
                    "Only the original host can configure player payment."
                  )}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {qrEnabled ? (
                  <>
                    <ShareButton
                      url={shareUrl}
                      title={title}
                      sessionId={sessionId}
                      primary
                      onShared={() => setAnnouncement("Game shared")}
                    />
                    <GameQrShare
                      url={shareUrl}
                      title={title}
                      details={details}
                      sessionId={sessionId}
                      onShared={(method) =>
                        setAnnouncement(
                          method === "copy"
                            ? "Game link copied"
                            : "QR code downloaded"
                        )
                      }
                    />
                    <ButtonLink href={shareUrl} variant="quiet">
                      Preview shared link
                    </ButtonLink>
                  </>
                ) : (
                  <ButtonLink href={`/games/${sessionId}/play?panel=players`}>
                    Invite players
                  </ButtonLink>
                )}
              </div>
              {state.error ? (
                <Alert className="mt-3">{state.error}</Alert>
              ) : null}
              <form noValidate id={dismissFormId} action={dismissAction}>
                <input type="hidden" name="sessionId" value={sessionId} />
              </form>
            </div>
            <Button
              type="submit"
              form={dismissFormId}
              variant="quiet"
              disabled={pending}
              aria-label={
                pending ? "Dismissing…" : "Dismiss game created message"
              }
              className="-mr-2 -mt-2 shrink-0"
            >
              <X aria-hidden size={17} />
              <Tooltip content="Dismiss for this game" />
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
