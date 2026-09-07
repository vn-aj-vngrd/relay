import { SubmitButton } from "@/components/ui/submit-button";
import type { playerPayments } from "@/db/schema";
import { togglePaymentExcluded } from "./actions";
import { hasPaymentHistory } from "./domain";
import { PaymentAmountForm } from "./payment-management-forms";

export function PaymentShareControls({
  payment,
  name,
}: {
  payment: typeof playerPayments.$inferSelect;
  name: string;
}) {
  if (hasPaymentHistory(payment) || payment.pendingAdjustment) return null;
  return (
    <details className="mt-2">
      <summary className="min-h-9 cursor-pointer py-2 text-sm font-medium text-primary">
        Adjust amount<span className="sr-only"> for {name}</span>
      </summary>
      <div className="flex flex-col items-start gap-3 pt-2">
        {payment.status !== "excluded" ? (
          <PaymentAmountForm
            paymentId={payment.id}
            name={name}
            amount={payment.amountCents / 100}
          />
        ) : null}
        <form noValidate action={togglePaymentExcluded}>
          <input type="hidden" name="paymentId" value={payment.id} />
          <SubmitButton variant="secondary" pendingLabel="Updating…">
            {payment.status === "excluded"
              ? "Include player"
              : "Exclude player"}
          </SubmitButton>
        </form>
      </div>
    </details>
  );
}
