"use client";

import { ArrowUp, Plus, Stop } from "@phosphor-icons/react";
import { type RefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { AgentUsageSummary } from "./allowance";
import type { AgentCapabilities } from "./capabilities";
import composerStyles from "./composer.module.css";
import {
  AgentComposerEditor,
  type AgentComposerHandle,
} from "./composer-editor";
import type { CreationFlow } from "./creation-model";
import { AgentUsageIndicator } from "./usage-indicator";

export function AgentComposer({
  field,
  input,
  onChange,
  onSubmit,
  onCreate,
  onStop,
  available,
  busy,
  responding,
  capabilities,
  usage,
}: {
  field: RefObject<AgentComposerHandle | null>;
  input: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCreate?: (flow: CreationFlow) => void;
  onStop: () => void;
  available: boolean;
  busy: boolean;
  responding: boolean;
  capabilities?: AgentCapabilities;
  usage?: AgentUsageSummary | null;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
      className={composerStyles.composer}
    >
      <AgentComposerEditor
        ref={field}
        capabilities={capabilities}
        onCreate={onCreate}
        onActionsOpenChange={setActionsOpen}
        value={input}
        onChange={onChange}
        onSubmit={onSubmit}
        disabled={!available || busy}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Actions"
          aria-expanded={actionsOpen}
          aria-haspopup="listbox"
          disabled={!available || busy}
          onClick={() => field.current?.openActions()}
          className={`compact-control pressable flex size-9 items-center justify-center rounded-full transition-colors motion-reduce:transition-none hover:bg-surface-strong hover:text-ink disabled:opacity-45 ${actionsOpen ? "bg-surface-strong text-ink" : "text-muted"}`}
        >
          <Plus size={20} aria-hidden />
          <Tooltip content="Actions" side="top" />
        </button>
        <div className="flex items-center gap-1">
          {usage ? <AgentUsageIndicator usage={usage} /> : null}
          {responding ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className={composerStyles.submit}
              aria-label="Stop response"
              onClick={onStop}
            >
              <Stop size={14} weight="fill" aria-hidden />
              <Tooltip content="Stop response" side="top" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={composerStyles.submit}
              aria-label="Send message"
              disabled={!available || busy || !input.trim()}
            >
              <ArrowUp size={18} aria-hidden />
              <Tooltip content="Send message" side="top" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
