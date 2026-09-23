import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function AgentResponseError({
  message,
  disabled,
  onRetry,
  stopped = false,
}: {
  message: string;
  disabled: boolean;
  onRetry?: () => Promise<void>;
  stopped?: boolean;
}) {
  return (
    <div className="mt-3 space-y-3">
      <p
        role={stopped ? "status" : "alert"}
        className="flex items-start gap-2 text-sm leading-6 text-muted"
      >
        {!stopped ? (
          <WarningCircle
            size={18}
            aria-hidden
            className="mt-0.5 shrink-0 text-danger"
          />
        ) : null}
        <span>{message}</span>
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="secondary"
          className="rounded-full font-medium"
          disabled={disabled}
          onClick={() => void onRetry()}
        >
          <ArrowClockwise size={14} aria-hidden />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
