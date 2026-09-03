"use client";

import { Warning } from "@phosphor-icons/react/dist/icons/Warning";
import { type ComponentProps, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonSpinner } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type ConfirmSubmitButtonProps = ComponentProps<typeof Button> & {
  confirmTitle: string;
  confirmText: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  confirmTitle,
  confirmText,
  confirmLabel = "Confirm",
  cancelLabel = "Keep playing",
  pendingLabel = "Working…",
  children,
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  function closeDialog() {
    dialogRef.current?.close();
  }

  function confirmSubmission() {
    const form = formRef.current;
    closeDialog();
    form?.requestSubmit();
  }

  return (
    <>
      <Button
        {...props}
        type="button"
        aria-haspopup="dialog"
        disabled={props.disabled || pending}
        onClick={(event) => {
          props.onClick?.(event);
          if (event.defaultPrevented) return;
          formRef.current = event.currentTarget.form;
          dialogRef.current?.showModal();
        }}
      >
        {pending ? (
          <>
            <ButtonSpinner />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </Button>
      <Dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning/12 text-warning">
              <Warning aria-hidden size={19} weight="fill" />
            </span>
            <div>
              <h2 id={titleId} className="text-lg font-[680]">
                {confirmTitle}
              </h2>
              <p
                id={descriptionId}
                className="mt-2 text-sm leading-6 text-muted"
              >
                {confirmText}
              </p>
            </div>
          </div>
          <div className="mt-7 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDialog}>
              {cancelLabel}
            </Button>
            <Button type="button" onClick={confirmSubmission}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
