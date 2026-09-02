"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { addGroupMemberAction, type GroupActionState } from "./actions";

export function AddGroupMemberForm({ groupId }: { groupId: string }) {
  const [state, action] = useActionState<GroupActionState, FormData>(addGroupMemberAction, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form noValidate action={action} onSubmitCapture={preserveValues} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="min-w-0 flex-1">
        <label htmlFor="member-username" className="sr-only">
          Player username
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-sm text-muted">@</span>
          <input
            id="member-username"
            name="username"
            required
            minLength={2}
            maxLength={40}
            autoComplete="off"
            placeholder="username"
            className="h-10 w-full rounded-lg border border-line bg-surface pl-7 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        {state.error ? (
          <p role="alert" className="mt-1.5 text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : null}
      </div>
      <SubmitButton pendingLabel="Adding…" variant="secondary" className="self-start">
        Add player
      </SubmitButton>
    </form>
  );
}
