import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  config: vi.fn(),
  models: vi.fn(),
  metrics: vi.fn(),
  usage: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/features/admin/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/features/agent/config", () => ({ readAgentSettings: mocks.config }));
vi.mock("@/features/agent/models", () => ({ getAgentModels: mocks.models }));
vi.mock("@/features/agent/admin-metrics", () => ({
  getAgentAdminMetrics: mocks.metrics,
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
});

describe("Admin Agent metrics", () => {
  it("requires admin MFA authorization before reading usage", async () => {
    mocks.admin.mockRejectedValueOnce(new Error("redirect"));
    await expect(AdminAgentPage({})).rejects.toThrow("redirect");
    expect(mocks.metrics).not.toHaveBeenCalled();
  });

  it("shows aggregate counts without user-level data", async () => {
    render(await AdminAgentPage({}));
    expect(
      screen.getByRole("navigation", { name: "Agent sections" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/admin/agent?tab=settings"
    );
    expect(
      screen.getByRole("heading", { name: "Usage metrics" })
    ).toBeVisible();
    expect(screen.getByText("Active users · 30 days")).toBeVisible();
    const detailToggle = screen.getByText("Detailed metrics and definitions");
    expect(detailToggle.closest("details")).not.toHaveAttribute("open");
    fireEvent.click(detailToggle);
    expect(detailToggle.closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Released before text · 7 days")).toBeVisible();
    expect(screen.getByText("Reported provider cost · 30 days")).toBeVisible();
    expect(screen.getByText("$0.0125")).toBeVisible();
    expect(screen.getByText("P95 request time · 30 days")).toBeVisible();
    expect(screen.getByText("4 good · 2 needs work")).toBeVisible();
    expect(screen.getByText("Good reply ratings · 30 days")).toBeVisible();
    expect(screen.getByText(/1 of 7 · 14\.3%/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review feedback" })
    ).toHaveAttribute("href", "/admin/feedback");
    expect(mocks.metrics).toHaveBeenCalledOnce();
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
      screen.queryByRole("heading", { name: "Usage metrics" })
    ).not.toBeInTheDocument();
    expect(mocks.metrics).not.toHaveBeenCalled();
    expect(mocks.usage).not.toHaveBeenCalled();
  });

  it("keeps settings available when metrics cannot be read", async () => {
    mocks.metrics.mockRejectedValueOnce(new Error("database unavailable"));
    render(await AdminAgentPage({}));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Usage metrics are temporarily unavailable"
    );
    expect(screen.getByRole("heading", { name: "Setup status" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/admin/agent?tab=settings"
    );
  });

  it("expands setup checks when readiness needs attention", async () => {
    mocks.usage.mockRejectedValueOnce(new Error("database unavailable"));
    render(await AdminAgentPage({}));
    expect(screen.getByText("Setup needs attention")).toBeVisible();
    expect(
      screen
        .getByText("View setup checks and test connection")
        .closest("details")
    ).toHaveAttribute("open");
  });

  it("distinguishes no samples from unavailable answer metrics", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({
      ...sample,
      requests: { ...sample.requests, attempts30Days: 0 },
    });
    render(await AdminAgentPage({}));
    expect(screen.getByText(/No provider attempts recorded/)).toBeVisible();
    expect(screen.queryByText("$0.0000")).not.toBeInTheDocument();
  });

  it("keeps message usage visible when answer metrics are unavailable", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({ ...sample, requests: null });
    render(await AdminAgentPage({}));
    expect(screen.getByText("Charged messages · 30 days")).toBeVisible();
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
    render(await AdminAgentPage({}));
    fireEvent.click(screen.getByText("Detailed metrics and definitions"));
    const label = screen.getByText("Reported provider cost · 30 days");
    expect(label.nextElementSibling).toHaveTextContent("Unavailable");
  });

  it("does not round a positive provider cost down to zero", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({
      ...sample,
      requests: { ...sample.requests, costUsdMicros: 40 },
    });
    render(await AdminAgentPage({}));
    fireEvent.click(screen.getByText("Detailed metrics and definitions"));
    expect(screen.getByText("<$0.0001")).toBeVisible();
  });

  it("labels unavailable feedback counts without hiding usage", async () => {
    const sample = await mocks.metrics();
    mocks.metrics.mockResolvedValueOnce({
      ...sample,
      reports30Days: null,
      openReports: null,
    });
    render(await AdminAgentPage({}));
    fireEvent.click(screen.getByText("Detailed metrics and definitions"));
    const label = screen.getByText("Answer reports · 30 days");
    expect(label.nextElementSibling).toHaveTextContent("Unavailable");
    expect(screen.getByText("Charged messages · 30 days")).toBeVisible();
  });
});
