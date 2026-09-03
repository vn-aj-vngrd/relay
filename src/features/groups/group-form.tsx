"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { createGroupAction, type GroupActionState } from "./actions";

const field =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function CreateGroupForm({
  sourceSessionId,
  defaultName,
  savedPlayerCount = 0,
}: {
  sourceSessionId?: string;
  defaultName?: string;
  savedPlayerCount?: number;
}) {
  const [state, action] = useActionState<GroupActionState, FormData>(
    createGroupAction,
    {}
  );
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      action={action}
      onSubmitCapture={preserveValues}
      noValidate
      className="mt-8 space-y-6"
    >
      {sourceSessionId ? (
        <input type="hidden" name="sourceSessionId" value={sourceSessionId} />
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {sourceSessionId ? (
        <div className="border-y border-line py-4">
          <p className="text-sm font-semibold">Saving this crew</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {savedPlayerCount} signed-in{" "}
            {savedPlayerCount === 1 ? "player" : "players"} will become members.
            Guests remain attached to the original session and can join the next
            shared link.
          </p>
        </div>
      ) : null}
      <div>
        <label htmlFor="group-name" className="text-sm font-semibold">
          Group name
        </label>
        <input
          id="group-name"
          name="name"
          required
          minLength={2}
          maxLength={60}
          defaultValue={state.values?.name ?? defaultName ?? ""}
          placeholder="Tuesday Dink Club"
          className={field}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="mt-1.5 text-sm font-medium text-danger">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="group-description" className="text-sm font-semibold">
          Description <span className="font-normal text-muted">Optional</span>
        </label>
        <textarea
          id="group-description"
          name="description"
          maxLength={300}
          defaultValue={state.values?.description}
          placeholder="The regular Tuesday crew."
          className={`${field} min-h-24 resize-y py-3`}
        />
      </div>
      <SubmitButton pendingLabel="Creating group…">Create group</SubmitButton>
    </form>
  );
}
