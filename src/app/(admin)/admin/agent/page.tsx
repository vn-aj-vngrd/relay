export const metadata = { title: "Agent · Admin" };

import Link from "next/link";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { getAgentAdminMetrics } from "@/features/agent/admin-metrics";
import { AgentAdminOverview } from "@/features/agent/admin-overview";
import { readAgentSettings } from "@/features/agent/config";
import { getAgentModels } from "@/features/agent/models";
import { agentReadiness } from "@/features/agent/readiness";
import { AgentSettingsForm } from "@/features/agent/settings-form";
import { getAgentUsage } from "@/features/agent/usage";

export default async function AdminAgentPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
} = {}) {
  const admin = await requireAdmin();
  const { tab } = await searchParams;
  const activeTab = tab === "settings" ? "settings" : "overview";
  const { config, encryptedApiKey } = await readAgentSettings();
  const readiness = agentReadiness(config, encryptedApiKey);
  const models = await getAgentModels(config.requireZeroRetention);

  let overview: React.ReactNode = null;
  if (activeTab === "overview") {
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
              ? "This model has no listed zero-retention tool endpoint. Choose a suggested model, or explicitly change the privacy mode in Settings."
              : "This model has no listed tool support. Choose a suggested model in Settings, save and test.",
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
    overview = <AgentAdminOverview checks={checks} metrics={metrics} />;
  }

  return (
    <div className="w-full [&>header]:mb-5">
      <AdminPageHeading
        title="Agent"
        description="Monitor answer health and usage, then manage Agent settings. Changes are audited."
      />
      <nav
        aria-label="Agent sections"
        className="focus-scroll-rail public-session-scroll overflow-x-auto border-b border-line"
      >
        <div className="flex min-w-max gap-5">
          {[
            { label: "Overview", href: "/admin/agent", value: "overview" },
            {
              label: "Settings",
              href: "/admin/agent?tab=settings",
              value: "settings",
            },
          ].map((item) => (
            <Link
              key={item.value}
              href={item.href}
              aria-current={activeTab === item.value ? "page" : undefined}
              className={`tab-chip relative inline-flex min-h-11 items-center px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeTab === item.value ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="pt-8">
        {activeTab === "overview" ? (
          overview
        ) : (
          <div>
            {!config.requireZeroRetention ? (
              <p className="mb-6 text-sm leading-6 text-warning">
                Provider policy mode is active. The selected provider may retain
                or use messages and authorized game data.
              </p>
            ) : null}
            <AgentSettingsForm
              models={models}
              config={config}
              hasKey={Boolean(encryptedApiKey)}
              storageReady={readiness.storageReady}
            />
          </div>
        )}
      </div>
    </div>
  );
}
