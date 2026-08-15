import { GripVertical, Radio, Shuffle, Wifi } from "lucide-react";
import { Avatar } from "@/components/shared/avatar-stack";
import { SessionNav } from "@/components/shared/session-nav";
import { Button } from "@/components/ui/button";
import { LiveCourt } from "@/features/matches/live-court";
import { session } from "@/features/sessions/demo-data";

const queue = ["Sarah Yu", "James Co", "Mika Reyes", "John Lim"];

export default function LivePage() {
  return <div>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[oklch(.96_.04_25)] text-danger"><Radio size={21} /></span><div><p className="text-sm font-semibold text-danger">Live Mode</p><h1 className="text-2xl font-bold tracking-[-0.03em]">{session.title}</h1></div></div><span className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted"><Wifi size={17} className="text-success" />Everyone is up to date</span></div>
    <SessionNav id={session.id} active="Courts" />
    <div className="grid gap-7 pt-6 lg:grid-cols-[1fr_330px]">
      <section aria-labelledby="active-courts-title"><div className="mb-4 flex items-center justify-between"><div><h2 id="active-courts-title" className="text-lg font-bold">Active courts</h2><p className="mt-1 text-sm text-muted">Tap + or − to keep score</p></div><Button variant="secondary"><Shuffle size={17} />New rotation</Button></div><div className="grid gap-5 xl:grid-cols-2"><LiveCourt number={1} teams={["Van + AJ", "John + Mika"]} /><LiveCourt number={2} teams={["Chris + Josh", "Mark + Kyle"]} initial={[10, 10]} /></div></section>
      <aside><div className="flex items-end justify-between"><div><h2 className="text-lg font-bold">Up next</h2><p className="mt-1 text-sm text-muted">Queue · longest waiting first</p></div><button className="min-h-11 text-sm font-semibold text-primary">Edit</button></div><ol className="mt-3 divide-y divide-line border-y border-line">{queue.map((player, index) => <li key={player} className="flex min-h-16 items-center gap-3 py-2"><span className="score w-5 text-center text-sm font-bold text-muted">{index + 1}</span><Avatar name={player} index={index + 1} size="sm" /><span className="flex-1 text-sm font-semibold">{player}</span><GripVertical aria-label={`Move ${player}`} className="text-muted" size={19} /></li>)}</ol><div className="mt-6"><h3 className="font-bold">Resting</h3><p className="mt-2 text-sm text-muted">No one is resting right now.</p></div><div className="mt-7 rounded-xl bg-primary-soft p-4"><p className="text-sm font-semibold">Queue rotation</p><p className="mt-1 text-sm leading-5 text-muted">The four players waiting longest form the next match. You can always reorder or override it.</p></div></aside>
    </div>
  </div>;
}
