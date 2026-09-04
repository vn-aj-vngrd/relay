import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: vi.fn() })),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

vi.mock("@/features/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/features/auth/auth-entry", () => ({
  AuthEntry: vi.fn(() => null),
  AuthEntryFallback: vi.fn(() => null),
}));

import LoginPage from "./login/page";
import SignupPage from "./signup/page";

beforeEach(() => {
  mocks.getCurrentUser.mockReset();
  mocks.redirect.mockClear();
});

describe("authentication entry pages", () => {
  it.each([
    ["login", LoginPage],
    ["signup", SignupPage],
  ])("redirects an authenticated visitor away from %s", async (_, page) => {
    mocks.getCurrentUser.mockResolvedValue({ id: "player-1" });

    await expect(async () => await page()).rejects.toThrow(
      "NEXT_REDIRECT:/home"
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/home");
  });
});
