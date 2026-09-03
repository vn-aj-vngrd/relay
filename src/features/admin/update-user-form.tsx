"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonLink, ButtonSpinner } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { type AdminActionState, updateUserProfileAction } from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <ButtonSpinner />
          Saving changes…
        </>
      ) : (
        "Save changes"
      )}
    </Button>
  );
}

export function UpdateUserForm({
  userId,
  profile,
}: {
  userId: string;
  profile: {
    name: string;
    username: string;
    city: string | null;
    skillLevel: string | null;
    dominantHand: string | null;
  } | null;
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(
    updateUserProfileAction,
    {}
  );
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      className="max-w-xl space-y-5"
    >
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label htmlFor="admin-profile-name" className="text-sm font-semibold">
          Display name
        </label>
        <input
          id="admin-profile-name"
          name="name"
          required
          maxLength={80}
          defaultValue={profile?.name ?? ""}
          className="field"
        />
      </div>
      <div>
        <label
          htmlFor="admin-profile-username"
          className="text-sm font-semibold"
        >
          Username
        </label>
        <input
          id="admin-profile-username"
          name="username"
          required
          minLength={3}
          maxLength={24}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          defaultValue={profile?.username ?? ""}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="admin-profile-city" className="text-sm font-semibold">
          City
        </label>
        <input
          id="admin-profile-city"
          name="city"
          maxLength={80}
          defaultValue={profile?.city ?? ""}
          className="field"
          placeholder="Optional"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id="admin-profile-skill"
          name="skillLevel"
          label="Playing experience"
          defaultValue={profile?.skillLevel ?? ""}
          options={[
            { value: "", label: "Not set" },
            { value: "new", label: "Just starting" },
            { value: "casual", label: "Casual" },
            { value: "regular", label: "Regular" },
            { value: "experienced", label: "Experienced" },
          ]}
        />
        <SelectField
          id="admin-profile-hand"
          name="dominantHand"
          label="Dominant hand"
          defaultValue={profile?.dominantHand ?? ""}
          options={[
            { value: "", label: "Not set" },
            { value: "right", label: "Right" },
            { value: "left", label: "Left" },
            { value: "both", label: "Both" },
          ]}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm font-medium text-success">
          {state.success}
        </p>
      ) : null}
      <div className="flex gap-2">
        <SaveButton />
        <ButtonLink href={`/admin/users/${userId}`} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
