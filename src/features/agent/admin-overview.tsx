import { AgentConnectionForm } from "./connection-form";

type Check = { label: string; ready: boolean; hint: string };

export function AgentAdminOverview({ checks }: { checks: Check[] }) {
  const readyCount = checks.filter((check) => check.ready).length;
  const allReady = readyCount === checks.length;

  return (
    <section aria-labelledby="agent-readiness" className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="agent-readiness" className="text-lg font-semibold">
            Setup status
          </h2>
          <p
            className={`mt-1 text-sm font-semibold ${allReady ? "text-success" : "text-warning"}`}
          >
            {allReady ? "Ready to accept questions" : "Setup needs attention"}
          </p>
        </div>
        <span className="score text-sm text-muted">
          {readyCount} of {checks.length} checks ready
        </span>
      </div>
      <div
        aria-label={`${readyCount} of ${checks.length} setup checks ready`}
        className="mt-5 h-2 overflow-hidden rounded-full bg-surface-raised"
        role="img"
      >
        <div
          className={`h-full rounded-full ${allReady ? "bg-success" : "bg-warning"}`}
          style={{
            width: `${checks.length ? (readyCount / checks.length) * 100 : 0}%`,
          }}
        />
      </div>
      <div className="mt-5 border-y border-line pt-4">
        <p className="pb-2 text-sm leading-6 text-muted">
          Server checks for this deployment. Provider access and model
          compatibility are verified when you send a question.
        </p>
        <ul className="divide-y divide-line">
          {checks.map((check) => (
            <li key={check.label} className="py-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span>{check.label}</span>
                <span className={check.ready ? "text-success" : "text-warning"}>
                  {check.ready ? "Ready" : "Needs attention"}
                </span>
              </div>
              {!check.ready ? (
                <p className="mt-1 text-xs leading-5 text-muted">
                  {check.hint}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <AgentConnectionForm />
      </div>
    </section>
  );
}
