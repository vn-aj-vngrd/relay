"use client";

import { useActionState } from "react";

import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  type OrganizerActionState,
  setLeadOrganizerAction,
} from "./organizer-actions";

export function LeadOrganizerControl({
  sessionId,
  version,
  currentLeadId,
  cohosts,
}: {
  sessionId: string;
  version: number;
  currentLeadId?: string | null;
  cohosts: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<OrganizerActionState, FormData>(
    setLeadOrganizerAction,
    {}
  );
  if (!cohosts.length) {
    return null;
  }

  return (
    <section
      className="mt-10 border-t border-line pt-7"
      aria-label="Lead organizer"
    >
      <form noValidate action={action} className="max-w-md">
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="version" value={version} />
        <SelectField
          id="lead-organizer"
          name="leadOrganizerId"
          label="Lead organizer"
          defaultValue={currentLeadId ?? ""}
          options={[
            { value: "", label: "No lead organizer" },
            ...cohosts.map((cohost) => ({
              value: cohost.id,
              label: cohost.name,
            })),
          ]}
        />
        <SubmitButton pendingLabel="Saving…" className="mt-3">
          Save organizer
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
    </section>
  );
}
