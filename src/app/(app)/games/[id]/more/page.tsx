import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { SessionNav } from "@/components/shared/session-nav";
import { requireUser } from "@/features/auth/session";
import { getSessionForUser } from "@/features/sessions/queries";

export default async function MorePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const sessionId = (await params).id;
  const data = await getSessionForUser(sessionId, user.id); if (!data) notFound();
  const isHost = data.session.hostId === user.id || data.membership?.role === "cohost";
  return <div><div className="mb-5"><p className="text-sm font-semibold text-primary">{data.session.title}</p><h1 className="mt-1 app-title">More</h1></div><SessionNav id={sessionId} active="More" /><div className="mx-auto max-w-2xl py-7"><section className="divide-y divide-line border-y border-line"><Link href={`/s/${data.session.slug}`} className="flex min-h-16 items-center justify-between py-3"><div><p className="font-semibold">Public game page</p><p className="mt-1 text-sm text-muted">Preview the link your friends receive.</p></div><ExternalLink className="text-muted" size={18} /></Link><div className="flex min-h-16 items-center gap-3 py-3"><ShieldCheck className="text-primary" /><div><p className="font-semibold">{isHost ? "You manage this game" : "Participant access"}</p><p className="mt-1 text-sm text-muted">{isHost ? "Roster, courts, scoring, and payment controls are available to you." : "Only hosts can change shared session details."}</p></div></div></section><section className="mt-9"><h2 className="font-bold">Session status</h2><dl className="mt-3 divide-y divide-line border-y border-line text-sm"><div className="flex justify-between py-4"><dt className="text-muted">Visibility</dt><dd className="font-medium capitalize">{data.session.visibility}</dd></div><div className="flex justify-between py-4"><dt className="text-muted">Rotation</dt><dd className="font-medium capitalize">{data.session.rotationMode.replaceAll("_", " ")}</dd></div><div className="flex justify-between py-4"><dt className="text-muted">Roster</dt><dd className="font-medium">{data.session.rosterLocked ? "Locked" : "Open"}</dd></div></dl></section></div></div>;
}
