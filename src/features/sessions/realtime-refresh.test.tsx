import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RealtimeRefresh } from "./realtime-refresh";

const { refresh, removeChannel, createChannel, channel } = vi.hoisted(() => {
  const refresh = vi.fn();
  const removeChannel = vi.fn();
  const createChannel = vi.fn();
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockImplementation((callback: (status: string) => void) => {
    callback("SUBSCRIBED");
    return channel;
  });
  createChannel.mockReturnValue(channel);
  return { refresh, removeChannel, createChannel, channel };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ channel: createChannel, removeChannel }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockClear();
  removeChannel.mockClear();
  createChannel.mockClear();
  channel.on.mockClear();
});

describe("RealtimeRefresh", () => {
  it("uses one session broadcast and refetches the authoritative snapshot after connecting", async () => {
    render(<RealtimeRefresh sessionId="session-1" compact />);
    await act(async () => Promise.resolve());

    expect(createChannel).toHaveBeenCalledWith("session:session-1");
    expect(channel.on).toHaveBeenCalledWith("broadcast", { event: "changed" }, expect.any(Function));
    expect(screen.getByText("Live updates connected")).toHaveClass("sr-only");
    await act(async () => vi.advanceTimersByTime(121));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
