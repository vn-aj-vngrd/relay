import { desc, eq } from "drizzle-orm";
import { Bell } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await db.query.notifications.findMany({ where: eq(notifications.userId, user.id), orderBy: desc(notifications.createdAt), limit: 40 });
  return <div className="mx-auto max-w-2xl"><h1 className="app-title">Notifications</h1>{items.length ? <div className="mt-7 divide-y divide-line border-y border-line">{items.map((item) => <article key={item.id} className={`flex gap-3 py-4 ${!item.readAt ? "bg-primary-soft/50" : ""}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-strong text-primary"><Bell size={18} /></span><div className="flex-1"><h2 className="text-sm font-semibold">{String(item.payload.title ?? item.type.replaceAll("_", " "))}</h2><p className="mt-1 text-sm leading-5 text-muted">{String(item.payload.body ?? "Open Relay for details.")}</p></div><time className="score text-xs text-muted">{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(item.createdAt)}</time></article>)}</div> : <section className="mt-8 border-y border-line py-10"><Bell className="text-primary" /><h2 className="mt-4 text-xl font-bold">You’re all caught up</h2><p className="mt-2 text-sm text-muted">Invites, roster changes, payment updates, and game reminders will appear here.</p></section>}</div>;
}
