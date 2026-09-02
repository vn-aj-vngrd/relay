"use client";

import { UploadSimple } from "@phosphor-icons/react";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { ImageFileField } from "@/components/ui/image-file-field";
import { SubmitButton } from "@/components/ui/submit-button";

import { uploadMemoryPhotoState } from "./actions";

export function MemoryPhotoForm({ sessionId }: { sessionId: string }) {
  const [state, action] = useActionState(uploadMemoryPhotoState, {});
  return (
    <form noValidate action={action} className="border-y border-line py-5">
      {state.error ? <Alert className="mb-4">{state.error}</Alert> : null}
      <input type="hidden" name="sessionId" value={sessionId} />
      <ImageFileField
        id="memory-photo"
        name="photo"
        label="Add a photo from the game"
        hint="One JPG, PNG, or WebP image under 10 MB. It becomes part of this session memory."
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
      <SubmitButton pendingLabel="Adding photo…" className="mt-4 w-full sm:w-auto">
        <UploadSimple aria-hidden size={16} />
        Add to memory
      </SubmitButton>
    </form>
  );
}
