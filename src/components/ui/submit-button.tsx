"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonSpinner } from "./button";

export function SubmitButton({
  pendingLabel,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={disabled || pending} aria-disabled={disabled || pending}>
      {pending ? (
        <>
          <ButtonSpinner />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
