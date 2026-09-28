import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  config: vi.fn(),
  models: vi.fn(),
  metrics: vi.fn(),
  trend: vi.fn(),
  usage: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/features/admin/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/features/agent/config", () => ({ readAgentSettings: mocks.config }));
vi.mock("@/features/agent/models", () => ({ getAgentModels: mocks.models }));
vi.mock("@/features/agent/admin-metrics", () => ({
  getAgentAdminMetrics: mocks.metrics,
  getAgentRequestTrend: mocks.trend,
}));
vi.mock("@/features/agent/usage", () => ({ getAgentUsage: mocks.usage }));
vi.mock("@/features/agent/readiness", () => ({
  agentReadiness: () => ({ checks: [], storageReady: true }),
}));
vi.mock("@/features/agent/connection-form", () => ({
  AgentConnectionForm: () => null,
}));
vi.mock("@/features/agent/settings-form", () => ({
  AgentSettingsForm: () => <div>Agent settings form</div>,
}));

import { defaultAgentConfig } from "@/features/agent/validation";
import AdminAgentPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.admin.mockResolvedValue({ id: "admin" });
  mocks.config.mockResolvedValue({
    config: { ...defaultAgentConfig, model: "test/model" },
    encryptedApiKey: "ciphertext",
  });
  mocks.models.mockResolvedValue([{ id: "test/model", name: "Test" }]);
  mocks.usage.mockResolvedValue({});
  mocks.metrics.mockResolvedValue({
    charged7Days: 3,
    released7Days: 1,
    charged30Days: 8,
    released30Days: 2,
    activeUsers30Days: 4,
    reserved30Days: 1,
    reports30Days: 2,
    openReports: 1,
    goodRatings30Days: 4,
    badRatings30Days: 2,
    requests: {
      attempts7Days: 3,
      failed7Days: 1,
      attempts30Days: 7,
      failed30Days: 1,
      stopped30Days: 1,
      toolFailures30Days: 2,
      averageDurationMs: 2100,
      p95DurationMs: 6200,
      averageFirstTextMs: 900,
      firstTextCount30Days: 6,
      costUsdMicros: 12_500,
      costReported30Days: 5,
    },
  });
  mocks.trend.mockResolvedValue([
    { day: "2026-09-28", attempts: 3, failed: 1, stopped: 0 },
  ]);
});

describe("Admin Agent metrics", () => {
  it("requires admin MFA authorization before reading usage", async () => {
    mocks.admin.mockRejectedValueOnce(new Error("redirect"));
    await expect(AdminAgentPage({})).rejects.toThrow("redirect");
    expect(mocks.metrics).not.toHaveBeenCalled();
  });

  it("shows aggregate counts and measured visuals on the metrics tab", async () => {
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "metrics" }),
      })
    );
    expect(
      screen.getByRole("navigation", { name: "Agent sections" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Metrics" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/admin/agent?tab=settings"
    );
    expect(
      screen.getByRole("heading", { name: "Usage and answer health" })
    ).toBeVisible();
    expect(screen.getByText("Active users")).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Daily provider attempts/ })
    ).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Completed attempts: 5 of 7/ })
    ).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: /5 completed, 1 failed and 1 stopped out of 7/,
      })
    ).toBeVisible();
    expect(screen.getByText("Reported provider cost")).toBeVisible();
    expect(screen.getByText("$0.0125")).toBeVisible();
    expect(screen.getByText("P95 request time")).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Good ratings: 4 of 6/ })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review feedback" })
    ).toHaveAttribute("href", "/admin/feedback");
    expect(mocks.metrics).toHaveBeenCalledOnce();
    expect(mocks.trend).toHaveBeenCalledOnce();
    expect(screen.queryByText("Agent settings form")).not.toBeInTheDocument();
  });

  it("opens settings separately without reading usage metrics", async () => {
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "settings" }),
      })
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByText("Agent settings form")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Usage and answer health" })
    ).not.toBeInTheDocument();
    expect(mocks.metrics).not.toHaveBeenCalled();
    expect(mocks.usage).not.toHaveBeenCalled();
  });

  it("keeps settings available when metrics cannot be read", async () => {
    mocks.metrics.mockRejectedValueOnce(new Error("database unavailable"));
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "metrics" }),
      })
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Usage metrics are temporarily unavailable"
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/admin/agent?tab=settings"
    );
  });

  it("keeps setup checks visible at full width when ready", async () => {
    render(await AdminAgentPage({}));
    const section = screen
      .getByRole("heading", { name: "Setup status" })
      .closest("section");
    expect(section).toHaveClass("w-full");
    expect(section).not.toHaveClass("max-w-3xl");
    expect(screen.getByText("Compatible model route")).toBeVisible();
    expect(
      screen.queryByText("View setup checks and test connection")
    ).not.toBeInTheDocument();
  });

  it("keeps setup checks visible when readiness needs attention", async () => {
    mocks.usage.mockRejectedValueOnce(new Error("database unavailable"));
    render(await AdminAgentPage({}));
    expect(screen.getByText("Setup needs attention")).toBeVisible();
    expect(screen.getByText("Message usage service")).toBeVisible();
    expect(screen.getByText("Needs attention")).toBeVisible();
  });

  it("distinguishes no samples from unavailable answer metrics", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({
      ...sample,
      requests: { ...sample.requests, attempts30Days: 0 },
    });
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "metrics" }),
      })
    );
    expect(screen.getByText(/No provider attempts recorded/)).toBeVisible();
    expect(screen.queryByText("$0.0000")).not.toBeInTheDocument();
  });

  it("keeps message usage visible when answer metrics are unavailable", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({ ...sample, requests: null });
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "metrics" }),
      })
    );
    expect(screen.getByText("Charged messages")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Answer metrics are unavailable"
    );
  });

  it("shows unknown cost when the provider reports no prices", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({
      ...sample,
      requests: { ...sample.requests, costReported30Days: 0 },
    });
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "metrics" }),
      })
    );
    const label = screen.getByText("Reported provider cost");
    expect(label.parentElement).toHaveTextContent("Unavailable");
  });

  it("does not round a positive provider cost down to zero", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({
      ...sample,
      requests: { ...sample.requests, costUsdMicros: 40 },
    });
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "metrics" }),
      })
    );
    expect(screen.getByText("<$0.0001")).toBeVisible();
  });

  it("labels unavailable feedback counts without hiding usage", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({
      ...sample,
      reports30Days: null,
      openReports: null,
    });
    render(
      await AdminAgentPage({
        searchParams: Promise.resolve({ tab: "metrics" }),
      })
    );
    expect(screen.getByText(/Unavailable open answer reports/)).toBeVisible();
    expect(screen.getByText("Charged messages")).toBeVisible();
  });

  it("keeps evaluation inputs separate from measured metrics", async () => {
    render(
      await AdminAgentPage({ searchParams: Promise.resolve({ tab: "evals" }) })
    );
    expect(screen.getByRole("link", { name: "Evals" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("heading", { name: "Evaluate Agent answers" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Evaluate Agent answers" })
        .parentElement?.parentElement
    ).toHaveClass("w-full");
    expect(
      screen.getByText(/this page does not record an eval pass rate/i)
    ).toBeVisible();
    expect(mocks.metrics).not.toHaveBeenCalled();
    expect(mocks.trend).not.toHaveBeenCalled();
  });
});
