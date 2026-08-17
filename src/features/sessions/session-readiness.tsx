import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { SessionReadiness } from "./readiness";
import { readinessTaskLabel } from "./readiness";

export function SessionReadinessPanel({ readiness, sessionId }: { readiness: SessionReadiness; sessionId: string }) {
  const href = (task: SessionReadiness["missing"][number]) => task === "roster" ? `/games/${sessionId}/players` : task === "booking" ? `/games/${sessionId}/settings#settings-booking` : `/games/${sessionId}/payments`;
  return <div className="mt-5 border-t border-line pt-4">
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-[650]">{readiness.ready ? "Ready to play" : "Game setup"}</p>{readiness.ready ? <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success"><CheckCircle aria-hidden weight="fill" size={17} />Ready</span> : <span className="score text-sm font-semibold text-muted">{readiness.percent}%</span>}</div>
    {!readiness.ready ? <><div role="progressbar" aria-label="Game setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness.percent} className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-strong"><span className="block h-full rounded-full bg-primary" style={{ width: `${readiness.percent}%` }} /></div><ul className="mt-3 space-y-1.5">{readiness.missing.slice(0, 2).map((task) => <li key={task}><Link href={href(task)} className="inline-flex min-h-8 items-center text-xs font-medium text-primary hover:text-primary-hover">{readinessTaskLabel(task)} →</Link></li>)}</ul></> : <p className="mt-2 text-xs leading-5 text-muted">Roster, booking, and shared costs are ready.</p>}
  </div>;
}
