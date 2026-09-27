export const metadata = { title: "Agent settings · Admin" };

import Link from "next/link";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { getAgentAdminMetrics } from "@/features/agent/admin-metrics";
import { readAgentSettings } from "@/features/agent/config";
import { AgentConnectionForm } from "@/features/agent/connection-form";
import { getAgentModels } from "@/features/agent/models";
import { agentReadiness } from "@/features/agent/readiness";
import { AgentSettingsForm } from "@/features/agent/settings-form";
import { getAgentUsage } from "@/features/agent/usage";

export default async function AdminAgentPage() {
  const admin = await requireAdmin();
  const { config, encryptedApiKey } = await readAgentSettings();
  const models = await getAgentModels(config.requireZeroRetention);
  const readiness = agentReadiness(config, encryptedApiKey);
  let usageReady = false;
  try {
    await getAgentUsage(admin.id, config);
    usageReady = true;
  } catch {
    /* Readiness stays unavailable without leaking query details. */
  }
  const modelReady = models.length
    ? models.some((model) => model.id === config.model)
    : null;
  const checks = [
    ...readiness.checks,
    {
      label: "Compatible model route",
      ready: modelReady === true,
      hint:
        modelReady === null
          ? "The public model catalog could not be verified. Run the connection test."
          : config.requireZeroRetention
            ? "This model has no listed zero-retention tool endpoint. Choose a suggested model, or explicitly change the privacy mode below."
            : "This model has no listed tool support. Choose a suggested model, save and test.",
    },
    {
      label: "Message usage service",
      ready: usageReady,
      hint: "The usage check failed. Check database connectivity and the Agent migration, then reload.",
    },
  ];
  let metrics: Awaited<ReturnType<typeof getAgentAdminMetrics>> | null = null;
  try {
    metrics = await getAgentAdminMetrics();
  } catch {
    /* Keep configuration available when reporting storage is unavailable. */
  }
  return (
    <div className="w-full">
      <AdminPageHeading
        title="Agent"
        description="Configure Relay's answers and confirmed creation capabilities. Changes are audited."
      />
      <section
        aria-labelledby="agent-readiness"
        className="mb-8 rounded-xl border border-line bg-surface p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="agent-readiness" className="text-lg font-semibold">
            Setup status
          </h2>
          <span
            className={`text-sm font-medium ${checks.every((check) => check.ready) ? "text-success" : "text-warning"}`}
          >
            {checks.every((check) => check.ready)
              ? "Ready to accept questions"
              : "Setup needs attention"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Server checks for this deployment. Provider access and model
          compatibility are verified when you send a question.
        </p>
        <ul className="mt-4 divide-y divide-line">
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
      </section>
      <section
        aria-labelledby="agent-usage-metrics"
        className="mb-8 rounded-xl border border-line bg-surface p-5"
      >
        <h2 id="agent-usage-metrics" className="text-lg font-semibold">
          Usage metrics
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Aggregate message usage and answer health. No questions, answers, user
          names, or tool data are shown here.
        </p>
        {metrics ? (
          <>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              {[
                ["Charged messages · 7 days", metrics.charged7Days],
                ["Charged messages · 30 days", metrics.charged30Days],
                ["Active users · 30 days", metrics.activeUsers30Days],
                ["Released before text · 7 days", metrics.released7Days],
                ["Released before text · 30 days", metrics.released30Days],
                ["In-progress reservations", metrics.reserved30Days],
                [
                  "Answer reports · 30 days",
                  metrics.reports30Days ?? "Unavailable",
                ],
                [
                  "Unresolved answer reports",
                  metrics.openReports ?? "Unavailable",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="text-sm leading-6 text-muted">{label}</dt>
                  <dd className="score text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-8 text-base font-semibold">Answer operations</h3>
            {!metrics.requests ? (
              <p role="status" className="mt-3 text-sm text-warning">
                Answer metrics are unavailable. Check the Agent metrics
                migration and database connection. Message usage above is still
                available.
              </p>
            ) : metrics.requests.attempts30Days === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No provider attempts recorded in the last 30 days. Latency,
                errors and cost have no sample yet.
              </p>
            ) : (
              <dl className="mt-3 divide-y divide-line border-y border-line">
                {[
                  [
                    "Provider attempts · 7 days",
                    metrics.requests.attempts7Days,
                  ],
                  [
                    "Provider attempts · 30 days",
                    metrics.requests.attempts30Days,
                  ],
                  ["Failed attempts · 7 days", metrics.requests.failed7Days],
                  ["Failed attempts · 30 days", metrics.requests.failed30Days],
                  [
                    "Failure rate · 30 days",
                    `${((metrics.requests.failed30Days / metrics.requests.attempts30Days) * 100).toFixed(1)}%`,
                  ],
                  [
                    "Stopped attempts · 30 days",
                    metrics.requests.stopped30Days,
                  ],
                  [
                    "Failed tool reads · 30 days",
                    metrics.requests.toolFailures30Days,
                  ],
                  [
                    "Average request time · 30 days",
                    `${metrics.requests.averageDurationMs.toLocaleString()} ms`,
                  ],
                  [
                    "P95 request time · 30 days",
                    `${metrics.requests.p95DurationMs.toLocaleString()} ms`,
                  ],
                  [
                    "Average time to first text · 30 days",
                    metrics.requests.firstTextCount30Days
                      ? `${metrics.requests.averageFirstTextMs.toLocaleString()} ms`
                      : "No answers started",
                  ],
                  [
                    "Requests with first text",
                    `${metrics.requests.firstTextCount30Days} of ${metrics.requests.attempts30Days}`,
                  ],
                  [
                    "Reported provider cost · 30 days",
                    metrics.requests.costReported30Days
                      ? `$${(metrics.requests.costUsdMicros / 1_000_000).toFixed(4)}`
                      : "Unavailable",
                  ],
                  [
                    "Requests with provider cost",
                    `${metrics.requests.costReported30Days} of ${metrics.requests.attempts30Days}`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <dt className="text-sm leading-6 text-muted">{label}</dt>
                    <dd className="score text-lg font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-4 text-xs leading-5 text-muted">
              Charged includes answers that started but were later interrupted.
              Released includes stopped or failed requests before answer text.
              Failure rate is failed provider attempts divided by all provider
              attempts; stops are shown separately. P95 means 95% of recorded
              attempts finished within that time. Provider cost sums requests
              with complete OpenRouter step costs; missing cost stays unknown.
              Rejections before generation are excluded.
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Answer reports are player-submitted feedback. Review them in the
              admin Feedback queue; a report is a signal to investigate, not a
              verified model error.
            </p>
            <Link
              href="/admin/feedback"
              className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline"
            >
              Review feedback
            </Link>
          </>
        ) : (
          <p role="status" className="mt-4 text-sm text-warning">
            Usage metrics are temporarily unavailable. Settings remain editable.
          </p>
        )}
      </section>
      {!config.requireZeroRetention ? (
        <p className="mb-6 text-sm leading-6 text-warning">
          Provider policy mode is active. The selected provider may retain or
          use messages and authorized game data.
        </p>
      ) : null}
      <AgentSettingsForm
        models={models}
        config={config}
        hasKey={Boolean(encryptedApiKey)}
        storageReady={readiness.storageReady}
      />
    </div>
  );
}
