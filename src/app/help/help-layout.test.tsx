import { AuthSessionMissingError } from "@supabase/supabase-js";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  requireUser: vi.fn(),
  findProfile: vi.fn(),
  authenticatedShell: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/db/client", () => ({
  db: { query: { profiles: { findFirst: mocks.findProfile } } },
}));
vi.mock("@/components/shared/authenticated-app-shell", () => ({
  AuthenticatedAppShell: (props: {
    children: ReactNode;
    showApplicationTour?: boolean;
  }) => {
    mocks.authenticatedShell(props);
    return (
      <>
        <nav aria-label="App navigation">
          <a href="/home">Home</a>
          <a href="/games">Games</a>
        </nav>
        {props.children}
      </>
    );
  },
}));
vi.mock("@/components/shared/public-product-shell", () => ({
  PublicProductShell: ({ children }: { children: ReactNode }) => (
    <>
      <nav aria-label="Public navigation">
        <a href="/login">Log in</a>
        <a href="/signup">Sign up</a>
      </nav>
      {children}
    </>
  ),
}));

import HelpArticlePage from "./[slug]/page";
import HelpLayout from "./layout";
import HelpPage from "./page";

const user = { id: "11111111-1111-4111-8111-111111111111" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.requireUser.mockResolvedValue(user);
  mocks.findProfile.mockResolvedValue({ onboardingCompletedAt: new Date() });
});
afterEach(cleanup);

async function helpContent(route: string) {
  return route === "/help"
    ? await HelpPage({ searchParams: Promise.resolve({}) })
    : await HelpArticlePage({
        params: Promise.resolve({ slug: "guest-rsvp" }),
      });
}

describe("Help layout shell selection", () => {
  it.each(["/help", "/help/guest-rsvp"])(
    "preserves authenticated app chrome on %s without a required tour",
    async (route) => {
      render(await HelpLayout({ children: await helpContent(route) }));
      expect(
        screen.getByRole("navigation", { name: "App navigation" })
      ).toBeVisible();
      expect(
        screen.queryByRole("navigation", { name: "Public navigation" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Log in" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Sign up" })
      ).not.toBeInTheDocument();
      expect(mocks.authenticatedShell).toHaveBeenCalledWith(
        expect.objectContaining({ user, showApplicationTour: false })
      );
      expect(mocks.requireUser).toHaveBeenCalledWith("/help");
    }
  );

  it.each(["/help", "/help/guest-rsvp"])(
    "keeps signed-out %s public",
    async (route) => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthSessionMissingError(),
      });
      render(await HelpLayout({ children: await helpContent(route) }));
      expect(
        screen.getByRole("navigation", { name: "Public navigation" })
      ).toBeVisible();
      expect(mocks.requireUser).not.toHaveBeenCalled();
      expect(mocks.findProfile).not.toHaveBeenCalled();
    }
  );

  it.each([null, { onboardingCompletedAt: null }])(
    "leaves missing/incomplete profiles in readable recovery without a tour or setup redirect",
    async (profile) => {
      mocks.findProfile.mockResolvedValue(profile);
      render(
        await HelpLayout({ children: await helpContent("/help/guest-rsvp") })
      );
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "RSVP from a shared link without an account",
        })
      ).toBeVisible();
      expect(
        screen.getByRole("navigation", { name: "Public navigation" })
      ).toBeVisible();
      expect(mocks.authenticatedShell).not.toHaveBeenCalled();
    }
  );

  it("does not reinterpret provider failure as signed-out", async () => {
    const error = new Error("Provider unavailable");
    mocks.getUser.mockResolvedValue({ data: { user: null }, error });
    await expect(HelpLayout({ children: null })).rejects.toBe(error);
    expect(mocks.findProfile).not.toHaveBeenCalled();
  });

  it("propagates profile failures rather than showing anonymous chrome", async () => {
    const error = new Error("Profile query unavailable");
    mocks.findProfile.mockRejectedValue(error);
    await expect(HelpLayout({ children: null })).rejects.toBe(error);
  });

  it("preserves existing account restriction redirects", async () => {
    const redirect = new Error("NEXT_REDIRECT:account-suspended");
    mocks.requireUser.mockRejectedValue(redirect);
    await expect(HelpLayout({ children: null })).rejects.toBe(redirect);
    expect(mocks.findProfile).not.toHaveBeenCalled();
  });
});
