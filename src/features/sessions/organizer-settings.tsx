"use client";

import { useActionState } from "react";

import { Avatar } from "@/components/shared/avatar-stack";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  addCohostAction,
  type OrganizerActionState,
  setCohostRoleAction,
} from "./organizer-actions";

export type OrganizerSummary = {
  sessionPlayerId: string;
  name: string;
  imageUrl?: string;
  role: "host" | "cohost";
  playing: boolean;
};

function RemoveCohostControl({
  sessionId,
  version,
  organizer,
}: {
  sessionId: string;
  version: number;
  organizer: OrganizerSummary;
}) {
  const [state, action] = useActionState<OrganizerActionState, FormData>(
    setCohostRoleAction,
    {}
  );
  return (
    <form action={action} className="text-right" noValidate>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="version" value={version} />
      <input
        type="hidden"
        name="sessionPlayerId"
        value={organizer.sessionPlayerId}
      />
      <input type="hidden" name="role" value="player" />
      <ConfirmSubmitButton
        variant="quiet"
        pendingLabel="Removing…"
        aria-label={`Remove ${organizer.name} as co-host`}
        className="min-h-9 px-3 text-danger"
        confirmTitle={`Remove ${organizer.name} as co-host?`}
        confirmText="They will lose organizer access. Their game RSVP stays unchanged."
        confirmLabel="Remove co-host"
        cancelLabel="Keep co-host"
      >
        Remove co-host
      </ConfirmSubmitButton>
      {state.error ? (
        <p role="alert" className="mt-1 max-w-56 text-xs text-danger">
          {state.error}
        </p>
      ) : state.message ? (
        <p role="status" className="mt-1 text-xs text-primary">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function OrganizerSettings({
  sessionId,
  version,
  organizers,
  canManage,
}: {
  sessionId: string;
  version: number;
  organizers: OrganizerSummary[];
  canManage: boolean;
}) {
  const [state, action] = useActionState<OrganizerActionState, FormData>(
    addCohostAction,
    {}
  );

  return (
    <section className="mt-7" aria-labelledby="organizers-settings-title">
      <h2 id="organizers-settings-title" className="text-lg font-bold">
        Organizers
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
        Co-hosts can manage the plan, roster, payments, and Play. Playing in the
        game remains a separate choice.
      </p>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {organizers.map((organizer, index) => (
          <li
            key={organizer.sessionPlayerId}
            className="flex min-h-16 flex-wrap items-center gap-3 py-2"
          >
            <Avatar
              name={organizer.name}
              imageUrl={organizer.imageUrl}
              index={index}
              size="sm"
            />
            <span className="min-w-32 flex-1">
              <span className="block truncate font-medium">
                {organizer.name}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {organizer.role === "host" ? "Host" : "Co-host"}
                {!organizer.playing ? " · Not playing" : ""}
              </span>
            </span>
            {canManage && organizer.role === "cohost" ? (
              <RemoveCohostControl
                sessionId={sessionId}
                version={version}
                organizer={organizer}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {canManage ? (
        <form action={action} className="mt-5 max-w-md" noValidate>
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="version" value={version} />
          <label htmlFor="cohost-username" className="block text-sm font-[650]">
            Relay username
          </label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input
              id="cohost-username"
              name="username"
              required
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              placeholder="@username"
              className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm"
            />
            <SubmitButton
              pendingLabel="Adding…"
              className="h-11 min-h-11 sm:px-4"
            >
              Add co-host
            </SubmitButton>
          </div>
          <p className="mt-2 text-sm leading-5 text-muted">
            Add any Relay member. Organizer access does not add them as a
            player.
          </p>
          {state.error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {state.error}
            </p>
          ) : state.message ? (
            <p role="status" className="mt-2 text-sm text-primary">
              {state.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
