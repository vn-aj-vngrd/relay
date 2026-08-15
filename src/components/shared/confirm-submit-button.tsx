"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({ confirmText, ...props }: ComponentProps<typeof Button> & { confirmText: string }) {
  return <Button {...props} onClick={(event) => {
    if (!window.confirm(confirmText)) event.preventDefault();
    props.onClick?.(event);
  }} />;
}
