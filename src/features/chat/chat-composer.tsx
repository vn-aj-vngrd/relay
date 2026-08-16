"use client";

import { ImageSquare, PaperPlaneRight, X } from "@phosphor-icons/react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { sendMessage } from "./actions";

export function ChatComposer({ sessionId, slug }: { sessionId: string; slug?: string }) {
  const [state, action, pending] = useActionState(sendMessage, {});
  const [fileName, setFileName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
  }, [state.success]);

  return <form ref={formRef} action={action} onReset={() => setFileName("")} className="sticky bottom-20 z-10 border-t border-line bg-surface py-3 md:bottom-0"><input type="hidden" name="sessionId" value={sessionId} />{slug ? <input type="hidden" name="slug" value={slug} /> : null}{fileName ? <div className="mb-2 flex items-center justify-between rounded-lg bg-surface-strong px-3 py-2 text-xs"><span className="truncate">Photo · {fileName}</span><button type="button" aria-label="Remove attached photo" onClick={() => { if (fileRef.current) fileRef.current.value = ""; setFileName(""); }} className="grid h-8 w-8 place-items-center text-muted hover:text-ink"><X aria-hidden size={15} /></button></div> : null}<div className="flex items-end gap-2"><label className="pressable grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"><span className="sr-only">Attach a photo</span><ImageSquare aria-hidden size={20} /><input ref={fileRef} name="image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} /></label><label htmlFor="message" className="sr-only">Message</label><textarea id="message" name="body" maxLength={1000} rows={1} autoComplete="off" placeholder="Message the group" className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-[15px] leading-6 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" /><Button type="submit" aria-label="Send message" disabled={pending} className="h-11 min-h-11 w-11 shrink-0 px-0">{pending ? <ButtonSpinner /> : <PaperPlaneRight aria-hidden size={18} weight="fill" />}</Button></div>{state.error ? <p role="alert" className="mt-2 px-1 text-sm font-medium text-danger">{state.error}</p> : null}</form>;
}
