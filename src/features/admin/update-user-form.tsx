"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, ButtonLink, ButtonSpinner } from "@/components/ui/button";
import { updateUserProfileAction, type AdminActionState } from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <><ButtonSpinner />Saving changes…</> : "Save changes"}</Button>;
}

export function UpdateUserForm({ userId, profile }: { userId: string; profile: { name: string; username: string; city: string | null; skillLevel: string | null; dominantHand: string | null } | null }) {
  const [state, action] = useActionState<AdminActionState, FormData>(updateUserProfileAction, {});
  return <form action={action} className="max-w-xl space-y-5"><input type="hidden" name="userId" value={userId} /><div><label htmlFor="admin-profile-name" className="text-sm font-semibold">Display name</label><input id="admin-profile-name" name="name" required maxLength={80} defaultValue={profile?.name ?? ""} className="field" /></div><div><label htmlFor="admin-profile-username" className="text-sm font-semibold">Username</label><input id="admin-profile-username" name="username" required minLength={3} maxLength={24} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={profile?.username ?? ""} className="field" /></div><div><label htmlFor="admin-profile-city" className="text-sm font-semibold">City</label><input id="admin-profile-city" name="city" maxLength={80} defaultValue={profile?.city ?? ""} className="field" placeholder="Optional" /></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="admin-profile-skill" className="text-sm font-semibold">Playing experience</label><select id="admin-profile-skill" name="skillLevel" defaultValue={profile?.skillLevel ?? ""} className="field"><option value="">Not set</option><option value="new">New to pickleball</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div><div><label htmlFor="admin-profile-hand" className="text-sm font-semibold">Dominant hand</label><select id="admin-profile-hand" name="dominantHand" defaultValue={profile?.dominantHand ?? ""} className="field"><option value="">Not set</option><option value="right">Right</option><option value="left">Left</option></select></div></div>{state.error ? <p role="alert" className="text-sm font-medium text-danger">{state.error}</p> : null}{state.success ? <p role="status" className="text-sm font-medium text-success">{state.success}</p> : null}<div className="flex gap-2"><SaveButton /><ButtonLink href={`/admin/users/${userId}`} variant="secondary">Cancel</ButtonLink></div></form>;
}
