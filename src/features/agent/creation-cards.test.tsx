import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentCreationReview as AgentCreationCard } from "./creation-cards";
import { type CreationProposal, creationInputSchema } from "./creation-schema";

const proposal: CreationProposal = {
  id: "proposal",
  messageId: "question",
  status: "pending",
  input: creationInputSchema.parse({ kind: "group", title: "Friday crew" }),
  preview: { title: "Friday crew", lines: ["You are the owner."], people: [] },
  destination: null,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};
afterEach(() => vi.unstubAllGlobals());
describe("Agent creation review", () => {
  it("sends only the reviewed action ID when the user confirms", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...proposal,
        status: "completed",
        destination: "/groups/friday",
      }),
    });
    vi.stubGlobal("fetch", fetcher);
    const onChange = vi.fn();
    render(
      <AgentCreationCard
        proposal={proposal}
        disabled={false}
        onEdit={vi.fn()}
        onChange={onChange}
      />
    );
    expect(fetcher).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Approve & create group" })
    );
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      id: "proposal",
      action: "confirm",
    });
  });
  it("offers correction without executing the proposal", () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const edit = vi.fn();
    render(
      <AgentCreationCard
        proposal={proposal}
        disabled={false}
        onEdit={edit}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    expect(edit).toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("restores a completed resource as a link instead of another create button", () => {
    render(
      <AgentCreationCard
        proposal={{
          ...proposal,
          status: "completed",
          destination: "/groups/friday",
        }}
        disabled={false}
        onEdit={vi.fn()}
        onChange={vi.fn()}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Approve & create group" })
    ).toBeNull();
    expect(screen.getByRole("link", { name: "Open group" })).toHaveAttribute(
      "href",
      "/groups/friday"
    );
  });
  it("requires a new preview after expiry", () => {
    render(
      <AgentCreationCard
        proposal={{ ...proposal, expiresAt: new Date(0).toISOString() }}
        disabled={false}
        onEdit={vi.fn()}
        onChange={vi.fn()}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Approve & create group" })
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Prepare a fresh preview" })
    ).toBeVisible();
  });
});
