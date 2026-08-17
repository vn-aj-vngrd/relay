"use client";

import { CaretUpDown, ShieldCheck, SignOut, SlidersHorizontal, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ButtonSpinner } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { Avatar } from "./avatar-stack";

function SignOutButton() {
  const { pending } = useFormStatus();
  return <button role="menuitem" disabled={pending} className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted hover:bg-surface-strong hover:text-ink disabled:opacity-50">{pending ? <ButtonSpinner /> : <SignOut size={17} />}{pending ? "Signing out…" : "Sign out"}</button>;
}

export function SidebarAccount({ name, username, avatarUrl, isAdmin = false }: { name: string; username: string; avatarUrl?: string; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <div ref={root} data-tour="profile" className="sidebar-account relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Open account menu for ${name}`} aria-haspopup="menu" aria-expanded={open} className="sidebar-account-trigger pressable group relative flex h-10 w-full items-center gap-2 rounded-md px-1.5 text-left hover:bg-surface-strong"><Avatar name={name} imageUrl={avatarUrl} size="sm" /><span className="sidebar-account-copy min-w-0 flex-1 truncate text-[13px] font-medium">{name}</span><CaretUpDown aria-hidden size={14} className="sidebar-account-caret text-muted" /><span role="tooltip" className="sidebar-item-tooltip">{name}</span></button>{open ? <div role="menu" className="sidebar-account-menu absolute bottom-11 left-0 z-40 w-full min-w-52 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"><div className="border-b border-line px-2 py-2"><p className="truncate text-sm font-medium">{name}</p><p className="mt-0.5 truncate text-xs text-muted">@{username}</p></div><Link role="menuitem" href={`/profile/${username}`} onClick={() => setOpen(false)} className="mt-1 flex min-h-9 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-strong hover:text-ink"><UserCircle size={17} />Profile</Link><Link role="menuitem" href="/preferences" onClick={() => setOpen(false)} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-strong hover:text-ink"><SlidersHorizontal size={17} />Preferences</Link>{isAdmin ? <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-strong hover:text-ink"><ShieldCheck size={17} />Admin console</Link> : null}<form action={signOut} className="mt-1 border-t border-line pt-1"><SignOutButton /></form></div> : null}</div>;
}
