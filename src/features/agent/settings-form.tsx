"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ActionNotice } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { Switch } from "@/components/ui/switch";
import type { AdminActionState } from "@/features/admin/actions";
import { saveAgentSettings } from "./actions";
import type { AgentConfig } from "./validation";

export function AgentSettingsForm({
  config,
  hasKey,
  storageReady,
  models,
}: {
  models: { id: string; name: string }[];
  config: AgentConfig;
  hasKey: boolean;
  storageReady: boolean;
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    saveAgentSettings,
    {}
  );
  const [replacingKey, setReplacingKey] = useState(!hasKey);
  const [draft, setDraft] = useState(config);
  const keyInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!pending && state.success) {
      if (keyInput.current) keyInput.current.value = "";
      setReplacingKey(!hasKey);
    }
  }, [pending, state, hasKey]);
  return (
    <form noValidate action={action} className="w-full space-y-7">
      <fieldset disabled={pending} className="space-y-7">
        <section className="space-y-4" aria-labelledby="agent-provider-heading">
          <h2 id="agent-provider-heading" className="text-lg font-semibold">
            OpenRouter
          </h2>
          {!storageReady ? (
            <p role="status" className="text-sm text-warning">
              Server encryption is not configured. Add AGENT_ENCRYPTION_KEY
              before storing a credential.
            </p>
          ) : null}
          <input
            type="hidden"
            name="keepKey"
            value={replacingKey ? "" : "on"}
          />
          {hasKey ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted">API key stored securely</span>
              <Button
                type="button"
                variant="quiet"
                onClick={() => setReplacingKey(!replacingKey)}
              >
                {replacingKey ? "Keep stored key" : "Replace API key"}
              </Button>
            </div>
          ) : null}
          {replacingKey ? (
            <div>
              <label htmlFor="agent-key" className="text-sm font-semibold">
                API key
              </label>
              <input
                ref={keyInput}
                id="agent-key"
                name="apiKey"
                type="password"
                autoComplete="new-password"
                maxLength={256}
                className="field"
                placeholder={
                  hasKey ? "Key stored · enter a new key to replace" : "sk-or-…"
                }
                aria-describedby="agent-key-hint"
              />
              <p
                id="agent-key-hint"
                className="mt-2 text-xs leading-5 text-muted"
              >
                Encrypted on the server. The saved key is never returned to this
                page. Leave blank to keep it.
              </p>
            </div>
          ) : null}
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input name="removeKey" type="checkbox" />
            Remove stored API key
          </label>
          <div>
            <label htmlFor="agent-model" className="text-sm font-semibold">
              Model ID
            </label>
            <input
              id="agent-model"
              list="agent-models"
              name="model"
              value={draft.model}
              onChange={(event) =>
                setDraft({ ...draft, model: event.target.value })
              }
              maxLength={150}
              placeholder="provider/model-name"
              className="field"
            />
            <datalist id="agent-models">
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </datalist>
            <p className="mt-2 text-xs leading-5 text-muted">
              Suggestions follow the saved privacy mode. Save privacy changes to
              refresh suggestions, then test the connection. Availability and
              limits depend on your OpenRouter account.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <input
              type="hidden"
              name="privacyMode"
              value={draft.requireZeroRetention ? "strict" : "provider"}
            />
            <label
              htmlFor="agent-privacy"
              className="flex min-h-9 items-center gap-3 text-sm font-semibold"
            >
              <Switch
                id="agent-privacy"
                checked={draft.requireZeroRetention}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    requireZeroRetention: event.target.checked,
                  })
                }
              />
              Require zero data retention
            </label>
            <p className="mt-2 text-sm leading-6 text-muted">
              Recommended. Route only to providers that do not retain prompts or
              use them for training.
            </p>
            {!draft.requireZeroRetention ? (
              <p className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm leading-6">
                Provider policy mode: OpenRouter and the selected provider may
                retain or use messages and authorized game data under their own
                policies. Free models may require this mode. Secrets remain
                protected and tools stay read-only. Save this choice, then test
                the connection.
              </p>
            ) : null}
          </div>
        </section>
        <section
          className="space-y-4 border-t border-line pt-6"
          aria-labelledby="agent-behavior-heading"
        >
          <h2 id="agent-behavior-heading" className="text-lg font-semibold">
            Behavior and access
          </h2>
          {[
            { name: "enabled", label: "Enable Agent", value: draft.enabled },
            {
              name: "allowGameData",
              label: "Allow authorized games, rosters and groups",
              value: draft.allowGameData,
            },
            {
              name: "allowCourtSearch",
              label: "Allow Court Finder answers",
              value: draft.allowCourtSearch,
            },
            {
              name: "allowHelp",
              label: "Allow Help Center answers",
              value: draft.allowHelp,
            },
          ].map((item) => (
            <label
              key={item.name}
              htmlFor={`agent-${item.name}`}
              className="flex min-h-9 items-center gap-2 text-sm"
            >
              <Switch
                id={`agent-${item.name}`}
                name={item.name}
                checked={item.value}
                onChange={(event) =>
                  setDraft({ ...draft, [item.name]: event.target.checked })
                }
              />
              {item.label}
            </label>
          ))}
          <p className="text-sm leading-6 text-muted">
            Read-only access, authorization, privacy routing and tool limits are
            always enforced. These settings cannot enable actions.
          </p>
          <div>
            <label
              htmlFor="agent-instructions"
              className="text-sm font-semibold"
            >
              Custom instructions
            </label>
            <textarea
              id="agent-instructions"
              name="instructions"
              value={draft.instructions}
              onChange={(event) =>
                setDraft({ ...draft, instructions: event.target.value })
              }
              maxLength={4000}
              rows={5}
              className="field h-auto min-h-32"
              placeholder="For example: Keep answers brief and use a friendly tone."
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              Sent to the model as behavior guidance. Never include secrets,
              credentials or confidential internal information. Core security
              instructions cannot be overridden.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="agent-tokens" className="text-sm font-semibold">
                Output tokens per step
              </label>
              <input
                id="agent-tokens"
                name="maxOutputTokens"
                type="number"
                min={256}
                max={4000}
                value={draft.maxOutputTokens}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    maxOutputTokens: Number(event.target.value),
                  })
                }
                className="field"
                required
              />
            </div>
            <div>
              <label htmlFor="agent-limit" className="text-sm font-semibold">
                Requests per user per hour
              </label>
              <input
                id="agent-limit"
                name="requestsPerHour"
                type="number"
                min={1}
                max={120}
                value={draft.requestsPerHour}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    requestsPerHour: Number(event.target.value),
                  })
                }
                className="field"
                required
              />
            </div>
          </div>
        </section>
        <section
          className="space-y-4 border-t border-line pt-6"
          aria-labelledby="agent-allowances-heading"
        >
          <h2 id="agent-allowances-heading" className="text-lg font-semibold">
            Monthly message allowances
          </h2>
          <p className="text-sm leading-6 text-muted">
            One question counts as one message when its answer starts. Tool
            calls do not count separately. Changes apply immediately to current
            members and public pricing, without resetting usage. Set 0 to
            disable a tier's allowance.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["freeMessages", "plusMessages", "proMessages"] as const).map(
              (name, index) => (
                <div key={name}>
                  <label htmlFor={name} className="text-sm font-semibold">
                    {["Free", "Plus", "Pro"][index]}
                  </label>
                  <input
                    id={name}
                    name={name}
                    type="number"
                    min={0}
                    max={100000}
                    required
                    className="field"
                    value={draft[name]}
                    onChange={(event) =>
                      setDraft({ ...draft, [name]: Number(event.target.value) })
                    }
                  />
                </div>
              )
            )}
          </div>
          <p className="text-xs leading-5 text-muted">
            Free resets on the 1st in Philippine time. Paid members follow their
            current billing term; assigned plans without a paid term follow the
            calendar month. Unused messages do not roll over. Unlimited hosting
            uses Pro's Agent allowance.
          </p>
        </section>
        <PendingSubmit
          pendingLabel="Saving…"
          className="pressable min-h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-white"
        >
          Save Agent settings
        </PendingSubmit>
      </fieldset>
      {state.error ? (
        <ActionNotice message={state.error} response={state} />
      ) : null}
      {state.success ? (
        <ActionNotice
          message={state.success}
          response={state}
          variant="success"
        />
      ) : null}
    </form>
  );
}
