"use client";

import { Camera, UsersThree, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { type GroupActionState, updateGroupAction } from "./actions";

const field =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-[15px]";

export function EditGroupForm({
  group,
  imageUrl,
}: {
  group: { id: string; slug: string; name: string; description: string | null };
  imageUrl?: string;
}) {
  const [state, action] = useActionState<GroupActionState, FormData>(updateGroupAction, {});
  const [preview, setPreview] = useState<string>();
  const [removeImage, setRemoveImage] = useState(false);
  const preserveValues = usePreserveFormValuesOnError(state);
  const shownImage = removeImage ? undefined : (preview ?? imageUrl);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function previewFile(file?: File) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : undefined);
    if (file) setRemoveImage(false);
  }

  function removePhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(undefined);
    setRemoveImage(true);
  }

  return (
    <form action={action} onSubmitCapture={preserveValues} noValidate className="mt-8 space-y-6">
      <input type="hidden" name="groupId" value={group.id} />
      <input type="hidden" name="removeImage" value={removeImage ? "true" : "false"} />

      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}

      <section aria-labelledby="group-photo-title">
        <h2 id="group-photo-title" className="text-sm font-semibold">
          Group photo
        </h2>
        <p className="mt-1 text-sm leading-5 text-muted">JPG, PNG, or WebP up to 5 MB.</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface-strong text-muted">
            {shownImage ? (
              <Image
                src={shownImage}
                alt="Group photo preview"
                fill
                unoptimized={Boolean(preview)}
                className="object-cover"
              />
            ) : (
              <UsersThree aria-hidden size={30} />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              id="group-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="peer sr-only"
              onChange={(event) => previewFile(event.target.files?.[0])}
            />
            <label
              htmlFor="group-image"
              className="pressable inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold hover:bg-surface-strong peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary"
            >
              <Camera aria-hidden size={16} />
              {shownImage ? "Change photo" : "Choose photo"}
            </label>
            {shownImage ? (
              <Button type="button" variant="quiet" onClick={removePhoto}>
                <X aria-hidden size={16} />
                Remove photo
              </Button>
            ) : null}
          </div>
        </div>
      </section>

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
          defaultValue={state.values?.name ?? group.name}
          className={field}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="mt-1.5 text-sm font-medium text-danger">{state.fieldErrors.name[0]}</p>
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
          defaultValue={state.values?.description ?? group.description ?? ""}
          className={`${field} min-h-24 resize-y py-3`}
        />
        {state.fieldErrors?.description?.[0] ? (
          <p className="mt-1.5 text-sm font-medium text-danger">{state.fieldErrors.description[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <SubmitButton pendingLabel="Saving group…">Save changes</SubmitButton>
        <ButtonLink href={`/groups/${group.slug}`} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
