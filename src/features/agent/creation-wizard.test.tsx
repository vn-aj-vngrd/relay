import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentCreationCard } from "./creation-cards";
import { inputForCreation } from "./creation-form-model";
import type { CreationProposal } from "./creation-schema";

const initial: CreationProposal = {
  id: "setup",
  messageId: "message",
  status: "collecting",
  input: inputForCreation("group"),
  preview: { title: "Create group", collecting: true, lines: [], people: [] },
  destination: null,
  expiresAt: "2099-01-01T00:00:00.000Z",
};
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("Guided creation approval", () => {
  it("sizes the question panel from its composer anchor, not its own top edge", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ groups: [], hostedGames: [], courts: [] }),
      })
    );
    const host = document.createElement("div");
    document.body.appendChild(host);
    vi.spyOn(host, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 160, 768, 420)
    );
    try {
      render(
        <AgentCreationCard
          proposal={initial}
          disabled={false}
          onChange={vi.fn()}
          panelHost={host}
        />
      );
      const panel = await screen.findByRole("region", {
        name: "Creation questions",
      });
      expect(host).toContainElement(panel);
      expect(panel).toHaveStyle({ maxHeight: "460px" });
    } finally {
      host.remove();
    }
  });
  it("retains unsaved answers on a safe dismissal and reuses the retry identity", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") throw new Error("Connection interrupted");
      return {
        ok: true,
        json: async () => ({ groups: [], hostedGames: [], courts: [] }),
      };
    });
    vi.stubGlobal("fetch", fetcher);
    render(
      <AgentCreationCard
        proposal={initial}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    let dialog = await screen.findByRole("region", {
      name: "Creation questions",
    });
    fireEvent.change(within(dialog).getByLabelText("Group name"), {
      target: { value: "Friday crew" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Review" }));
    fireEvent.click(
      await within(dialog).findByRole("button", {
        name: "Keep answers and close",
      })
    );
    expect(
      screen.queryByRole("region", { name: "Creation questions" })
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue setup" }));
    dialog = await screen.findByRole("region", { name: "Creation questions" });
    expect(within(dialog).getByLabelText("Group name")).toHaveValue(
      "Friday crew"
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Review" }));
    await waitFor(() =>
      expect(
        fetcher.mock.calls.filter(([, init]) => init?.method === "PUT")
      ).toHaveLength(2)
    );
    const attempts = fetcher.mock.calls.filter(
      ([, init]) => init?.method === "PUT"
    );
    expect(attempts[1][1]?.body).toBe(attempts[0][1]?.body);
  });
  it.each(["review", "close"])(
    "recovers a lost review before %s with changed input",
    async (action) => {
      let writes = 0;
      const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method !== "PUT")
          return {
            ok: true,
            json: async () => ({ groups: [], hostedGames: [], courts: [] }),
          };
        const payload = JSON.parse(String(init.body));
        writes++;
        if (writes === 1) throw new Error("Response lost after commit");
        return {
          ok: true,
          json: async () => ({
            ...initial,
            id: writes === 2 ? "recovered-review" : "updated",
            status: payload.action === "review" ? "pending" : "collecting",
            input: payload.input,
            preview: {
              title: payload.input.title,
              lines: [],
              people: [],
              collecting: payload.action !== "review",
            },
          }),
        };
      });
      vi.stubGlobal("fetch", fetcher);
      render(
        <AgentCreationCard
          proposal={initial}
          disabled={false}
          onChange={vi.fn()}
        />
      );
      const dialog = await screen.findByRole("region", {
        name: "Creation questions",
      });
      fireEvent.change(within(dialog).getByLabelText("Group name"), {
        target: { value: "Friday crew" },
      });
      fireEvent.click(within(dialog).getByRole("button", { name: "Review" }));
      await within(dialog).findByText("Response lost after commit");
      fireEvent.change(within(dialog).getByLabelText("Group name"), {
        target: { value: "Saturday crew" },
      });
      fireEvent.click(
        within(dialog).getByRole("button", {
          name: action === "review" ? "Review" : "Save and close setup",
        })
      );
      await waitFor(() => expect(writes).toBe(3));
      const attempts = fetcher.mock.calls
        .filter(([, init]) => init?.method === "PUT")
        .map(([, init]) => JSON.parse(String(init?.body)));
      expect(attempts[1]).toEqual(attempts[0]);
      expect(attempts[2]).toMatchObject({
        id: "recovered-review",
        action: action === "review" ? "review" : "save",
        input: { title: "Saturday crew" },
      });
    }
  );
  it("keeps answers on outside clicks and only creates after explicit approval", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return {
        ok: true,
        json: async () =>
          body.action === "review"
            ? {
                ...initial,
                id: "review",
                status: "pending",
                input: body.input,
                preview: {
                  title: body.input.title,
                  lines: ["You are the owner."],
                  people: [],
                },
              }
            : body.action === "confirm"
              ? {
                  ...initial,
                  id: "review",
                  status: "completed",
                  destination: "/groups/created",
                }
              : { groups: [], hostedGames: [], courts: [] },
      };
    });
    vi.stubGlobal("fetch", fetcher);
    render(
      <AgentCreationCard
        proposal={initial}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    const dialog = await screen.findByRole("region", {
      name: "Creation questions",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Review" }));
    expect(within(dialog).getByText("Enter a group name.")).toBeVisible();
    fireEvent.change(within(dialog).getByLabelText("Group name"), {
      target: { value: "Friday crew" },
    });
    fireEvent.pointerDown(document.body);
    expect(within(dialog).getByLabelText("Group name")).toHaveValue(
      "Friday crew"
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Review" }));
    const approve = await within(dialog).findByRole("button", {
      name: "Approve & create group",
    });
    expect(
      fetcher.mock.calls.filter(([, init]) => init?.method === "POST")
    ).toHaveLength(0);
    fireEvent.click(approve);
    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith(
        "/api/agent/creations",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ id: "review", action: "confirm" }),
        })
      )
    );
  });
});

describe("Above-input question panel", () => {
  it("renders in the composer host and saves answers before a conversational correction", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const beforeChat: { current: (() => Promise<void>) | null } = {
      current: null,
    };
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      json: async () =>
        init?.method === "PUT"
          ? { ...initial, input: JSON.parse(String(init.body)).input }
          : { groups: [], hostedGames: [], courts: [] },
    }));
    vi.stubGlobal("fetch", fetcher);
    render(
      <AgentCreationCard
        panelHost={host}
        beforeChat={beforeChat}
        proposal={initial}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    const panel = await within(host).findByRole("region", {
      name: "Creation questions",
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.change(within(panel).getByLabelText("Group name"), {
      target: { value: "Saved before chat" },
    });
    await act(async () => {
      await beforeChat.current?.();
    });
    const payload = JSON.parse(
      String(
        fetcher.mock.calls.find(([, init]) => init?.method === "PUT")?.[1]?.body
      )
    );
    expect(payload).toMatchObject({
      action: "save",
      input: { title: "Saved before chat" },
    });
    expect(within(host).queryByRole("region")).toBeNull();
    host.remove();
  });
  it("switches to one-question-at-a-time chat without creating a resource", async () => {
    const chat = vi.fn();
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      json: async () =>
        init?.method === "PUT"
          ? { ...initial, input: JSON.parse(String(init.body)).input }
          : { groups: [], hostedGames: [], courts: [] },
    }));
    vi.stubGlobal("fetch", fetcher);
    render(
      <AgentCreationCard
        proposal={initial}
        disabled={false}
        onChange={vi.fn()}
        onChatMode={chat}
      />
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Answer in chat" })
    );
    await waitFor(() => expect(chat).toHaveBeenCalledOnce());
    expect(
      JSON.parse(
        String(
          fetcher.mock.calls.find(([, init]) => init?.method === "PUT")?.[1]
            ?.body
        )
      )
    ).toMatchObject({ action: "save", input: { interactionMode: "chat" } });
    expect(fetcher.mock.calls.some(([, init]) => init?.method === "POST")).toBe(
      false
    );
    expect(
      screen.getByRole("button", { name: "Answer with choices" })
    ).toBeVisible();
  });
});
