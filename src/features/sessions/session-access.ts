export type SessionWorkspaceAccess = "host" | "cohost" | "participant" | "invited" | "pending" | "discoverer";

type WorkspaceAccessInput = {
  userId: string;
  hostId: string;
  visibility: string;
  status: string;
  endsAt: Date;
  estimatedCostCents: number | null;
  membership: { role: string; rsvp: string } | null | undefined;
  now?: Date;
};

export function resolveSessionWorkspaceAccess({
  userId,
  hostId,
  visibility,
  status,
  endsAt,
  estimatedCostCents,
  membership,
  now = new Date(),
}: WorkspaceAccessInput): SessionWorkspaceAccess | null {
  if (hostId === userId) return "host";
  if (membership?.role === "cohost") return "cohost";
  if (membership?.rsvp === "invited") return "invited";
  if (membership?.rsvp === "pending") return "pending";
  if (membership && ["going", "maybe", "waitlisted"].includes(membership.rsvp)) return "participant";
  if (visibility === "public" && ["published", "live"].includes(status) && endsAt > now && estimatedCostCents !== null)
    return "discoverer";
  return null;
}

export function canParticipateInWorkspace(access: SessionWorkspaceAccess) {
  return ["host", "cohost", "participant"].includes(access);
}

export function canManageSessionWorkspace(access: SessionWorkspaceAccess) {
  return access === "host" || access === "cohost";
}
