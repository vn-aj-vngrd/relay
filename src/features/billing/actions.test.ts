import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  user: vi.fn(),
  request: vi.fn(),
  term: vi.fn(),
  settings: vi.fn(),
  owner: vi.fn(),
  override: vi.fn(),
  method: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  lock: vi.fn(),
  transaction: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  unstable_rethrow: (error: Error) => {
    if (error.message.startsWith("redirect:")) throw error;
  },
}));
vi.mock("@/features/admin/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));
vi.mock("./files", () => ({
  uploadBillingFile: mocks.upload,
  removeBillingFile: mocks.remove,
}));
vi.mock("./usage", () => ({ lockBillingAccount: mocks.lock }));
vi.mock("@/db/client", () => {
  const connection = {
    query: {
      billingRequests: { findFirst: mocks.request },
      billingTerms: { findFirst: mocks.term },
      billingSettings: { findFirst: mocks.settings },
      billingOverrides: { findFirst: mocks.override },
      users: { findFirst: mocks.owner },
      billingMethods: { findFirst: mocks.method },
    },
    execute: vi.fn(),
    insert: (table: unknown) => ({
      values: (value: unknown) => {
        mocks.values(table, value);
        return {
          returning: async () => [
            { id: "11111111-1111-4111-8111-111111111111" },
          ],
          onConflictDoUpdate: async () => undefined,
        };
      },
    }),
    update: (table: unknown) => ({
      set: (value: unknown) => {
        mocks.set(table, value);
        return {
          where: () => ({
            returning: async () => [
              { id: "11111111-1111-4111-8111-111111111111" },
            ],
          }),
        };
      },
    }),
  };
  return {
    db: {
      ...connection,
      transaction: async (
        work: (tx: typeof connection) => Promise<unknown>
      ) => {
        mocks.transaction();
        return work(connection);
      },
    },
  };
});

import {
  adminAuditLogs,
  billingOverrides,
  billingRequests,
  billingSettings,
  billingTerms,
} from "@/db/schema";
import {
  createUpgradeRequest,
  grantComplimentaryPro,
  reviewSubscriptionPayment,
  saveAccountOverrides,
  saveBillingPlan,
  submitSubscriptionPayment,
} from "./actions";
import { defaultBillingPlans, plans } from "./domain";

const id = "11111111-1111-4111-8111-111111111111";
const request = {
  id,
  userId: "payer",
  status: "submitted",
  snapshot: { provider: "GCash" },
  amountCents: 29900,
  games: 30,
  storageBytes: plans.pro.storageBytes,
  planVersion: "pro-v1",
};
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
function approval(extra: Record<string, string> = {}) {
  return form({
    id,
    decision: "approved",
    reason: "Verified actual received funds",
    verified: "on",
    verifiedReference: "GC-12345",
    ...extra,
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.admin.mockResolvedValue({ id: "admin" });
  mocks.user.mockResolvedValue({ id: "payer" });
  mocks.request.mockResolvedValue(request);
  mocks.term.mockResolvedValue(null);
  mocks.owner.mockResolvedValue({ id });
  mocks.override.mockResolvedValue(null);
  mocks.upload.mockResolvedValue(null);
});

describe("subscription payment approval", () => {
  it("requires admin authorization before any database work", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    await expect(reviewSubscriptionPayment({}, approval())).rejects.toThrow(
      "Forbidden"
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("does not grant access from a screenshot or unchecked confirmation", async () => {
    expect(
      await reviewSubscriptionPayment({}, approval({ verified: "" }))
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("prohibits self-approval", async () => {
    mocks.admin.mockResolvedValue({ id: "payer" });
    expect(await reviewSubscriptionPayment({}, approval())).toHaveProperty(
      "error"
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("keeps an old Plus request's agreed allowances when approving", async () => {
    const plusRequest = {
      ...request,
      planVersion: "plus-old",
      games: 11,
      storageBytes: 400 * 1024 * 1024,
    };
    mocks.request
      .mockResolvedValueOnce(plusRequest)
      .mockResolvedValueOnce(plusRequest)
      .mockResolvedValueOnce(null);
    await reviewSubscriptionPayment({}, approval());
    expect(mocks.values).toHaveBeenCalledWith(
      billingTerms,
      expect.objectContaining({
        planVersion: "plus-old",
        games: 11,
        storageBytes: 400 * 1024 * 1024,
      })
    );
    expect(mocks.settings).not.toHaveBeenCalled();
  });
  it("grants selected Plus access with a custom expiry without recording a payment", async () => {
    const end = new Date(Date.now() + 10 * 86400_000)
      .toISOString()
      .slice(0, 10);
    expect(
      await grantComplimentaryPro(
        {},
        form({
          userId: id,
          planId: "plus",
          expiresOn: end,
          reason: "Support extension",
          confirm: "on",
        })
      )
    ).toHaveProperty("success");
    expect(mocks.values).toHaveBeenCalledWith(
      billingTerms,
      expect.objectContaining({
        source: "complimentary",
        planVersion: "plus-v1",
        games: 12,
        endsAt: new Date(`${end}T23:59:59.999+08:00`),
      })
    );
    expect(
      mocks.values.mock.calls.some(([table]) => table === billingRequests)
    ).toBe(false);
  });
  it("credits one snapshotted term only after received-funds confirmation", async () => {
    mocks.request
      .mockResolvedValueOnce(request)
      .mockResolvedValueOnce(request)
      .mockResolvedValueOnce(null);
    expect(await reviewSubscriptionPayment({}, approval())).toHaveProperty(
      "success"
    );
    expect(mocks.lock).toHaveBeenCalledWith(expect.anything(), "payer");
    expect(mocks.values).toHaveBeenCalledWith(
      billingTerms,
      expect.objectContaining({
        userId: "payer",
        requestId: id,
        source: "manual",
        games: 30,
        storageBytes: plans.pro.storageBytes,
      })
    );
    expect(mocks.set).toHaveBeenCalledWith(
      billingRequests,
      expect.objectContaining({
        status: "approved",
        verifiedTransactionKey: "gcash:GC12345",
      })
    );
  });
  it("does not credit an approved request twice", async () => {
    mocks.request.mockResolvedValue({ ...request, status: "approved" });
    expect(await reviewSubscriptionPayment({}, approval())).toHaveProperty(
      "success"
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("rejects an already credited transaction", async () => {
    mocks.request
      .mockResolvedValueOnce(request)
      .mockResolvedValueOnce(request)
      .mockResolvedValueOnce({ id: "other" });
    expect(await reviewSubscriptionPayment({}, approval())).toEqual({
      error: "This transaction has already been credited to another request.",
    });
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("extends future paid-through time without resetting current usage", async () => {
    const future = new Date(Date.now() + 10 * 86400_000);
    mocks.term.mockResolvedValue({ endsAt: future });
    mocks.request
      .mockResolvedValueOnce(request)
      .mockResolvedValueOnce(request)
      .mockResolvedValueOnce(null);
    await reviewSubscriptionPayment({}, approval());
    expect(mocks.values).toHaveBeenCalledWith(
      billingTerms,
      expect.objectContaining({ startsAt: future, usageStartsAt: future })
    );
  });
  it("does not create a paid term for rejection or clarification", async () => {
    await reviewSubscriptionPayment(
      {},
      approval({ decision: "clarification", verified: "" })
    );
    expect(
      mocks.values.mock.calls.some(([table]) => table === billingTerms)
    ).toBe(false);
  });
  it("cannot repeatedly grant a free month while access remains active", async () => {
    mocks.term.mockResolvedValue({ endsAt: new Date(Date.now() + 86400_000) });
    expect(
      await grantComplimentaryPro(
        {},
        form({ userId: id, reason: "Testing account", confirm: "on" })
      )
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });
});

describe("admin account plan assignments", () => {
  const assignment = () =>
    form({
      userId: id,
      planId: "unlimited",
      games: "",
      storageMiB: "",
      reason: "Internal host account",
      confirm: "on",
    });
  it("requires administrator authorization before assigning Unlimited", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    await expect(saveAccountOverrides({}, assignment())).rejects.toThrow(
      "Forbidden"
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("assigns Unlimited over existing paid access without changing financial history", async () => {
    expect(await saveAccountOverrides({}, assignment())).toHaveProperty(
      "success"
    );
    expect(mocks.values).toHaveBeenCalledWith(
      billingOverrides,
      expect.objectContaining({
        userId: id,
        planOverride: expect.objectContaining({
          id: "unlimited",
          visible: false,
        }),
        games: null,
        storageBytes: null,
      })
    );
    expect(
      mocks.values.mock.calls.some(
        ([table]) => table === billingTerms || table === billingRequests
      )
    ).toBe(false);
    expect(mocks.values).toHaveBeenCalledWith(
      adminAuditLogs,
      expect.objectContaining({
        action: "billing.overrides_updated",
        targetId: id,
      })
    );
  });
  it("removes the assignment without rewriting usage or paid terms", async () => {
    const data = assignment();
    data.set("planId", "");
    expect(await saveAccountOverrides({}, data)).toHaveProperty("success");
    expect(mocks.values).toHaveBeenCalledWith(
      billingOverrides,
      expect.objectContaining({ planOverride: null })
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
});

describe("admin catalog publishing", () => {
  function publish(overrides: Record<string, string> = {}) {
    return form({
      id: "plus",
      version: "plus-v1",
      price: "179.50",
      games: "15",
      storageMiB: "750",
      availability: "coming_soon",
      visible: "on",
      reason: "Update launch offer",
      confirm: "on",
      ...overrides,
    });
  }
  it("requires AAL2 admin authorization", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    await expect(saveBillingPlan({}, publish())).rejects.toThrow("Forbidden");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("publishes a new version and audit without editing terms or requests", async () => {
    expect(await saveBillingPlan({}, publish())).toHaveProperty("success");
    expect(mocks.values).toHaveBeenCalledWith(
      billingSettings,
      expect.objectContaining({
        planCatalog: expect.arrayContaining([
          expect.objectContaining({
            id: "plus",
            priceCents: 17950,
            games: 15,
            storageBytes: 750 * 1024 * 1024,
            version: expect.stringMatching(/^plus-/),
          }),
        ]),
      })
    );
    expect(mocks.values).toHaveBeenCalledWith(
      adminAuditLogs,
      expect.objectContaining({
        action: "billing.plan_published",
        reason: "Update launch offer",
      })
    );
    expect(
      mocks.values.mock.calls.some(
        ([table]) => table === billingTerms || table === billingRequests
      )
    ).toBe(false);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects stale edits and unconfirmed changes", async () => {
    expect(
      await saveBillingPlan({}, publish({ version: "old-version" }))
    ).toHaveProperty("error");
    expect(await saveBillingPlan({}, publish({ confirm: "" }))).toHaveProperty(
      "error"
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("requires payment readiness before activating a paid plan", async () => {
    expect(
      await saveBillingPlan({}, publish({ availability: "active" }))
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("allows activation only after configuration is ready", async () => {
    mocks.settings.mockResolvedValue({
      acceptingPayments: true,
      supportContact: "Support",
      reviewTime: "One day",
      policy: "Published payment policy",
    });
    mocks.method.mockResolvedValue({ id });
    expect(
      await saveBillingPlan({}, publish({ availability: "active" }))
    ).toHaveProperty("success");
  });
  it("cannot charge for or pause Free", async () => {
    expect(
      await saveBillingPlan({}, publish({ id: "free", version: "free-v1" }))
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });
});

describe("upgrade requests", () => {
  it("rejects self-purchase of Unlimited and hidden active plans", async () => {
    mocks.request.mockResolvedValue(null);
    expect(
      await createUpgradeRequest(
        {},
        form({ methodId: id, planId: "unlimited" })
      )
    ).toHaveProperty("error");
    mocks.settings.mockResolvedValue({
      acceptingPayments: true,
      planCatalog: defaultBillingPlans.map((plan) => ({
        ...plan,
        visible: false,
        availability: "active",
      })),
    });
    mocks.method.mockResolvedValue({ id });
    expect(
      await createUpgradeRequest(
        {},
        form({ methodId: id, planId: "plus", planVersion: "plus-v1" })
      )
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("blocks Coming soon plans even with collection enabled", async () => {
    mocks.request.mockResolvedValue(null);
    mocks.settings.mockResolvedValue({ acceptingPayments: true });
    mocks.method.mockResolvedValue({ id });
    expect(
      await createUpgradeRequest(
        {},
        form({ methodId: id, planId: "plus", planVersion: "plus-v1" })
      )
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("blocks stale prices and snapshots an active Plus offer from the server", async () => {
    mocks.request.mockResolvedValue(null);
    mocks.settings.mockResolvedValue({
      acceptingPayments: true,
      planCatalog: defaultBillingPlans.map((plan) =>
        plan.id === "plus"
          ? {
              ...plan,
              version: "plus-new",
              priceCents: 18900,
              games: 16,
              availability: "active",
            }
          : plan
      ),
    });
    mocks.method.mockResolvedValue({ id, provider: "GCash" });
    expect(
      await createUpgradeRequest(
        {},
        form({ methodId: id, planId: "plus", planVersion: "plus-v1" })
      )
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
    await expect(
      createUpgradeRequest(
        {},
        form({
          methodId: id,
          planId: "plus",
          planVersion: "plus-new",
          amountCents: "1",
        })
      )
    ).rejects.toThrow("redirect:");
    expect(mocks.values).toHaveBeenCalledWith(
      billingRequests,
      expect.objectContaining({
        planVersion: "plus-new",
        amountCents: 18900,
        games: 16,
      })
    );
  });
  it("returns an existing open request rather than creating another", async () => {
    await expect(
      createUpgradeRequest({}, form({ methodId: id }))
    ).rejects.toThrow(`redirect:/settings/plan/requests/${id}`);
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("fails closed while sales are disabled", async () => {
    mocks.request.mockResolvedValue(null);
    mocks.settings.mockResolvedValue({ acceptingPayments: false });
    expect(
      await createUpgradeRequest({}, form({ methodId: id }))
    ).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("snapshots instructions and price from the server rather than submitted fields", async () => {
    mocks.request.mockResolvedValue(null);
    mocks.settings.mockResolvedValue({
      acceptingPayments: true,
      supportContact: "Billing support",
      reviewTime: "One business day",
      policy: "Published policy",
      planCatalog: defaultBillingPlans.map((plan) => ({
        ...plan,
        availability: "active",
      })),
    });
    mocks.method.mockResolvedValue({
      id,
      provider: "GCash",
      recipient: "Relay",
      account: "Merchant account",
      qrPath: "methods/original.png",
      instructions: "Pay exact amount",
    });
    await expect(
      createUpgradeRequest(
        {},
        form({
          methodId: id,
          planVersion: "pro-v1",
          amountCents: "1",
          qrPath: "attacker",
        })
      )
    ).rejects.toThrow("redirect:");
    expect(mocks.values).toHaveBeenCalledWith(
      billingRequests,
      expect.objectContaining({
        amountCents: 29900,
        snapshot: expect.objectContaining({
          recipient: "Relay",
          qrPath: "methods/original.png",
          policy: "Published policy",
        }),
      })
    );
  });
  it("does not upload proof for a missing or unauthorized request", async () => {
    mocks.request.mockResolvedValue(null);
    expect(
      await submitSubscriptionPayment(
        {},
        form({ id, transactionReference: "TX123" })
      )
    ).toHaveProperty("error");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.values).not.toHaveBeenCalled();
  });
});
