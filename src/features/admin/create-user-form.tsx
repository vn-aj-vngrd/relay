"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, ButtonLink, ButtonSpinner } from "@/components/ui/button";
import { createUserAction, type AdminActionState } from "./actions";

function CreateButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <><ButtonSpinner />Creating account…</> : "Create account"}</Button>;
}

export function CreateUserForm() {
  const [state, action] = useActionState<AdminActionState, FormData>(createUserAction, {});
  const [copied, setCopied] = useState(false);

  if (state.temporaryPassword && state.accountEmail) {
    const credentials = `Email: ${state.accountEmail}\nTemporary password: ${state.temporaryPassword}`;
    return <section aria-labelledby="account-created" className="max-w-xl border-y border-line py-6"><div className="flex items-center gap-2 text-success"><Check aria-hidden size={20} weight="bold" /><h2 id="account-created" className="font-bold">Account created</h2></div><p className="mt-3 text-sm leading-6 text-muted">Share these credentials privately. The temporary password is shown once, and the player must replace it at first sign-in.</p><dl className="mt-5 divide-y divide-line rounded-lg bg-surface-strong px-4"><div className="py-3"><dt className="text-xs font-semibold text-muted">Email</dt><dd className="mt-1 break-all text-sm font-medium">{state.accountEmail}</dd></div><div className="py-3"><dt className="text-xs font-semibold text-muted">Temporary password</dt><dd className="score mt-1 break-all text-sm font-bold">{state.temporaryPassword}</dd></div></dl><div className="mt-5 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(credentials); setCopied(true); }}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Copied" : "Copy credentials"}</Button><ButtonLink href="/admin/users">Done</ButtonLink></div></section>;
  }

  return <form action={action} className="max-w-xl space-y-5"><div><label htmlFor="admin-user-email" className="text-sm font-semibold">Email</label><input id="admin-user-email" name="email" type="email" autoComplete="off" required className="field" placeholder="player@example.com" /></div><div><label htmlFor="admin-user-name" className="text-sm font-semibold">Display name</label><input id="admin-user-name" name="name" required maxLength={80} className="field" placeholder="Mika Santos" /></div><div><label htmlFor="admin-user-username" className="text-sm font-semibold">Username</label><input id="admin-user-username" name="username" required minLength={3} maxLength={24} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="field" placeholder="mika-santos" /><p className="mt-2 text-xs text-muted">Lowercase letters, numbers, and single hyphens.</p></div>{state.error ? <p role="alert" className="text-sm font-medium text-danger">{state.error}</p> : null}<div className="flex gap-2"><CreateButton /><ButtonLink href="/admin/users" variant="secondary">Cancel</ButtonLink></div></form>;
}
