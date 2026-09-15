"use client";

import { UploadSimple } from "@phosphor-icons/react";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { ImageFileField } from "@/components/ui/image-file-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";
import {
  type GamePhotoAllowance,
  mediaPolicy,
  storageLabel,
} from "@/features/billing/domain";
import { billingSectionHref } from "@/features/billing/navigation";

import { uploadMemoryPhotoState } from "./actions";

export function MemoryPhotoForm({
  sessionId,
  allowance,
  canManageStorage = false,
}: {
  sessionId: string;
  allowance?: GamePhotoAllowance;
  canManageStorage?: boolean;
}) {
  const albumFull = allowance
    ? allowance.photosUsed >= allowance.photoLimit
    : false;
  const storageFull = allowance
    ? !allowance.storageUnlimited &&
      allowance.bytesUsed >= allowance.storageBytes
    : false;
  const storageNearFull = Boolean(
    allowance &&
      !allowance.storageUnlimited &&
      allowance.bytesUsed >= allowance.storageBytes * 0.8
  );
  const [state, action] = useActionState(uploadMemoryPhotoState, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form
      noValidate
      action={action}
      onSubmitCapture={preserveValues}
      aria-label="Add a game photo"
      className="min-w-0"
    >
      <div className="mb-4 text-sm leading-6" aria-label="Photo allowance">
        <p className="font-semibold">
          {allowance
            ? `${allowance.photosUsed} / ${allowance.photoLimit} game photos`
            : `Up to ${mediaPolicy.memory.perGame} photos per game`}
        </p>
        {allowance ? (
          <p className="text-muted">
            {storageLabel(allowance.bytesUsed)} used
            {allowance.storageUnlimited
              ? " · Unlimited host storage"
              : ` of ${storageLabel(allowance.storageBytes)} · Host’s storage`}
          </p>
        ) : null}
        <p className="mt-1 text-xs leading-5 text-muted">
          {allowance?.photoLimit ?? mediaPolicy.memory.perGame} photos per game,
          shared by all players.
          {!allowance?.storageUnlimited
            ? " Uploads also depend on the host’s available storage."
            : ""}
        </p>
        {albumFull || storageFull ? (
          <p role="status" className="mt-2 font-medium">
            {albumFull
              ? "This album is full. The host can remove a game photo to make room."
              : "The host’s storage is full. Free space or increase the storage allowance to add photos."}
          </p>
        ) : null}
        {canManageStorage && storageNearFull ? (
          <div className="mt-2">
            <ButtonLink href={billingSectionHref("plans")} variant="quiet">
              View plans
            </ButtonLink>
          </div>
        ) : null}
      </div>
      {state.error ? <Alert className="mb-4">{state.error}</Alert> : null}
      {state.success ? (
        <p role="status" className="mb-4 text-sm font-medium text-primary">
          Photo added. It’s ready to use in Make.
        </p>
      ) : null}
      <input type="hidden" name="sessionId" value={sessionId} />
      <ImageFileField
        id="memory-photo"
        name="photo"
        label="Add a photo from the game"
        hint={`JPG, PNG or WebP · Up to ${storageLabel(allowance?.maxImageBytes ?? mediaPolicy.memory.maxBytes)} per photo.`}
        buttonLabel="Choose a game photo"
        required
      />
      <div className="mt-4">
        <label htmlFor="memory-caption" className="text-sm font-semibold">
          Caption <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="memory-caption"
          name="caption"
          maxLength={240}
          autoComplete="off"
          placeholder="The point everyone talked about…"
          className="field"
        />
      </div>
      <SubmitButton
        disabled={albumFull || storageFull}
        pendingLabel="Adding photo…"
        className="mt-4 w-full"
      >
        <UploadSimple aria-hidden size={16} />
        Add to memory
      </SubmitButton>
      <p className="mt-2 text-xs leading-5 text-muted">
        Saved to the game’s shared album using the host’s photo storage.
      </p>
      <details className="mt-2 text-xs leading-5 text-muted">
        <summary className="cursor-pointer py-2 font-medium text-ink">
          How photo limits work
        </summary>
        <div className="space-y-2 pt-1">
          <p>
            The host’s storage covers game photos and chat images across all
            their games. Uploads stop when the album or storage is full. Neither
            resets monthly; only the hosted-game allowance does. Removing a
            photo frees space after deletion completes.
          </p>
          <p>
            Up to {mediaPolicy.memory.dailyUploads} game photo uploads per
            person per day, across games for signed-in players. Guest limits
            apply to this game. This daily allowance resets at midnight
            Philippine time; deleting a photo does not restore it.
          </p>
        </div>
      </details>
    </form>
  );
}
