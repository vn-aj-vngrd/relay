"use client";

import { useActionState } from "react";

import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import { type FeedbackActionState, updateFeedbackAction } from "./actions";
import { type FeedbackStatus, feedbackStatuses, feedbackStatusLabels } from "./domain";

export function AdminFeedbackReviewForm({
  feedbackId,
  status,
  adminNote,
}: {
  feedbackId: string;
  status: FeedbackStatus;
  adminNote: string | null;
}) {
  const [state, action] = useActionState<FeedbackActionState, FormData>(updateFeedbackAction, {});

  return (
    <form action={action} className="border-y border-line py-6">
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <SelectField
          id="feedback-review-status"
          name="status"
          label="Status"
          defaultValue={status}
          options={feedbackStatuses.map((value) => ({ value, label: feedbackStatusLabels[value] }))}
        />
        <div>
          <label htmlFor="feedback-admin-note" className="block text-sm font-[650]">
            Internal note <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="feedback-admin-note"
            name="adminNote"
            rows={5}
            maxLength={2000}
            defaultValue={adminNote ?? ""}
            placeholder="Decision, reproduction notes, or follow-up context…"
            className="field min-h-28 resize-y !p-3.5 leading-6"
          />
          <p className="mt-1.5 text-xs text-muted">Visible only to Relay administrators.</p>
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : state.success ? (
        <p role="status" className="mt-4 text-sm font-semibold text-success">
          {state.success}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end border-t border-line pt-5">
        <SubmitButton pendingLabel="Saving review…">Save review</SubmitButton>
      </div>
    </form>
  );
}
