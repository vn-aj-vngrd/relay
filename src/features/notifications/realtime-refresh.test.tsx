import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationRealtimeRefresh } from "./realtime-refresh";

const mocks = vi.hoisted(() => {
  const refresh = vi.fn();
  const removeChannel = vi.fn();
  const setAuth = vi.fn();
  const getSession = vi
    .fn()
    .mockResolvedValue({ data: { session: { access_token: "test-token" } } });
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  const createChannel = vi.fn(() => channel);
  return {
    refresh,
    removeChannel,
    setAuth,
    getSession,
    channel,
    createChannel,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getSession: mocks.getSession },
    realtime: { setAuth: mocks.setAuth },
    channel: mocks.createChannel,
    removeChannel: mocks.removeChannel,
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.channel.on.mockReturnValue(mocks.channel);
});

describe("NotificationRealtimeRefresh", () => {
  it("refetches after connecting so changes missed while offline are recovered", async () => {
    render(<NotificationRealtimeRefresh userId="user-1" />);
    await act(async () => Promise.resolve());

    expect(mocks.createChannel).toHaveBeenCalledWith("notifications:user-1");
    expect(mocks.channel.subscribe).toHaveBeenCalledWith(expect.any(Function));

    const status = mocks.channel.subscribe.mock.calls[0]?.[0] as (
      value: string
    ) => void;
    status("SUBSCRIBED");
    await act(async () => vi.advanceTimersByTime(151));

    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
