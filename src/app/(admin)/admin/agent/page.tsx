import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { readAgentSettings } from "@/features/agent/config";
import { agentCredentialStorageReady } from "@/features/agent/credentials";
import { getAgentModels } from "@/features/agent/models";
import { AgentSettingsForm } from "@/features/agent/settings-form";

export default async function AdminAgentPage() {
  await requireAdmin();
  const [{ config, encryptedApiKey }, models] = await Promise.all([
    readAgentSettings(),
    getAgentModels(),
  ]);
  return (
    <div>
      <AdminPageHeading
        title="Agent"
        description="Configure Relay's read-only assistant. Changes are audited."
      />
      <AgentSettingsForm
        models={models}
        config={config}
        hasKey={Boolean(encryptedApiKey)}
        storageReady={agentCredentialStorageReady()}
      />
    </div>
  );
}
