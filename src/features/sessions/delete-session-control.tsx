"use client";

import { Trash, Warning } from "@phosphor-icons/react";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { deleteSessionAction, type DeleteSessionState } from "./delete-session";

function DeleteButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="danger" disabled={!enabled || pending}>{pending ? <><ButtonSpinner />Deleting…</> : "Delete game"}</Button>;
}

export function DeleteSessionControl({ sessionId, title }: { sessionId: string; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [state, action] = useActionState<DeleteSessionState, FormData>(deleteSessionAction, {});
  const matches = confirmation.trim() === title;

  function openDialog() {
    dialogRef.current?.showModal();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeDialog() {
    dialogRef.current?.close();
    setConfirmation("");
  }

  return <div>
    <button type="button" onClick={openDialog} className="pressable flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm font-semibold text-danger"><Trash aria-hidden size={18} />Delete game</button>
    <dialog ref={dialogRef} onClose={() => setConfirmation("")} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-[0_8px_8px_oklch(0.1_0.01_275/.18)] backdrop:bg-black/45">
      <form action={action} className="p-5 sm:p-6">
        <input type="hidden" name="sessionId" value={sessionId} />
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger"><Warning aria-hidden size={19} weight="fill" /></span><div><h2 className="text-lg font-[680]">Delete this game?</h2><p id="delete-session-description" className="mt-2 text-sm leading-6 text-muted">This permanently removes the roster, payments, chat, matches, scores, and memories. This action cannot be undone.</p></div></div>
        <div className="mt-6"><label htmlFor="delete-confirmation" className="text-sm font-semibold">Type <span className="font-mono">{title}</span> to confirm</label><input ref={inputRef} id="delete-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="field" aria-describedby="delete-session-description" />{state.error ? <p role="alert" className="mt-2 text-sm font-medium text-danger">{state.error}</p> : null}</div>
        <div className="mt-7 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button><DeleteButton enabled={matches} /></div>
      </form>
    </dialog>
  </div>;
}
