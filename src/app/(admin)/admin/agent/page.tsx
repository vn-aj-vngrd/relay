export const metadata = { title: "Agent settings · Admin" };

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
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
