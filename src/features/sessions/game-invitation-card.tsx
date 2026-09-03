"use client";

import { CalendarBlank, Check, Coins, MapPin, Question, Users, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { sessionAccentStyle } from "./accent";
import { rsvpAction } from "./actions";
import { peso } from "./format";
import type { GameCollectionItem } from "./game-collection-types";

export type ActiveInviteResponse = "going" | "maybe" | "pending" | "waitlisted" | "declined";

const choices = [
  { value: "going" as const, label: "Going", icon: Check },
  { value: "maybe" as const, label: "Maybe", icon: Question },
  { value: "declined" as const, label: "Can’t go", icon: X },
];

function InviteResponseButtons() {
  const { data, pending } = useFormStatus();
  const pendingChoice = data?.get("choice");

  return (
    <div className="grid grid-cols-3 gap-2">
      {choices.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="submit"
          name="choice"
          value={value}
          disabled={pending}
          className={`pressable inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-[13px] font-[650] disabled:cursor-wait disabled:opacity-65 ${value === "going" ? "border-primary bg-primary text-white hover:bg-primary-hover" : "border-line bg-surface hover:bg-surface-strong"}`}
        >
          <Icon aria-hidden size={15} weight={value === "going" ? "bold" : "regular"} className="shrink-0" />
          <span>{pending && pendingChoice === value ? "Saving…" : label}</span>
        </button>
      ))}
    </div>
  );
}

export function GameInvitationCard({
  game,
  source,
  onResponded,
}: {
  game: GameCollectionItem;
  source: "games" | "home";
  onResponded: (game: GameCollectionItem, response: ActiveInviteResponse) => void;
}) {
  const [state, action] = useActionState(rsvpAction, {});

  useEffect(() => {
    if (state.success && state.rsvp) onResponded(game, state.rsvp);
  }, [game, onResponded, state.rsvp, state.success]);

  const cost =
    game.estimatedCostCents === 0
      ? "Free"
      : game.estimatedCostCents
        ? `${peso(game.estimatedCostCents)} estimated`
        : "Cost not added";
  const availability = game.spotsRemaining ? `${game.spotsRemaining} spots open` : "Waitlist available";

  return (
    <article
      style={sessionAccentStyle(game.accentColor)}
      className="rounded-xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={game.href}
              prefetch={false}
              className="line-clamp-2 font-[680] text-ink underline-offset-4 hover:text-primary hover:underline"
            >
              {game.title}
            </Link>
            <p className="mt-1 text-sm text-muted">Hosted by {game.hostName}</p>
          </div>
          <time className="score shrink-0 text-xs font-bold text-primary">{game.date}</time>
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li className="flex min-w-0 items-center gap-2">
            <CalendarBlank aria-hidden size={16} className="shrink-0" />
            <span className="min-w-0 truncate">{game.time}</span>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <MapPin aria-hidden size={16} className="shrink-0" />
            <span className="min-w-0 truncate">{game.venue}</span>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <Coins aria-hidden size={16} className="shrink-0" />
            <span>{cost}</span>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <Users aria-hidden size={16} className="shrink-0" />
            <span>{availability}</span>
          </li>
        </ul>
        {game.requiresApproval ? (
          <p className="mt-3 text-xs leading-5 text-muted">Going sends a request for the host to approve.</p>
        ) : null}
      </div>
      <form noValidate action={action} className="mt-4 border-t border-line pt-4">
        <input type="hidden" name="sessionId" value={game.id} />
        <input type="hidden" name="inviteSource" value={source} />
        <InviteResponseButtons />
        {state.error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : null}
      </form>
    </article>
  );
}
