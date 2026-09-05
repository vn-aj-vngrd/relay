"use client";

import { CaretLeft } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { AppBreadcrumbs } from "@/components/shared/app-breadcrumbs";
import {
  AuthenticatedSessionNav,
  MobileAuthenticatedSessionNav,
} from "@/components/shared/authenticated-session-nav";
import { ButtonLink } from "@/components/ui/button";
import { CompactPlayStatus } from "@/features/matches/compact-play-status";

import { GameWorkspaceActions } from "./game-workspace-actions";

export function GameWorkspaceFrame({
  children,
  sessionId,
  sessionTitle,
  sessionSlug,
  canManage,
  qrEnabled,
  qrDetails,
  playStatus,
}: {
  children: React.ReactNode;
  sessionId: string;
  sessionTitle: string;
  sessionSlug: string;
  canManage: boolean;
  qrEnabled: boolean;
  qrDetails: string;
  playStatus?: { label: string; urgent: boolean } | null;
}) {
  const pathname = usePathname();
  const settingsFocused = pathname === `/games/${sessionId}/settings`;
  const playFocused = pathname === `/games/${sessionId}/play`;

  return (
    <>
      <div className="hidden shrink-0 lg:block [&>nav]:mb-0">
        <AppBreadcrumbs
          items={[
            { href: "/home", label: "Home" },
            { href: "/games", label: "Games" },
            settingsFocused
              ? {
                  href: `/games/${sessionId}`,
                  label: sessionTitle,
                }
              : { label: sessionTitle },
            ...(settingsFocused ? [{ label: "Game settings" }] : []),
          ]}
        />
      </div>

      {settingsFocused ? (
        <div className="session-tab-safe sticky top-0 z-20 -mx-4 shrink-0 border-b border-line bg-surface sm:-mx-8 lg:mx-0">
          <div className="mx-auto flex h-13 w-full max-w-6xl items-center gap-2 px-1 sm:px-5 lg:px-0">
            <ButtonLink
              href={`/games/${sessionId}`}
              variant="quiet"
              aria-label="Back to game"
              className="-ml-3 h-11 min-h-11 shrink-0 px-3"
            >
              <CaretLeft aria-hidden size={18} />
              <span>Back to game</span>
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="session-tab-safe sticky top-0 z-20 -mx-4 shrink-0 border-b border-line bg-surface sm:-mx-8 lg:mx-0">
          <div className="px-4 pb-1 sm:hidden">
            <div className="flex h-12 min-w-0 items-center gap-1">
              <ButtonLink
                href="/games"
                variant="quiet"
                aria-label="Back to games"
                className="-ml-3 h-11 min-h-11 w-11 shrink-0 px-0"
              >
                <CaretLeft aria-hidden size={18} />
              </ButtonLink>
              <p
                title={sessionTitle}
                className="min-w-0 flex-1 truncate text-sm font-semibold text-ink"
              >
                {sessionTitle}
              </p>
              <GameWorkspaceActions
                mode="mobile"
                canManage={canManage}
                editHref={`/games/${sessionId}/settings`}
                shareUrl={`/s/${sessionSlug}`}
                title={sessionTitle}
                sessionId={sessionId}
                qrEnabled={qrEnabled}
                qrDetails={qrDetails}
              />
            </div>
            <MobileAuthenticatedSessionNav id={sessionId} />
          </div>
          <div className="hidden items-center pr-8 sm:flex lg:pr-0">
            <AuthenticatedSessionNav id={sessionId} />
            <GameWorkspaceActions
              mode="desktop"
              canManage={canManage}
              editHref={`/games/${sessionId}/settings`}
              shareUrl={`/s/${sessionSlug}`}
              title={sessionTitle}
              sessionId={sessionId}
              qrEnabled={qrEnabled}
              qrDetails={qrDetails}
            />
          </div>
        </div>
      )}

      {!settingsFocused && !playFocused && playStatus ? (
        <CompactPlayStatus
          href={`/games/${sessionId}/play`}
          label={playStatus.label}
          urgent={playStatus.urgent}
        />
      ) : null}

      <div className="game-workspace-content min-h-0 flex-1 pt-3 sm:pt-4">
        {children}
      </div>
    </>
  );
}
