"use client";

import { type ReactNode, useActionState, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-time-picker";
import { ImageFileField } from "@/components/ui/image-file-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import {
  cancelUpgradeRequest,
  createUpgradeRequest,
  grantComplimentaryPro,
  reviewSubscriptionPayment,
  saveAccountOverrides,
  saveBillingMethod,
  saveBillingPlan,
  saveBillingSettings,
  submitSubscriptionPayment,
} from "./actions";
import {
  type BillingPlan,
  type BillingState,
  billingProviders,
  defaultBillingPlans,
  MiB,
  type PlanId,
} from "./domain";
import {
  cleanupStalledUpload,
  removeHostedPhoto,
  setParticipantImages,
} from "./media-actions";

function BillingForm({
  action,
  children,
  submit,
  pendingLabel = "Saving…",
}: {
  action: (state: BillingState, data: FormData) => Promise<BillingState>;
  children: ReactNode;
  submit: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const preserve = usePreserveFormValuesOnError(state);
  return (
    <form
      action={formAction}
      noValidate
      onSubmitCapture={preserve}
      className="flex max-w-2xl flex-col gap-5"
    >
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      {children}
      <SubmitButton
        type="submit"
        pendingLabel={pendingLabel}
        className="self-start"
      >
        {submit}
      </SubmitButton>
    </form>
  );
}

function TextField({
  name,
  label,
  value = "",
  maxLength = 120,
  multiline = false,
  required = true,
  type = "text",
}: {
  name: string;
  label: string;
  value?: string;
  maxLength?: number;
  multiline?: boolean;
  required?: boolean;
  type?: "text" | "number";
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          defaultValue={value}
          maxLength={maxLength}
          required={required}
          rows={4}
          className="field"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? 1 : undefined}
          defaultValue={value}
          maxLength={maxLength}
          required={required}
          className="field"
        />
      )}
    </div>
  );
}
function CheckField({
  name,
  children,
  checked = false,
}: {
  name: string;
  children: ReactNode;
  checked?: boolean;
}) {
  return (
    <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
      <input
        name={name}
        type="checkbox"
        defaultChecked={checked}
        className="mt-1 size-4 shrink-0 accent-primary"
      />
      <span>{children}</span>
    </label>
  );
}
function ReasonField() {
  return (
    <TextField
      name="reason"
      label="Reason for this change"
      maxLength={600}
      multiline
    />
  );
}

export function BillingPlanForm({ plan }: { plan: BillingPlan }) {
  if (plan.id === "unlimited")
    return (
      <p className="max-w-2xl text-sm leading-6 text-muted">
        Admin-only access with no game-creation or retained-photo-storage quota.
        Always hidden from public pricing and never purchasable. Assign it from
        any account’s Plan & allowances page, with an optional expiry.
        File-size, daily-upload and abuse safeguards still apply.
      </p>
    );
  return (
    <BillingForm
      action={saveBillingPlan}
      submit={`Publish ${plan.name} changes`}
    >
      <input type="hidden" name="id" value={plan.id} />
      <input type="hidden" name="version" value={plan.version} />
      <TextField
        name="price"
        label="Price per month (PHP)"
        value={String(plan.priceCents / 100)}
      />
      <TextField
        name="games"
        label="Games per month"
        value={String(plan.games)}
        type="number"
      />
      <TextField
        name="storageMiB"
        label="Total photo storage (MiB, not monthly)"
        value={String(plan.storageBytes / MiB)}
        type="number"
      />
      <SelectField
        id={`${plan.id}-availability`}
        name="availability"
        label="Availability"
        defaultValue={plan.availability}
        options={
          plan.id === "free"
            ? [{ value: "active", label: "Available now" }]
            : [
                {
                  value: "coming_soon",
                  label: "Coming soon — visible, no purchases",
                },
                { value: "active", label: "Active — allow purchases" },
                { value: "paused", label: "Paused — stop new purchases" },
              ]
        }
      />
      <p className="text-sm leading-6 text-muted">
        1,024 MiB = 1 GiB. Zero blocks new usage. Existing purchases retain
        their agreed price and allowances. Free-plan changes apply immediately,
        without deleting content or resetting usage. Technical player/court
        limits and upload safeguards are not billing settings.
      </p>
      <CheckField name="visible" checked={plan.visible}>
        Show this plan on public pricing and allow public purchase when Active.
        Hidden plans remain assignable by admins; existing purchases are
        preserved.
      </CheckField>
      <ReasonField />
      <CheckField name="confirm">
        I reviewed the monthly price, monthly games, total storage and
        availability above. Publish these values to pricing and new purchases.
      </CheckField>
    </BillingForm>
  );
}

export function BillingSettingsForm({
  settings,
}: {
  settings?: {
    acceptingPayments: boolean;
    supportContact: string;
    reviewTime: string;
    policy: string;
  } | null;
}) {
  return (
    <BillingForm action={saveBillingSettings} submit="Save billing settings">
      <TextField
        name="supportContact"
        label="Billing support contact"
        value={settings?.supportContact}
        maxLength={240}
      />
      <TextField
        name="reviewTime"
        label="Expected verification time"
        value={settings?.reviewTime}
        maxLength={240}
      />
      <TextField
        name="policy"
        label="Refund, dispute and media-retention policy"
        value={settings?.policy}
        maxLength={4000}
        multiline
      />
      <CheckField
        name="acceptingPayments"
        checked={settings?.acceptingPayments}
      >
        Enable paid-plan purchases. Each plan must also be Active in Plans &
        pricing. Existing requests remain reviewable when purchases are paused.
      </CheckField>
      <ReasonField />
      <CheckField name="confirm">
        I confirm these instructions and policies are ready to publish.
      </CheckField>
    </BillingForm>
  );
}

export function BillingMethodForm({
  method,
}: {
  method?: {
    id: string;
    provider: string;
    recipient: string;
    account: string;
    instructions: string;
    enabled: boolean;
    qrPath: string | null;
  };
}) {
  const id = useId();
  return (
    <BillingForm
      action={saveBillingMethod}
      submit={method ? "Save payment method" : "Add payment method"}
    >
      <input type="hidden" name="id" value={method?.id ?? ""} />
      <SelectField
        id={`${id}-provider`}
        name="provider"
        label="Payment provider"
        defaultValue={method?.provider ?? "GCash"}
        options={billingProviders.map((provider) => ({
          value: provider,
          label: provider,
        }))}
      />
      <p className="text-xs text-muted">
        For bank transfer or another provider, name the institution in the
        payment instructions. Stable provider categories prevent the same
        transaction being credited under a renamed method.
      </p>
      <TextField
        name="recipient"
        label="Recipient / account name"
        value={method?.recipient}
      />
      <TextField
        name="account"
        label="Account number / mobile number"
        value={method?.account}
      />
      <TextField
        name="instructions"
        label="Payment instructions"
        value={method?.instructions}
        maxLength={1200}
        multiline
      />
      <ImageFileField
        id={`${id}-qr`}
        name="qr"
        label={
          method?.qrPath
            ? "Replace payment QR (optional)"
            : "Payment QR (optional)"
        }
        hint="JPG, PNG or WebP, up to 5 MiB. Confirm this QR belongs to the recipient above."
        buttonLabel="Choose payment QR"
      />
      {method?.qrPath ? (
        <CheckField name="removeQr">
          Remove the QR from new requests. Existing requests retain their
          original QR.
        </CheckField>
      ) : null}
      <CheckField name="enabled" checked={method?.enabled}>
        Enable this payment method.
      </CheckField>
      <ReasonField />
      <CheckField name="confirm">
        I have checked the recipient, account number and QR destination.
      </CheckField>
    </BillingForm>
  );
}

export function UpgradeForm({
  methods,
  renewing,
  catalog = defaultBillingPlans,
}: {
  methods: { id: string; provider: string; recipient: string }[];
  renewing: boolean;
  catalog?: BillingPlan[];
}) {
  const available = catalog.filter(
    (plan) =>
      (plan.id === "plus" || plan.id === "pro") &&
      plan.visible &&
      plan.availability === "active"
  );
  const [selected, setSelected] = useState(available[0]?.id ?? "pro");
  const plan = available.find((entry) => entry.id === selected) ?? available[0];
  if (!plan)
    return (
      <Alert variant="info">
        Paid plans are coming soon or paused. Your current access is unchanged.
      </Alert>
    );
  return (
    <BillingForm
      action={createUpgradeRequest}
      submit={`Request ${plan.name} — ₱${plan.priceCents / 100} for one month`}
      pendingLabel="Preparing payment…"
    >
      <input type="hidden" name="planVersion" value={plan.version} />
      <SelectField
        id="subscription-plan"
        name="planId"
        label="Monthly plan"
        value={plan.id}
        onValueChange={(value) => setSelected(value as "plus" | "pro")}
        options={available.map((entry) => ({
          value: entry.id,
          label: `${entry.name} · ₱${entry.priceCents / 100}/month · ${entry.games} games per month`,
        }))}
      />
      <SelectField
        id="subscription-method"
        name="methodId"
        label="Payment method"
        defaultValue={methods[0]?.id}
        options={methods.map((method) => ({
          value: method.id,
          label: `${method.provider} · ${method.recipient}`,
        }))}
      />
      <p className="text-sm leading-6 text-muted">
        {plan.games} games for one calendar month of {plan.name} access.{" "}
        {renewing
          ? "The selected plan starts after your current paid-through date; there is no mid-term proration."
          : "Access starts after approval; games already created this calendar month count toward your first term."}{" "}
        Manual renewal; no automatic charge. Review the exact price, QR, account
        details and policies before paying.
      </p>
    </BillingForm>
  );
}

export function SubscriptionPaymentForm({
  id,
  reference,
}: {
  id: string;
  reference: string | null;
}) {
  return (
    <BillingForm
      action={submitSubscriptionPayment}
      submit="Submit payment for verification"
      pendingLabel="Submitting payment…"
    >
      <input type="hidden" name="id" value={id} />
      <TextField
        name="transactionReference"
        label="Payment provider’s transaction reference"
        value={reference ?? ""}
      />
      <ImageFileField
        id="subscription-proof"
        name="proof"
        label="Payment screenshot (optional)"
        hint="Up to 5 MiB. Only you and authorized platform admins can view it. A screenshot alone does not confirm payment."
      />
    </BillingForm>
  );
}
export function CancelUpgradeForm({ id }: { id: string }) {
  return (
    <BillingForm action={cancelUpgradeRequest} submit="Cancel unpaid request">
      <input type="hidden" name="id" value={id} />
      <CheckField name="confirm">
        I have not sent payment. If you already paid, submit the transaction
        reference or contact support instead.
      </CheckField>
    </BillingForm>
  );
}

export function PaymentReviewForm({ id }: { id: string }) {
  return (
    <BillingForm
      action={reviewSubscriptionPayment}
      submit="Save payment review"
    >
      <input type="hidden" name="id" value={id} />
      <SelectField
        id="billing-decision"
        name="decision"
        label="Review decision"
        defaultValue="clarification"
        options={[
          { value: "clarification", label: "Request clarification" },
          { value: "approved", label: "Approve received payment" },
          { value: "rejected", label: "Reject request" },
        ]}
      />
      <TextField
        name="verifiedReference"
        label="Actual received transaction reference (required for approval)"
        required={false}
      />
      <CheckField name="verified">
        I verified the recipient, payer, amount and transaction in the actual
        receiving account—not only the screenshot.
      </CheckField>
      <TextField
        name="reason"
        label="Review note (visible to the account holder)"
        maxLength={600}
        multiline
      />
    </BillingForm>
  );
}

export function AccountOverrideForm({
  userId,
  override,
  catalog = defaultBillingPlans,
}: {
  userId: string;
  catalog?: BillingPlan[];
  override?: {
    planId?: PlanId | null;
    games: number | null;
    storageBytes: number | null;
    expiresAt: string | null;
  } | null;
}) {
  const [expiry, setExpiry] = useState(
    override?.expiresAt
      ? new Date(new Date(override.expiresAt).getTime() + 8 * 3600_000)
          .toISOString()
          .slice(0, 10)
      : ""
  );
  return (
    <BillingForm action={saveAccountOverrides} submit="Save account allowances">
      <input type="hidden" name="userId" value={userId} />
      <SelectField
        id="account-plan-assignment"
        name="planId"
        label="Admin-assigned plan"
        defaultValue={override?.planId ?? ""}
        options={[
          { value: "", label: "Inherit existing subscription or Free" },
          ...catalog.map((plan) => ({
            value: plan.id,
            label: `${plan.name}${!plan.visible ? " · hidden, admin only" : ""}`,
          })),
        ]}
      />
      <p className="text-sm leading-6 text-muted">
        An assignment takes effect immediately and preserves paid terms
        underneath it. Removing it restores the current subscription or Free.
        Usage is never reset, and paid term dates keep running. New assignments
        snapshot the selected plan’s current allowances.
      </p>
      <p className="text-sm leading-6 text-muted">
        Leave an allowance blank to inherit the plan. Zero blocks new usage.
        Existing games remain accessible. For Unlimited, blank means no hosting
        quota; a number adds an explicit limit. Overrides do not disable
        security safeguards.
      </p>
      <TextField
        name="games"
        label="Games per period (blank = plan default)"
        value={override?.games?.toString()}
        type="number"
        required={false}
      />
      <TextField
        name="storageMiB"
        label="Media storage in MiB (blank = plan default)"
        value={
          override?.storageBytes == null
            ? ""
            : String(override.storageBytes / MiB)
        }
        type="number"
        required={false}
      />
      <DatePickerField
        id="override-expiry"
        name="expiresOn"
        label="Override expiry date (Philippine time; optional)"
        value={expiry}
        onValueChange={setExpiry}
      />
      <p className="text-xs text-muted">
        Expires at the end of this date. No date means the override stays until
        an admin changes it.
      </p>
      {expiry ? (
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          onClick={() => setExpiry("")}
        >
          Clear expiry
        </Button>
      ) : null}
      <ReasonField />
      <CheckField name="confirm">
        Apply this plan assignment, allowance limits and expiry now. Existing
        usage and paid history will not be reset.
      </CheckField>
    </BillingForm>
  );
}
export function StalledUploadForm({ id }: { id: string }) {
  return (
    <BillingForm
      action={cleanupStalledUpload}
      submit="Clean up incomplete upload"
    >
      <input type="hidden" name="id" value={id} />
      <ReasonField />
      <CheckField name="confirm">
        Remove the incomplete upload and release its reserved bytes. Only
        reservations older than one hour can be cleaned up.
      </CheckField>
    </BillingForm>
  );
}

export function RemoveHostedPhotoForm({ id }: { id: string }) {
  return (
    <BillingForm action={removeHostedPhoto} submit="Remove photo">
      <input type="hidden" name="id" value={id} />
      <CheckField name="confirm">
        Remove this photo for everyone in the game.
      </CheckField>
    </BillingForm>
  );
}
export function ParticipantImagesForm({
  sessionId,
  enabled,
}: {
  sessionId: string;
  enabled: boolean;
}) {
  return (
    <BillingForm action={setParticipantImages} submit="Save upload permission">
      <input type="hidden" name="sessionId" value={sessionId} />
      <CheckField name="enabled" checked={enabled}>
        Allow participants to add chat images and game photos using my storage.
      </CheckField>
    </BillingForm>
  );
}

export function ComplimentaryProForm({ userId }: { userId: string }) {
  const [expiry, setExpiry] = useState("");
  return (
    <BillingForm
      action={grantComplimentaryPro}
      submit="Grant complimentary access"
    >
      <input type="hidden" name="userId" value={userId} />
      <SelectField
        id="complimentary-plan"
        name="planId"
        label="Plan to grant"
        defaultValue="pro"
        options={[
          { value: "plus", label: "Plus" },
          { value: "pro", label: "Pro" },
        ]}
      />
      <DatePickerField
        id="grant-expiry"
        name="expiresOn"
        label="Custom expiry date (optional, Philippine time)"
        value={expiry}
        onValueChange={setExpiry}
      />
      {expiry ? (
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          onClick={() => setExpiry("")}
        >
          Use one month instead
        </Button>
      ) : null}
      <p className="text-sm leading-6 text-muted">
        Default: one calendar month. A custom date overrides the term end, not
        the allowance: the plan’s game allowance covers the whole custom term
        without intermediate resets. Existing or scheduled paid access is never
        replaced.
      </p>
      <ReasonField />
      <CheckField name="confirm">
        Grant the selected plan starting now, ending after one calendar month or
        on the custom expiry date above. No payment will be recorded or charged.
      </CheckField>
    </BillingForm>
  );
}
