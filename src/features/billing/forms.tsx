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
  saveBillingSettings,
  submitSubscriptionPayment,
} from "./actions";
import { type BillingState, billingProviders, MiB, plans } from "./domain";
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
        Accept new Pro upgrade and renewal requests. Existing requests remain
        reviewable when paused.
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
}: {
  methods: { id: string; provider: string; recipient: string }[];
  renewing: boolean;
}) {
  return (
    <BillingForm
      action={createUpgradeRequest}
      submit={`${renewing ? "Renew" : "Upgrade to"} Pro — ₱${plans.pro.priceCents / 100}`}
      pendingLabel="Preparing payment…"
    >
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
        One calendar month of personal Pro access after approval. Manual
        renewal; no automatic charge. Review the QR, account details and
        policies before paying.
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
}: {
  userId: string;
  override?: {
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
      <p className="text-sm leading-6 text-muted">
        Leave an allowance blank to inherit the plan. Zero blocks new usage.
        Existing games remain accessible. Overrides do not disable security
        safeguards.
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
  return (
    <BillingForm action={grantComplimentaryPro} submit="Grant one month of Pro">
      <input type="hidden" name="userId" value={userId} />
      <ReasonField />
      <CheckField name="confirm">
        Grant one complimentary calendar month, starting now. No payment will be
        recorded or charged.
      </CheckField>
    </BillingForm>
  );
}
