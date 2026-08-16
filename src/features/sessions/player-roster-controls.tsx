"use client";

import { Check, LockKey, LockKeyOpen, UserMinus, UserPlus, X } from "@phosphor-icons/react";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { addGuestPlayerAction, approvePlayerAction, removePlayerAction, toggleRosterLockAction, type SessionActionState } from "./actions";

export function AddGuestPlayerForm({ sessionId }: { sessionId: string }) {
  const [state, action] = useActionState<SessionActionState, FormData>(addGuestPlayerAction, {});
  return <form action={action} className="mt-4"><input type="hidden" name="sessionId" value={sessionId} /><div className="flex gap-2"><label htmlFor="guest-player-name" className="sr-only">Player name</label><input id="guest-player-name" name="guestName" required minLength={2} maxLength={60} autoComplete="off" placeholder="Add a friend by name" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" /><SubmitButton pendingLabel="Adding…" variant="secondary"><UserPlus aria-hidden size={17} />Add</SubmitButton></div>{state.error ? <p role="alert" className="mt-2 text-sm font-medium text-danger">{state.error}</p> : state.success ? <p role="status" className="mt-2 text-sm font-medium text-success">Player added.</p> : null}</form>;
}

export function PendingPlayerActions({ sessionId, playerId }: { sessionId: string; playerId: string }) {
  const [approveState, approveAction] = useActionState<SessionActionState, FormData>(approvePlayerAction, {});
  const [removeState, removeAction] = useActionState<SessionActionState, FormData>(removePlayerAction, {});
  return <div><div className="flex gap-2"><form action={approveAction}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="sessionPlayerId" value={playerId} /><SubmitButton pendingLabel="Approving…" className="min-h-9 px-3"><Check aria-hidden size={16} />Approve</SubmitButton></form><form action={removeAction}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="sessionPlayerId" value={playerId} /><SubmitButton pendingLabel="Rejecting…" variant="quiet" className="min-h-9 px-3 text-danger"><X aria-hidden size={16} />Reject</SubmitButton></form></div>{approveState.error || removeState.error ? <p role="alert" className="mt-1 text-xs font-medium text-danger">{approveState.error ?? removeState.error}</p> : null}</div>;
}

export function RemovePlayerButton({ sessionId, playerId, name }: { sessionId: string; playerId: string; name: string }) {
  const [state, action] = useActionState<SessionActionState, FormData>(removePlayerAction, {});
  return <form action={action}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="sessionPlayerId" value={playerId} /><SubmitButton pendingLabel="Removing…" type="submit" variant="quiet" aria-label={`Remove ${name}`} className="min-h-9 px-2 text-danger" onClick={(event) => { if (!window.confirm(`Remove ${name} from this game?`)) event.preventDefault(); }}><UserMinus aria-hidden size={17} /></SubmitButton>{state.error ? <span className="sr-only" role="alert">{state.error}</span> : null}</form>;
}

export function RosterLockButton({ sessionId, locked }: { sessionId: string; locked: boolean }) {
  return <form action={toggleRosterLockAction}><input type="hidden" name="sessionId" value={sessionId} /><SubmitButton pendingLabel={locked ? "Unlocking…" : "Locking…"} variant="secondary">{locked ? <LockKeyOpen aria-hidden size={17} /> : <LockKey aria-hidden size={17} />}{locked ? "Unlock roster" : "Lock roster"}</SubmitButton></form>;
}
