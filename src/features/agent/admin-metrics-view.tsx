import Link from "next/link";
import type {
  getAgentAdminMetrics,
  getAgentRequestTrend,
} from "./admin-metrics";

type Metrics = Awaited<ReturnType<typeof getAgentAdminMetrics>>;
type Trend = Awaited<ReturnType<typeof getAgentRequestTrend>>;

function Measure({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="min-w-0 border-t border-line py-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="score mt-1 text-2xl font-semibold tracking-tight">
        {value}
      </dd>
      {note ? (
        <dd className="mt-1 text-xs leading-5 text-muted">{note}</dd>
      ) : null}
    </div>
  );
}

function Progress({
  label,
  value,
  total,
  description,
  tone = "primary",
}: {
  label: string;
  value: number;
  total: number;
  description: string;
  tone?: "primary" | "success" | "warning";
}) {
  const percent = total ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  const color = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
  }[tone];
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="score whitespace-nowrap font-semibold">
          {value} / {total}
        </span>
      </div>
      <div
        aria-label={`${label}: ${value} of ${total}, ${percent.toFixed(1)}%`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised"
        role="img"
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs leading-5 text-muted">
        {description} · {percent.toFixed(1)}%
      </p>
    </div>
  );
}

function Cost({ requests }: { requests: NonNullable<Metrics["requests"]> }) {
  if (!requests.costReported30Days) return "Unavailable";
  if (requests.costUsdMicros > 0 && requests.costUsdMicros < 100)
    return "<$0.0001";
  return `$${(requests.costUsdMicros / 1_000_000).toFixed(4)}`;
}

function TrendChart({ trend }: { trend: Trend }) {
  const max = Math.max(1, ...trend.map((day) => day.attempts));
  const total = trend.reduce((sum, day) => sum + day.attempts, 0);
  return (
    <section
      aria-labelledby="agent-trend-title"
      className="border-t border-line pt-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="agent-trend-title" className="text-base font-semibold">
          Provider attempts
        </h3>
        <span className="score text-sm text-muted">{total} in 14 days</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted">
        Daily attempts in UTC. Failed and stopped attempts are included in each
        bar.
      </p>
      {total ? (
        <div
          aria-label="Daily provider attempts over the last 14 days"
          className="mt-6 grid h-36 items-end gap-1.5 border-b border-line"
          role="img"
          style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
        >
          {trend.map((day) => (
            <div key={day.day} className="flex h-full items-end">
              <div
                className="w-full rounded-t-sm bg-primary/75"
                style={{
                  height: `${day.attempts ? Math.max(8, (day.attempts / max) * 100) : 0}%`,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 border-y border-line py-6 text-sm text-muted">
          No provider attempts recorded in this period.
        </p>
      )}
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{trend[0]?.day}</span>
        <span>{trend.at(-1)?.day}</span>
      </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="min-h-9 cursor-pointer text-primary">
          Daily values
        </summary>
        <ul className="mt-1 grid gap-1 sm:grid-cols-2">
          {trend.map((day) => (
            <li key={day.day}>
              {day.day}: {day.attempts} attempts, {day.failed} failed,{" "}
              {day.stopped} stopped
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function OutcomeChart({
  attempts,
  failed,
  stopped,
}: {
  attempts: number;
  failed: number;
  stopped: number;
}) {
  const completed = Math.max(0, attempts - failed - stopped);
  return (
    <figure className="mt-5">
      <div
        aria-label={`${completed} completed, ${failed} failed and ${stopped} stopped out of ${attempts} provider attempts`}
        className="flex h-3 overflow-hidden rounded-full bg-surface-raised"
        role="img"
      >
        <span
          className="bg-success"
          style={{ width: `${(completed / attempts) * 100}%` }}
        />
        <span
          className="bg-warning"
          style={{ width: `${(failed / attempts) * 100}%` }}
        />
        <span
          className="bg-muted/50"
          style={{ width: `${(stopped / attempts) * 100}%` }}
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>{completed} completed</span>
        <span>{failed} failed</span>
        <span>{stopped} stopped</span>
      </figcaption>
    </figure>
  );
}

export function AgentAdminMetricsView({
  metrics,
  trend,
}: {
  metrics: Metrics | null;
  trend: Trend | null;
}) {
  const requests = metrics?.requests;
  const ratings =
    metrics?.goodRatings30Days != null && metrics.badRatings30Days != null
      ? metrics.goodRatings30Days + metrics.badRatings30Days
      : null;
  return (
    <div className="max-w-5xl space-y-9">
      <header>
        <h2 className="text-lg font-semibold">Usage and answer health</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
          Recorded activity for the last 30 days. Counts and voluntary ratings
          show signals to investigate, not answer accuracy. No conversation
          content appears here.
        </p>
      </header>
      {!metrics ? (
        <p role="status" className="text-sm text-warning">
          Usage metrics are temporarily unavailable. Check the database
          connection.
        </p>
      ) : (
        <>
          <section aria-label="Usage summary">
            <dl className="grid gap-x-8 sm:grid-cols-3">
              <Measure
                label="Charged messages"
                value={metrics.charged30Days}
                note={`${metrics.charged7Days} in the last 7 days`}
              />
              <Measure
                label="Active users"
                value={metrics.activeUsers30Days}
                note="Distinct users with a charged message"
              />
              <Measure
                label="Provider attempts"
                value={requests ? requests.attempts30Days : "Unavailable"}
                note={
                  requests
                    ? `${requests.attempts7Days} in the last 7 days`
                    : "Request metrics could not be read"
                }
              />
            </dl>
          </section>
          {requests?.attempts30Days ? (
            <>
              <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
                {trend ? (
                  <TrendChart trend={trend} />
                ) : (
                  <section className="border-t border-line pt-6 text-sm text-warning">
                    Daily trend is unavailable. Summary metrics remain visible.
                  </section>
                )}
                <section
                  aria-labelledby="agent-reliability"
                  className="border-t border-line pt-6"
                >
                  <h3
                    id="agent-reliability"
                    className="text-base font-semibold"
                  >
                    Reliability
                  </h3>
                  <OutcomeChart
                    attempts={requests.attempts30Days}
                    failed={requests.failed30Days}
                    stopped={requests.stopped30Days}
                  />
                  <Progress
                    label="Completed attempts"
                    value={Math.max(
                      0,
                      requests.attempts30Days -
                        requests.failed30Days -
                        requests.stopped30Days
                    )}
                    total={requests.attempts30Days}
                    description="Finished without a recorded failure or stop"
                    tone="success"
                  />
                  <Progress
                    label="Failed attempts"
                    value={requests.failed30Days}
                    total={requests.attempts30Days}
                    description={`${requests.failed7Days} failed in the last 7 days`}
                    tone="warning"
                  />
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {requests.stopped30Days} stopped attempts ·{" "}
                    {requests.toolFailures30Days} failed tool reads. Stops are
                    separate from failures.
                  </p>
                </section>
              </div>
              <section aria-labelledby="agent-performance">
                <h3 id="agent-performance" className="text-base font-semibold">
                  Response time and cost
                </h3>
                <dl className="mt-3 grid gap-x-8 sm:grid-cols-3">
                  <Measure
                    label="P95 request time"
                    value={`${requests.p95DurationMs.toLocaleString()} ms`}
                    note="95% of recorded attempts finished within this time"
                  />
                  <Measure
                    label="Average request time"
                    value={`${requests.averageDurationMs.toLocaleString()} ms`}
                  />
                  <Measure
                    label="Reported provider cost"
                    value={<Cost requests={requests} />}
                    note="Only requests with complete provider cost"
                  />
                </dl>
                <div className="grid gap-x-10 sm:grid-cols-2">
                  <Progress
                    label="First text recorded"
                    value={requests.firstTextCount30Days}
                    total={requests.attempts30Days}
                    description={
                      requests.firstTextCount30Days
                        ? `Average first text: ${requests.averageFirstTextMs.toLocaleString()} ms`
                        : "No answers started"
                    }
                  />
                  <Progress
                    label="Cost coverage"
                    value={requests.costReported30Days}
                    total={requests.attempts30Days}
                    description="Missing provider cost is unknown, not free"
                  />
                </div>
              </section>
            </>
          ) : !requests ? (
            <p
              role="status"
              className="border-y border-line py-5 text-sm text-warning"
            >
              Answer metrics are unavailable. Check the Agent metrics migration
              and database connection.
            </p>
          ) : (
            <p className="border-y border-line py-5 text-sm text-muted">
              No provider attempts recorded in the last 30 days. Latency, errors
              and cost have no sample yet.
            </p>
          )}
          <section
            aria-labelledby="agent-feedback"
            className="border-t border-line pt-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="agent-feedback" className="text-base font-semibold">
                Player feedback
              </h3>
              <Link
                href="/admin/feedback"
                className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Review feedback
              </Link>
            </div>
            {ratings === null ? (
              <p className="mt-3 text-sm text-warning">
                Reply ratings are unavailable.
              </p>
            ) : ratings ? (
              <div className="mt-3 max-w-xl">
                <Progress
                  label="Good ratings"
                  value={metrics.goodRatings30Days ?? 0}
                  total={ratings}
                  description={`${metrics.badRatings30Days} needs work · voluntary ratings in 30 days`}
                  tone="success"
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No replies were rated in the last 30 days.
              </p>
            )}
            <p className="mt-2 text-sm text-muted">
              {metrics.openReports ?? "Unavailable"} open answer reports ·{" "}
              {metrics.reports30Days ?? "Unavailable"} submitted in 30 days
            </p>
            <p className="mt-3 max-w-3xl text-xs leading-5 text-muted">
              Ratings reflect replies last rated in this period and may not
              represent all answers. Admin review does not change the rating
              date. Reports require investigation before they are classified as
              model errors. Charged includes answers later interrupted; released
              before text: {metrics.released30Days} in 30 days (
              {metrics.released7Days} in 7 days). In-progress reservations:{" "}
              {metrics.reserved30Days}. Rejections before generation are
              excluded.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
