import { asc, eq } from "drizzle-orm";
import Image from "next/image";

import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { billingMethods, billingSettings } from "@/db/schema";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { billingFileUrl } from "@/features/billing/files";
import {
  BillingMethodForm,
  BillingSettingsForm,
} from "@/features/billing/forms";

export default async function BillingSettingsPage() {
  await requireAdmin();
  const [settings, methods] = await Promise.all([
    db.query.billingSettings.findFirst({
      where: eq(billingSettings.id, "global"),
    }),
    db.query.billingMethods.findMany({
      orderBy: asc(billingMethods.createdAt),
    }),
  ]);
  const images = await Promise.all(
    methods.map((method) => billingFileUrl(method.qrPath))
  );
  return (
    <div>
      <AdminPageHeading
        title="Billing settings"
        description="Manage the business payment QR, recipient details and manual-review policy. Changes are audited."
        action={
          <ButtonLink href="/admin/billing" variant="secondary">
            Payment requests
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-10">
        <section aria-labelledby="billing-settings-title">
          <h2
            id="billing-settings-title"
            className="mb-4 text-lg font-semibold"
          >
            Availability and policies
          </h2>
          <BillingSettingsForm settings={settings} />
        </section>
        <section
          aria-labelledby="billing-methods-title"
          className="border-t border-line pt-6"
        >
          <h2 id="billing-methods-title" className="text-lg font-semibold">
            Payment methods
          </h2>
          <p className="mt-2 text-sm text-muted">
            Use business payment channels approved for receiving subscription
            payments. Verify every QR destination before enabling it.
          </p>
          {methods.map((method, index) => (
            <details key={method.id} className="mt-5 border-b border-line pb-5">
              <summary className="cursor-pointer text-sm font-semibold">
                {method.provider} · {method.recipient} ·{" "}
                {method.enabled ? "Enabled" : "Disabled"}
              </summary>
              <div className="mt-5 flex flex-col gap-5">
                {images[index] ? (
                  <Image
                    unoptimized
                    src={images[index]!}
                    alt={`Current payment QR for ${method.recipient}`}
                    width={200}
                    height={200}
                    className="size-50 rounded-lg border border-line object-contain"
                  />
                ) : null}
                <BillingMethodForm method={method} />
              </div>
            </details>
          ))}
          {!methods.length ? (
            <p className="mt-4 text-sm text-muted">
              No payment methods configured. Paid upgrades remain unavailable.
            </p>
          ) : null}
        </section>
        <section aria-labelledby="new-method-title">
          <h2 id="new-method-title" className="mb-4 text-lg font-semibold">
            Add a payment method
          </h2>
          <BillingMethodForm />
        </section>
      </div>
    </div>
  );
}
