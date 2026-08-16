"use client";

import { CaretUpDown, SignOut, SlidersHorizontal, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/features/auth/actions";
import { Avatar } from "./avatar-stack";

export function SidebarAccount({ name, username }: { name: string; username: string }) {
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

  return <div ref={root} className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} className="pressable flex h-10 w-full items-center gap-2 rounded-md px-1.5 text-left hover:bg-surface-strong"><Avatar name={name} size="sm" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span><CaretUpDown aria-hidden size={14} className="text-muted" /></button>{open ? <div role="menu" className="absolute bottom-11 left-0 z-40 w-full min-w-52 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"><div className="border-b border-line px-2 py-2"><p className="truncate text-sm font-medium">{name}</p><p className="mt-0.5 truncate text-xs text-muted">@{username}</p></div><Link role="menuitem" href={`/profile/${username}`} onClick={() => setOpen(false)} className="mt-1 flex min-h-9 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-strong hover:text-ink"><UserCircle size={17} />Profile</Link><Link role="menuitem" href="/preferences" onClick={() => setOpen(false)} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-strong hover:text-ink"><SlidersHorizontal size={17} />Preferences</Link><form action={signOut} className="mt-1 border-t border-line pt-1"><button role="menuitem" className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-strong hover:text-ink"><SignOut size={17} />Sign out</button></form></div> : null}</div>;
}
