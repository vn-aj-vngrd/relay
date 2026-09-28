import Link from "next/link";
import type { getAgentAdminMetrics } from "./admin-metrics";
import { AgentConnectionForm } from "./connection-form";

type Metrics = Awaited<ReturnType<typeof getAgentAdminMetrics>>;
type Check = { label: string; ready: boolean; hint: string };

function MetricRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm leading-6 text-muted">
        {label}
        {detail ? (
          <span className="block text-xs leading-5">{detail}</span>
        ) : null}
      </dt>
      <dd className="score text-right text-base font-semibold">{value}</dd>
    </div>
  );
}

function MetricGroup({
  title,
  children,
  divider = "all",
}: {
  title: string;
  children: React.ReactNode;
  divider?: "all" | "mobile" | "none";
}) {
  const dividerClass = {
    all: "border-t border-line",
    mobile: "border-t border-line lg:border-t-0",
    none: "",
  }[divider];
  return (
    <section aria-label={title} className={`py-7 ${dividerClass}`}>
      <h3 className="text-base font-semibold">{title}</h3>
      <dl className="mt-3 divide-y divide-line">{children}</dl>
    </section>
  );
}

function RatioRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total ? (value / total) * 100 : 0;
  return (
    <MetricRow
      label={label}
      value={`${value} of ${total} · ${percent.toFixed(1)}%`}
    />
  );
}

function Cost({ requests }: { requests: NonNullable<Metrics["requests"]> }) {
  if (!requests.costReported30Days) return "Unavailable";
  if (requests.costUsdMicros > 0 && requests.costUsdMicros < 100) {
    return "<$0.0001";
  }
  return `$${(requests.costUsdMicros / 1_000_000).toFixed(4)}`;
}

export function AgentAdminOverview({
  checks,
  metrics,
}: {
  checks: Check[];
  metrics: Metrics | null;
}) {
  const readyCount = checks.filter((check) => check.ready).length;
  const allReady = readyCount === checks.length;
  const requests = metrics?.requests;

  return (
    <div>
      <section aria-labelledby="agent-readiness" className="mb-9">
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
        <details className="mt-4 border-y border-line" open={!allReady}>
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            View setup checks and test connection
          </summary>
          <p className="pb-2 text-sm leading-6 text-muted">
            Server checks for this deployment. Provider access and model
            compatibility are verified when you send a question.
          </p>
          <ul className="divide-y divide-line">
            {checks.map((check) => (
              <li key={check.label} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span>{check.label}</span>
                  <span
                    className={check.ready ? "text-success" : "text-warning"}
                  >
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
        </details>
      </section>

      <section aria-labelledby="agent-usage-metrics">
        <h2 id="agent-usage-metrics" className="text-lg font-semibold">
          Usage metrics
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Aggregate usage and voluntary reply ratings for the last 30 days. Open
          reports are current. No conversation content is shown.
        </p>
        {!metrics ? (
          <p role="status" className="mt-5 text-sm text-warning">
            Usage metrics are temporarily unavailable. Settings remain editable.
          </p>
        ) : (
          <>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              <MetricRow
                label="Charged messages · 30 days"
                detail={`${metrics.charged7Days} in the last 7 days`}
                value={metrics.charged30Days}
              />
              <MetricRow
                label="Active users · 30 days"
                detail="With a charged message"
                value={metrics.activeUsers30Days}
              />
              <MetricRow
                label="Provider attempts · 30 days"
                detail={
                  requests
                    ? `${requests.attempts7Days} in the last 7 days`
                    : "Answer metrics unavailable"
                }
                value={requests ? requests.attempts30Days : "—"}
              />
            </dl>

            {requests?.attempts30Days ? (
              <dl
                aria-label="Answer health"
                className="flex flex-wrap gap-x-8 gap-y-3 border-b border-line py-4"
              >
                <div>
                  <dt className="text-xs text-muted">Failed attempts</dt>
                  <dd className="score mt-1 text-sm font-semibold">
                    {requests.failed30Days} of {requests.attempts30Days}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">P95 response time</dt>
                  <dd className="score mt-1 text-sm font-semibold">
                    {requests.p95DurationMs.toLocaleString()} ms
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Player-rated replies</dt>
                  <dd className="score mt-1 text-sm font-semibold">
                    {metrics.goodRatings30Days === null ||
                    metrics.badRatings30Days === null
                      ? "Unavailable"
                      : `${metrics.goodRatings30Days} good · ${metrics.badRatings30Days} needs work`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Open answer reports</dt>
                  <dd className="score mt-1 text-sm font-semibold">
                    {metrics.openReports ?? "Unavailable"}
                  </dd>
                </div>
              </dl>
            ) : !requests ? (
              <p
                role="status"
                className="border-b border-line py-4 text-sm text-warning"
              >
                Answer metrics are unavailable. Message usage is still shown.
                <span className="mt-1 block text-muted">
                  Open answer reports: {metrics.openReports ?? "Unavailable"}
                </span>
              </p>
            ) : (
              <p className="border-b border-line py-4 text-sm text-muted">
                No provider attempts recorded in the last 30 days. Latency,
                errors and cost have no sample yet.
                <span className="mt-1 block">
                  Open answer reports: {metrics.openReports ?? "Unavailable"}
                </span>
              </p>
            )}

            <details className="border-b border-line">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Detailed metrics and definitions
              </summary>
              <div className="grid gap-x-10 lg:grid-cols-2">
                <MetricGroup title="Message delivery" divider="none">
                  <MetricRow
                    label="Released before text · 7 days"
                    value={metrics.released7Days}
                  />
                  <MetricRow
                    label="Released before text · 30 days"
                    value={metrics.released30Days}
                  />
                  <MetricRow
                    label="In-progress reservations"
                    value={metrics.reserved30Days}
                  />
                </MetricGroup>
                <MetricGroup title="Feedback" divider="mobile">
                  <MetricRow
                    label="Rated replies · 30 days"
                    value={
                      metrics.goodRatings30Days === null ||
                      metrics.badRatings30Days === null
                        ? "Unavailable"
                        : metrics.goodRatings30Days + metrics.badRatings30Days
                    }
                  />
                  <MetricRow
                    label="Good reply ratings · 30 days"
                    value={metrics.goodRatings30Days ?? "Unavailable"}
                  />
                  <MetricRow
                    label="Needs work ratings · 30 days"
                    value={metrics.badRatings30Days ?? "Unavailable"}
                  />
                  <MetricRow
                    label="Answer reports · 30 days"
                    value={metrics.reports30Days ?? "Unavailable"}
                  />
                  <MetricRow
                    label="Unresolved answer reports"
                    value={metrics.openReports ?? "Unavailable"}
                  />
                  <div className="pt-3">
                    <dt className="sr-only">Feedback queue</dt>
                    <dd>
                      <Link
                        href="/admin/feedback"
                        className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        Review feedback
                      </Link>
                    </dd>
                  </div>
                </MetricGroup>
              </div>

              {!requests ? (
                <p className="border-t border-line py-5 text-sm text-warning">
                  Answer metrics are unavailable. Check the Agent metrics
                  migration and database connection. Message usage above is
                  still available.
                </p>
              ) : requests.attempts30Days ? (
                <div className="grid gap-x-10 lg:grid-cols-2">
                  <MetricGroup title="Reliability">
                    <RatioRow
                      label="Failure rate · 30 days"
                      value={requests.failed30Days}
                      total={requests.attempts30Days}
                    />
                    <MetricRow
                      label="Failed attempts · 7 days"
                      value={requests.failed7Days}
                    />
                    <MetricRow
                      label="Failed attempts · 30 days"
                      value={requests.failed30Days}
                    />
                    <MetricRow
                      label="Stopped attempts · 30 days"
                      value={requests.stopped30Days}
                    />
                    <MetricRow
                      label="Failed tool reads · 30 days"
                      value={requests.toolFailures30Days}
                    />
                    <RatioRow
                      label="Requests with first text"
                      value={requests.firstTextCount30Days}
                      total={requests.attempts30Days}
                    />
                  </MetricGroup>
                  <div>
                    <MetricGroup title="Response time">
                      <MetricRow
                        label="Average request time · 30 days"
                        value={`${requests.averageDurationMs.toLocaleString()} ms`}
                      />
                      <MetricRow
                        label="P95 request time · 30 days"
                        value={`${requests.p95DurationMs.toLocaleString()} ms`}
                      />
                      <MetricRow
                        label="Average time to first text · 30 days"
                        value={
                          requests.firstTextCount30Days
                            ? `${requests.averageFirstTextMs.toLocaleString()} ms`
                            : "No answers started"
                        }
                      />
                    </MetricGroup>
                    <MetricGroup title="Provider cost">
                      <MetricRow
                        label="Reported provider cost · 30 days"
                        value={<Cost requests={requests} />}
                      />
                      <RatioRow
                        label="Requests with provider cost"
                        value={requests.costReported30Days}
                        total={requests.attempts30Days}
                      />
                    </MetricGroup>
                  </div>
                </div>
              ) : null}
              <p className="mt-4 max-w-3xl text-xs leading-5 text-muted">
                Charged includes answers later interrupted. Released includes
                stopped or failed requests before text. Failure rate uses
                provider attempts; stops are separate. P95 means 95% of recorded
                attempts finished within that time. Provider cost includes only
                requests with complete OpenRouter step costs. Missing cost
                remains unknown; rejections before generation are excluded.
              </p>
              <p className="mt-2 max-w-3xl pb-5 text-xs leading-5 text-muted">
                Reply ratings are voluntary feedback from replies players last
                rated in this period, not a score for all answers. Admin review
                does not change their rating date. Answer reports are separate
                signals to investigate, not verified model errors.
              </p>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
