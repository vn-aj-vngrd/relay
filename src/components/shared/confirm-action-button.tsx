"use client";

import { Warning } from "@phosphor-icons/react/dist/icons/Warning";
import { type ComponentProps, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type ConfirmActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  "onClick"
> & {
  confirmTitle: string;
  confirmText: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

export function ConfirmActionButton({
  confirmTitle,
  confirmText,
  confirmLabel = "Confirm",
  cancelLabel = "Keep playing",
  onConfirm,
  children,
  ...props
}: ConfirmActionButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <Button
        {...props}
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        {children}
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
            <Button
              type="button"
              onClick={() => {
                closeDialog();
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
