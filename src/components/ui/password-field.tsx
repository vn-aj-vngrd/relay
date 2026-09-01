"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

type PasswordFieldProps = Omit<ComponentProps<"input">, "className" | "type"> & {
  label: string;
  hint?: ReactNode;
  className?: string;
  labelClassName?: string;
};

export function PasswordField({
  label,
  hint,
  className = "",
  labelClassName = "font-semibold",
  id,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const actionLabel = `${visible ? "Hide" : "Show"} ${label.toLowerCase()}`;

  return (
    <div className={className}>
      <label htmlFor={id} className={`text-sm ${labelClassName}`}>
        {label}
      </label>
      <div className="relative">
        <input id={id} type={visible ? "text" : "password"} className="field pr-12" {...inputProps} />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={actionLabel}
          aria-pressed={visible}
          className="pressable absolute right-1 top-2 grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          {visible ? <EyeSlash aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
        </button>
      </div>
      {hint}
    </div>
  );
}
