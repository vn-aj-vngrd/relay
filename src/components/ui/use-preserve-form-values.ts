"use client";

import { useEffect, useRef } from "react";

type FormActionState = { error?: unknown; fieldErrors?: unknown };
type RestorableControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type ControlSnapshot = {
  control: RestorableControl;
  checked?: boolean;
  files?: File[];
  value?: string;
};

function hideValidationMessage(message: HTMLElement) {
  if (message.getAttribute("role") !== "alert" && !message.classList.contains("text-danger")) return;
  message.hidden = true;
  message.dataset.clearedValidationError = "true";
}

function clearChangedFieldError(event: Event) {
  const control = event.target;
  if (!(control instanceof HTMLElement)) return;
  control.setAttribute("aria-invalid", "false");
  control
    .querySelectorAll<HTMLElement>('[aria-invalid="true"]')
    .forEach((field) => field.setAttribute("aria-invalid", "false"));
  const describedBy = control.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
  describedBy.forEach((id) => {
    const message = document.getElementById(id);
    if (message) hideValidationMessage(message);
  });

  let container = control.parentElement;
  const form = control.closest("form");
  while (container && container !== form) {
    const messages = Array.from(container.querySelectorAll<HTMLElement>("[role='alert'], .text-danger")).filter(
      (message) => !message.dataset.clearedValidationError,
    );
    if (messages.length) {
      messages.forEach(hideValidationMessage);
      break;
    }
    container = container.parentElement;
  }
}

function captureControl(control: RestorableControl): ControlSnapshot | null {
  if (control instanceof HTMLInputElement) {
    if (["button", "hidden", "reset", "submit"].includes(control.type)) return null;
    if (control.type === "checkbox" || control.type === "radio") return { control, checked: control.checked };
    if (control.type === "file") return { control, files: Array.from(control.files ?? []) };
  }
  return { control, value: control.value };
}

function restoreControl(snapshot: ControlSnapshot) {
  const { control } = snapshot;
  if (!control.isConnected) return;
  if (snapshot.checked !== undefined && control instanceof HTMLInputElement) {
    control.checked = snapshot.checked;
    return;
  }
  if (snapshot.files && control instanceof HTMLInputElement && typeof DataTransfer !== "undefined") {
    const transfer = new DataTransfer();
    snapshot.files.forEach((file) => transfer.items.add(file));
    control.files = transfer.files;
    return;
  }
  if (snapshot.value !== undefined) control.value = snapshot.value;
}

/** Preserve user-entered values when a React form action returns validation feedback. */
export function usePreserveFormValuesOnError(state: FormActionState) {
  const snapshot = useRef<ControlSnapshot[]>([]);
  const observedForm = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!state.error && !state.fieldErrors) return;
    snapshot.current.forEach(restoreControl);
  }, [state]);

  useEffect(() => () => observedForm.current?.removeEventListener("input", clearChangedFieldError), []);

  return (event: React.FormEvent<HTMLFormElement>) => {
    if (observedForm.current !== event.currentTarget) {
      observedForm.current?.removeEventListener("input", clearChangedFieldError);
      observedForm.current = event.currentTarget;
      observedForm.current.addEventListener("input", clearChangedFieldError);
    }
    event.currentTarget.querySelectorAll<HTMLElement>("[data-cleared-validation-error]").forEach((message) => {
      message.hidden = false;
      delete message.dataset.clearedValidationError;
    });
    snapshot.current = Array.from(event.currentTarget.elements)
      .filter(
        (control): control is RestorableControl =>
          control instanceof HTMLInputElement ||
          control instanceof HTMLSelectElement ||
          control instanceof HTMLTextAreaElement,
      )
      .map(captureControl)
      .filter((control): control is ControlSnapshot => control !== null);
  };
}
