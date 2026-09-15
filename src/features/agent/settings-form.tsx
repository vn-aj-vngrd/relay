"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { PendingSubmit } from "@/components/ui/pending-submit";
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
  const [draft, setDraft] = useState(config);
  const keyInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!pending && keyInput.current) keyInput.current.value = "";
  }, [pending]);
  return (
    <form noValidate action={action} className="max-w-2xl space-y-7">
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
              Choose an OpenRouter model with streaming, tool calling and a
              zero-data-retention provider. Availability depends on your
              account.
            </p>
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
              name: "allowHelp",
              label: "Allow Help Center answers",
              value: draft.allowHelp,
            },
          ].map((item) => (
            <label
              key={item.name}
              className="flex min-h-9 items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
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
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
