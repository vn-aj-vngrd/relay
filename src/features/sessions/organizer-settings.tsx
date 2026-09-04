"use client";

import { useActionState } from "react";

import { Avatar } from "@/components/shared/avatar-stack";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import {
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

export type CohostCandidate = {
  sessionPlayerId: string;
  name: string;
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
        confirmText="They will remain on the player roster but lose organizer access."
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
  candidates,
  canManage,
}: {
  sessionId: string;
  version: number;
  organizers: OrganizerSummary[];
  candidates: CohostCandidate[];
  canManage: boolean;
}) {
  const [state, action] = useActionState<OrganizerActionState, FormData>(
    setCohostRoleAction,
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
        candidates.length ? (
          <form action={action} className="mt-5 max-w-md" noValidate>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="version" value={version} />
            <input type="hidden" name="role" value="cohost" />
            <SelectField
              id="cohost-player"
              name="sessionPlayerId"
              label="Co-host"
              defaultValue=""
              options={[
                { value: "", label: "Choose a Relay player" },
                ...candidates.map((candidate) => ({
                  value: candidate.sessionPlayerId,
                  label: candidate.name,
                })),
              ]}
            />
            <SubmitButton pendingLabel="Adding…" className="mt-3">
              Add co-host
            </SubmitButton>
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
        ) : (
          <p className="mt-4 text-sm text-muted">
            Add a Relay account player to the roster before assigning co-host
            access.
          </p>
        )
      ) : null}
    </section>
  );
}
