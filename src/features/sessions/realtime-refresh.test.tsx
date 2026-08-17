import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeRefresh } from "./realtime-refresh";

const { refresh, removeChannel, setAuth, channel } = vi.hoisted(() => {
  const refresh = vi.fn();
  const removeChannel = vi.fn();
  const setAuth = vi.fn();
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockImplementation((callback: (status: string) => void) => {
    callback("SUBSCRIBED");
    return channel;
  });
  return { refresh, removeChannel, setAuth, channel };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    realtime: { setAuth },
    channel: vi.fn(() => channel),
    removeChannel,
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockClear();
  removeChannel.mockClear();
  setAuth.mockClear();
});

describe("RealtimeRefresh", () => {
  it("refetches the authoritative snapshot after the channel connects", async () => {
    render(<RealtimeRefresh sessionId="session-1" compact />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText("Live updates connected")).toHaveClass("sr-only");
    expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    expect(screen.queryByText("Everyone is up to date")).not.toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(121));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
