"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function PaymentDetailsCopy({ details }: { details: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      {state === "error" ? (
        <Alert>
          Couldn’t copy the details. Select and copy the account information
          above.
        </Alert>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(details);
            setState("copied");
          } catch {
            setState("error");
          }
        }}
      >
        Copy payment details
      </Button>
      {state === "copied" ? (
        <p role="status" className="text-sm text-muted">
          Payment details copied.
        </p>
      ) : null}
    </div>
  );
}
