import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieDelete: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  resolvePostAuthDestination: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    delete: mocks.cookieDelete,
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock("@/features/auth/destination", () => ({
  resolvePostAuthDestination: mocks.resolvePostAuthDestination,
}));

import { GET } from "./route";

beforeEach(() => {
  mocks.cookieDelete.mockReset();
  mocks.cookieGet.mockReset();
  mocks.cookieSet.mockReset();
  mocks.exchangeCodeForSession.mockReset();
  mocks.getUser.mockReset();
  mocks.resolvePostAuthDestination.mockReset();
});

describe("authentication callback", () => {
  it("turns an expired recovery redirect into a useful retry path", async () => {
    const response = await GET(new NextRequest("https://relay.vanajvanguardia.tech/auth/callback?recovery=1"));

    expect(response.headers.get("location")).toBe(
      "https://relay.vanajvanguardia.tech/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one.",
    );
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("turns a canceled Google consent screen into a useful retry path", async () => {
    const response = await GET(new NextRequest("https://relay.vanajvanguardia.tech/auth/callback?error=access_denied"));

    expect(mocks.cookieDelete).toHaveBeenCalledWith("relay_auth_next");
    expect(response.headers.get("location")).toBe(
      "https://relay.vanajvanguardia.tech/login?error=Google%20sign-in%20was%20canceled.%20You%20can%20try%20again%20or%20sign%20in%20with%20your%20email.",
    );
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("uses a safe post-auth destination after Google completes", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.cookieGet.mockReturnValue({ value: "//malicious.example" });
    mocks.resolvePostAuthDestination.mockResolvedValue("/home");

    const response = await GET(new NextRequest("https://relay.vanajvanguardia.tech/auth/callback?code=google-code"));

    expect(mocks.resolvePostAuthDestination).toHaveBeenCalledWith("/home", "user-1");
    expect(mocks.cookieDelete).toHaveBeenCalledWith("relay_auth_next");
    expect(response.headers.get("location")).toBe("https://relay.vanajvanguardia.tech/home");
  });

  it("marks an exchanged recovery session and sends it to password update", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await GET(
      new NextRequest("https://relay.vanajvanguardia.tech/auth/callback?code=recovery-code&recovery=1"),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("recovery-code");
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "relay_password_recovery",
      "1",
      expect.objectContaining({ httpOnly: true, maxAge: 600, sameSite: "lax" }),
    );
    expect(response.headers.get("location")).toBe("https://relay.vanajvanguardia.tech/update-password");
  });
});
