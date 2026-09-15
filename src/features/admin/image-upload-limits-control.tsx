"use client";

import { useActionState } from "react";

import { PendingSubmit } from "@/components/ui/pending-submit";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";
import { MAX_IMAGE_UPLOAD_MIB } from "@/lib/upload-config";

import type { AdminActionState } from "./actions";
import { updateImageUploadLimitsAction } from "./image-upload-limits-action";

export function ImageUploadLimitsControl({
  chatImageMaxBytes,
  memoryImageMaxBytes,
}: {
  chatImageMaxBytes: number;
  memoryImageMaxBytes: number;
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(
    updateImageUploadLimitsAction,
    {}
  );
  const preserveValues = usePreserveFormValuesOnError(state);

  return (
    <section
      aria-labelledby="image-upload-limits-title"
      className="border-b border-line py-6"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-end">
        <div>
          <h2 id="image-upload-limits-title" className="text-lg font-bold">
            Photo upload sizes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Set separate sizes for new chat and game-album photos across all
            plans, including guest uploads. Existing photos stay available. Host
            storage, album counts and daily upload limits still apply.
          </p>
        </div>
        <form
          noValidate
          action={action}
          onSubmitCapture={preserveValues}
          className="min-w-0"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "chatImageMaxMiB",
                label: "Chat photo (MiB)",
                bytes: chatImageMaxBytes,
              },
              {
                name: "memoryImageMaxMiB",
                label: "Album photo (MiB)",
                bytes: memoryImageMaxBytes,
              },
            ].map(({ name, label, bytes }) => (
              <div key={name}>
                <label htmlFor={name} className="text-sm font-semibold">
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_IMAGE_UPLOAD_MIB}
                  step={1}
                  required
                  defaultValue={bytes / (1024 * 1024)}
                  aria-describedby="image-upload-limits-hint"
                  aria-invalid={Boolean(state.error)}
                  className="field min-w-0 tabular-nums"
                />
              </div>
            ))}
          </div>
          <p
            id="image-upload-limits-hint"
            className="mt-2 text-xs leading-5 text-muted"
          >
            Choose 1–4 MiB each. Larger photos use more host storage. New
            uploads use the saved limits; refresh open games to see them.
          </p>
          <PendingSubmit
            type="submit"
            pendingLabel="Saving…"
            className="pressable mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-3 text-[13px] font-semibold leading-none text-white hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-45"
          >
            Save photo limits
          </PendingSubmit>
          {state.error ? (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="mt-2 text-sm font-medium text-success">
              {state.success}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
