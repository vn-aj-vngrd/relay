import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  workspace: vi.fn(),
  shared: vi.fn(),
  redirect: vi.fn((href: string) => {
    throw new Error(`redirect:${href}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("./queries", () => ({
  getSessionForWorkspace: mocks.workspace,
  getPublicSession: mocks.shared,
}));

import PlayersPage from "@/app/(app)/games/[id]/players/page";
import PublicPlayersPage from "@/app/s/[slug]/players/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "viewer" });
  mocks.workspace.mockResolvedValue({ session: { id: "game" } });
  mocks.shared.mockResolvedValue({ session: { slug: "invite" } });
});

describe("legacy Players routes", () => {
  it("checks workspace authorization before redirecting with roster intent", async () => {
    await expect(
      PlayersPage({
        params: Promise.resolve({ id: "game" }),
        searchParams: Promise.resolve({
          from: "notification",
          tag: ["a", "b"],
        }),
      })
    ).rejects.toThrow(
      "redirect:/games/game/play?from=notification&tag=a&tag=b&panel=players"
    );
    expect(mocks.workspace).toHaveBeenCalledWith("game", "viewer");
  });
  it("retains account-optional shared access and query context", async () => {
    await expect(
      PublicPlayersPage({
        params: Promise.resolve({ slug: "invite" }),
        searchParams: Promise.resolve({ source: "guest" }),
      })
    ).rejects.toThrow("redirect:/s/invite/play?source=guest&panel=players");
    expect(mocks.shared).toHaveBeenCalledWith("invite");
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it("does not redirect unauthorized identifiers or private shared links", async () => {
    mocks.workspace.mockResolvedValue(null);
    mocks.shared.mockResolvedValue(null);
    await expect(
      PlayersPage({
        params: Promise.resolve({ id: "secret" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("not-found");
    await expect(
      PublicPlayersPage({
        params: Promise.resolve({ slug: "secret" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("not-found");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
