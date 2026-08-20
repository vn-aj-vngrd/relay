"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

import { submitVenueAction } from "./actions";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function ErrorMessage({ messages }: { messages?: string[] }) {
  return messages?.[0] ? <p className="mt-1.5 text-sm font-medium text-danger">{messages[0]}</p> : null;
}

export function VenueSubmissionForm() {
  const [state, action] = useActionState(submitVenueAction, {});
  if (state.success)
    return (
      <section role="status" className="border-y border-line py-8">
        <h2 className="text-lg font-[680]">Thanks for helping the Cebu community</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{state.success}</p>
      </section>
    );

  return (
    <form action={action} className="max-w-2xl space-y-6" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/15"
        >
          {state.error}
        </p>
      ) : null}
      <div>
        <label htmlFor="name" className="text-sm font-[650]">
          Court name
        </label>
        <input id="name" name="name" required maxLength={120} className={inputClass} placeholder="Court name" />
        <ErrorMessage messages={state.fieldErrors?.name} />
      </div>
      <div>
        <label htmlFor="address" className="text-sm font-[650]">
          Address or neighborhood
        </label>
        <input
          id="address"
          name="address"
          required
          maxLength={240}
          className={inputClass}
          placeholder="Street, barangay, or landmark"
        />
        <ErrorMessage messages={state.fieldErrors?.address} />
      </div>
      <div>
        <label htmlFor="city" className="text-sm font-[650]">
          Cebu city or municipality
        </label>
        <input id="city" name="city" required maxLength={80} className={inputClass} placeholder="Cebu City" />
        <p className="mt-1.5 text-sm text-muted">Court Finder currently accepts Cebu locations only.</p>
        <ErrorMessage messages={state.fieldErrors?.city} />
      </div>
      <div>
        <label htmlFor="officialUrl" className="text-sm font-[650]">
          Official or Google Maps link <span className="font-normal text-muted">Optional</span>
        </label>
        <input id="officialUrl" name="officialUrl" type="url" className={inputClass} placeholder="https://…" />
        <ErrorMessage messages={state.fieldErrors?.officialUrl} />
      </div>
      <div>
        <label htmlFor="note" className="text-sm font-[650]">
          What should we verify? <span className="font-normal text-muted">Optional</span>
        </label>
        <textarea
          id="note"
          name="note"
          maxLength={600}
          rows={5}
          className={`${inputClass} h-auto min-h-28 resize-y py-3`}
          placeholder="Number of courts, booking contact, recent opening, or a correction…"
        />
        <ErrorMessage messages={state.fieldErrors?.note} />
      </div>
      <div className="border-t border-line pt-5">
        <SubmitButton pendingLabel="Submitting…">Submit for review</SubmitButton>
        <p className="mt-3 text-xs leading-5 text-muted">
          Relay reviews submissions before they appear on the map. Do not upload private contact details.
        </p>
      </div>
    </form>
  );
}
