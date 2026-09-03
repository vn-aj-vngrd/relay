import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminInsights } from "@/features/admin/queries";
import { sessionFunnelStages } from "@/features/analytics/insights";
import { discoverySourceLabel, discoverySourceValues } from "@/features/onboarding/discovery-source";

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function InsightBar({ value, total }: { value: number; total: number }) {
  const percent = percentage(value, total);
  return (
    <div className="flex items-center justify-end gap-3">
      <span className="score text-sm font-semibold">{percent}%</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-strong" aria-hidden>
        <span className="block h-full bg-primary" style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
}

export default async function AdminInsightsPage() {
  const data = await getAdminInsights();
  const discoveryRows = [
    ...discoverySourceValues.map((source) => ({
      key: source,
      label: discoverySourceLabel(source),
      total: data.discovery.get(source) ?? 0,
    })),
    { key: "unanswered", label: "Not answered", total: data.unansweredDiscovery },
  ];
  const retentionRows = [
    ["Second game within 14 days", data.hostRetention.fourteenDay],
    ["Second game within 30 days", data.hostRetention.thirtyDay],
  ] as const;

  return (
    <div>
      <AdminPageHeading
        title="Insights"
        description="Aggregate acquisition, onboarding, and core product-loop signals. No chat, payment, or score content."
      />

      <nav aria-label="Insight topics" className="public-session-scroll overflow-x-auto border-b border-line">
        <div className="flex min-w-max gap-5">
          {[
            ["Acquisition", "#acquisition"],
            ["Activation", "#activation"],
            ["Game funnel", "#core-loop"],
            ["Retention", "#retention"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="min-h-10 py-2 text-sm font-semibold text-primary">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section id="acquisition" aria-labelledby="acquisition-title" className="scroll-mt-6 py-9">
        <h2 id="acquisition-title" className="text-lg font-bold">
          Acquisition
        </h2>
        <p className="mt-1 text-sm text-muted">How players say they first discovered Relay.</p>
        <div className="mt-4 overflow-x-auto border-y border-line">
          <table className="w-full min-w-[440px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-3 font-medium">Source</th>
                <th className="py-3 text-right font-medium">Players</th>
                <th className="py-3 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {discoveryRows.map((row) => (
                <tr key={row.key}>
                  <td className="py-3 font-medium">{row.label}</td>
                  <td className="score py-3 text-right">{row.total}</td>
                  <td className="py-3">
                    <InsightBar value={row.total} total={data.profileCount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="activation" aria-labelledby="activation-title" className="scroll-mt-6 border-t border-line py-9">
        <h2 id="activation-title" className="text-lg font-bold">
          Activation
        </h2>
        <p className="mt-1 text-sm text-muted">Current profile setup and tour completion across registered players.</p>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {[
            ["Profiles", data.profileCount],
            ["Setup completed or skipped", data.onboardingCount],
            ["Core tour completed or skipped", data.tourCount],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
              <dt className="text-sm font-medium">{label}</dt>
              <dd>
                <div className="flex items-center gap-4">
                  <span className="score text-sm text-muted">{value}</span>
                  <InsightBar value={Number(value)} total={data.profileCount} />
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="core-loop" aria-labelledby="core-loop-title" className="scroll-mt-6 border-t border-line py-9">
        <h2 id="core-loop-title" className="text-lg font-bold">
          Game funnel · 30 days
        </h2>
        <p className="mt-1 text-sm text-muted">
          Published games that reached each milestone. Every percentage uses published games as the cohort.
        </p>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {sessionFunnelStages.map((stage) => (
            <div key={stage.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
              <dt className="text-sm font-medium">{stage.label}</dt>
              <dd className="flex items-center gap-4">
                <span className="score text-sm text-muted">{data.funnel[stage.key]}</span>
                <InsightBar value={data.funnel[stage.key]} total={data.funnel.published} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="retention" aria-labelledby="retention-title" className="scroll-mt-6 border-t border-line py-9">
        <h2 id="retention-title" className="text-lg font-bold">
          Host retention
        </h2>
        <p className="mt-1 text-sm text-muted">
          Hosts who published another game after their first. Only hosts with a fully elapsed window are eligible.
        </p>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {retentionRows.map(([label, retention]) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
              <dt className="text-sm font-medium">
                {label}
                <span className="mt-1 block text-xs font-normal text-muted">
                  {retention.retainedHosts} of {retention.eligibleHosts} eligible hosts
                </span>
              </dt>
              <dd className="score text-lg font-bold">{retention.rate}%</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
