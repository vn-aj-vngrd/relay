"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ButtonSpinner } from "./button";

export function PendingSubmit({ pendingLabel, children, ...props }: ComponentProps<"button"> & { pendingLabel: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return <button {...props} disabled={props.disabled || pending} aria-disabled={props.disabled || pending}>{pending ? <><ButtonSpinner />{pendingLabel}</> : children}</button>;
}
