"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button, ButtonSpinner } from "@/components/ui/button";

export function ConfirmSubmitButton({ confirmText, pendingLabel = "Working…", children, ...props }: ComponentProps<typeof Button> & { confirmText: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <Button {...props} disabled={props.disabled || pending} onClick={(event) => {
    if (!window.confirm(confirmText)) event.preventDefault();
    props.onClick?.(event);
  }}>{pending ? <><ButtonSpinner />{pendingLabel}</> : children}</Button>;
}
