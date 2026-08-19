"use client";

import { useActionState } from "react";

import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import { type ProfileDetailsActionState, updateOwnProfileAction } from "./actions";
import { playingExperienceOptions } from "./playing-experience";

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1.5 text-sm font-medium text-danger">{errors[0]}</p> : null;
}

export function ProfileDetailsForm({
  profile,
}: {
  profile: {
    name: string;
    bio: string | null;
    city: string | null;
    skillLevel: string | null;
    dominantHand: string | null;
  };
}) {
  const [state, action] = useActionState<ProfileDetailsActionState, FormData>(updateOwnProfileAction, {});
  return (
    <form action={action} className="border-y border-line py-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="text-sm font-semibold">
            Name
          </label>
          <input
            id="profile-name"
            name="name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={profile.name}
            className="field"
          />
          <ErrorText errors={state.fieldErrors?.name} />
        </div>
        <div>
          <label htmlFor="profile-city" className="text-sm font-semibold">
            City
          </label>
          <input
            id="profile-city"
            name="city"
            maxLength={60}
            defaultValue={profile.city ?? ""}
            className="field"
            placeholder="Optional"
          />
          <ErrorText errors={state.fieldErrors?.city} />
        </div>
        <SelectField
          id="profile-experience"
          name="skillLevel"
          label="Playing experience"
          defaultValue={profile.skillLevel ?? ""}
          options={[
            { value: "", label: "Not set" },
            ...playingExperienceOptions.map(({ value, label }) => ({ value, label })),
          ]}
        />
        <SelectField
          id="profile-hand"
          name="dominantHand"
          label="Dominant hand"
          defaultValue={profile.dominantHand ?? ""}
          options={[
            { value: "", label: "Not set" },
            { value: "right", label: "Right" },
            { value: "left", label: "Left" },
            { value: "both", label: "Both" },
          ]}
        />
      </div>
      <div className="mt-5">
        <label htmlFor="profile-bio" className="block text-sm font-semibold">
          About you
        </label>
        <textarea
          id="profile-bio"
          name="bio"
          maxLength={240}
          rows={3}
          defaultValue={profile.bio ?? ""}
          placeholder="What your pickleball friends should know…"
          className="field min-h-24 resize-y !p-3.5 leading-6"
        />
        <ErrorText errors={state.fieldErrors?.bio} />
      </div>
      {state.error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-4 text-sm font-semibold text-success">
          {state.success}
        </p>
      ) : null}
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-5">
        <p className="text-xs leading-5 text-muted">
          Experience helps Balanced Mix make closer teams. It is never a public rating.
        </p>
        <SubmitButton pendingLabel="Saving…" className="shrink-0">
          Save details
        </SubmitButton>
      </div>
    </form>
  );
}
