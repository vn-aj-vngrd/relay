"use client";

import { useActionState } from "react";
import { ActionNotice } from "@/components/ui/action-notice";

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
          <ActionNotice message={state.error} response={state} />
        ) : state.message ? (
          <ActionNotice
            message={state.message}
            response={state}
            variant="success"
          />
        ) : null}
      </form>
    </section>
  );
}
