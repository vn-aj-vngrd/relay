"use client";

import { CheckCircle, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";

import { GameQrShare } from "./game-qr-share";
import { ShareButton } from "./share-button";

export function CreatedGameShare({
  sessionId,
  title,
  shareUrl,
  details,
  inviteeCount,
  qrEnabled,
}: {
  sessionId: string;
  title: string;
  shareUrl: string;
  details: string;
  inviteeCount: number;
  qrEnabled: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [announcement, setAnnouncement] = useState("");

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

  function complete(message: string) {
    setAnnouncement(message);
    setDismissed(true);
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {!dismissed ? (
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
              <div className="mt-4 flex flex-wrap gap-2">
                {qrEnabled ? (
                  <>
                    <ShareButton
                      url={shareUrl}
                      title={title}
                      sessionId={sessionId}
                      primary
                      onShared={() => complete("Game shared")}
                    />
                    <GameQrShare
                      url={shareUrl}
                      title={title}
                      details={details}
                      sessionId={sessionId}
                      onShared={(method) =>
                        complete(
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
                  <ButtonLink href={`/games/${sessionId}/players`}>
                    Invite players
                  </ButtonLink>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="quiet"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss game created message"
              className="-mr-2 -mt-2 shrink-0"
            >
              <X aria-hidden size={17} />
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
