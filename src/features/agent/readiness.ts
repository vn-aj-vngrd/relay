import "server-only";
import { agentCredentialStorageReady, decryptAgentKey } from "./credentials";
import type { AgentConfig } from "./validation";

export function agentReadiness(
  config: AgentConfig,
  encryptedApiKey: string | null
) {
  const storageReady = agentCredentialStorageReady();
  let credentialReady = false;
  if (storageReady && encryptedApiKey) {
    try {
      credentialReady = Boolean(decryptAgentKey(encryptedApiKey));
    } catch {
      /* Never expose ciphertext or crypto errors. */
    }
  }
  const checks = [
    {
      label: "Agent enabled",
      ready: config.enabled,
      hint: "Turn on Enable Agent below.",
    },
    {
      label: "Server credential storage",
      ready: storageReady,
      hint: "Configure the encryption key for this deployment.",
    },
    {
      label: "Stored API key readable",
      ready: credentialReady,
      hint: encryptedApiKey
        ? "Replace the stored API key after checking server encryption configuration."
        : "Add your OpenRouter API key.",
    },
    {
      label: "Model selected",
      ready: Boolean(config.model),
      hint: "Choose an OpenRouter model.",
    },
    {
      label: "Read-only capabilities",
      ready:
        config.allowGameData || config.allowHelp || config.allowCourtSearch,
      hint: "Enable games, Court Finder or Help Center answers.",
    },
  ];
  return { ready: checks.every((check) => check.ready), checks, storageReady };
}
