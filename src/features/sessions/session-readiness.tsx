import Link from "next/link";

import { playSetupNextAction, type SessionReadiness } from "./readiness";

export function SessionReadinessPanel({
  readiness,
  sessionId,
  hrefBase,
}: {
  readiness: SessionReadiness;
  sessionId: string;
  hrefBase?: string;
}) {
  const base = hrefBase ?? `/games/${sessionId}`;
  return (
    <div className="mt-5 border-t border-line pt-4">
      <Link
        href={`${base}/play/setup`}
        className="inline-flex min-h-9 items-center text-sm font-semibold text-primary"
      >
        {playSetupNextAction(readiness)} →
      </Link>
    </div>
  );
}
