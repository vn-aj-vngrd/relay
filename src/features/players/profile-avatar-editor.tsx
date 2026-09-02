"use client";

import { Camera } from "@phosphor-icons/react";
import { useActionState, useEffect, useState } from "react";

import { Avatar } from "@/components/shared/avatar-stack";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { type AvatarActionState, uploadAvatarAction } from "./actions";

export function ProfileAvatarEditor({ name, imageUrl }: { name: string; imageUrl?: string }) {
  const [state, action] = useActionState<AvatarActionState, FormData>(uploadAvatarAction, {});
  const [preview, setPreview] = useState<string>();
  const preserveValues = usePreserveFormValuesOnError(state);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function previewFile(file?: File) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : undefined);
  }

  return (
    <form noValidate action={action} onSubmitCapture={preserveValues} className="shrink-0">
      <input
        id="profile-avatar"
        name="avatar"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="peer sr-only"
        onChange={(event) => previewFile(event.target.files?.[0])}
      />
      <div className="relative w-fit rounded-full peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary">
        <Avatar name={name} imageUrl={preview || imageUrl} size="xl" />
        <label
          htmlFor="profile-avatar"
          className="pressable absolute bottom-0 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-surface bg-ink text-surface hover:bg-primary"
          title="Change profile photo"
        >
          <Camera aria-hidden size={15} weight="bold" />
          <span className="sr-only">Choose profile photo</span>
        </label>
      </div>
      {preview ? (
        <SubmitButton pendingLabel="Uploading…" className="mt-3 min-h-9 w-full px-3 text-xs">
          Save photo
        </SubmitButton>
      ) : null}
      {state.error ? (
        <p role="alert" className="mt-2 max-w-44 text-xs leading-5 text-danger">
          {state.error}
        </p>
      ) : state.success ? (
        <p role="status" className="mt-2 text-xs font-medium text-success">
          Photo updated.
        </p>
      ) : null}
    </form>
  );
}
