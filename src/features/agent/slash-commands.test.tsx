import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  AgentComposerEditor,
  type AgentComposerHandle,
} from "./composer-editor";
import { matchingSlashCommands, slashQuery } from "./slash-commands";

beforeAll(() => {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
});
const capabilities = {
  allowGameData: true,
  allowCourtSearch: true,
  allowHelp: true,
  allowGameCreation: false,
  allowGroupCreation: false,
};
function paste(input: HTMLElement, value: string) {
  fireEvent.focus(input);
  fireEvent.paste(input, { clipboardData: { getData: () => value } });
}
describe("Agent slash discovery", () => {
  it("opens the shared menu without changing or sending the draft", async () => {
    const ref = createRef<AgentComposerHandle>();
    const change = vi.fn();
    const submit = vi.fn();
    render(
      <>
        <AgentComposerEditor
          ref={ref}
          value="Please help"
          onChange={change}
          onSubmit={submit}
          disabled={false}
          capabilities={capabilities}
        />
        <button type="button" onClick={() => ref.current?.openActions()}>
          Actions
        </button>
      </>
    );
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("listbox", { name: "Available Agent actions" });
    expect(screen.queryByRole("group", { name: "Create" })).toBeNull();
    expect(screen.getByRole("group", { name: "Explore" })).toBeVisible();
    expect(input).toHaveTextContent("Please help");
    expect(change).not.toHaveBeenCalled();
    expect(screen.queryByRole("option", { name: /Create a game/ })).toBeNull();
    fireEvent.click(
      screen.getByRole("option", { name: /Find courts near me/ })
    );
    await waitFor(() => expect(change).toHaveBeenCalled());
    expect(input).toHaveTextContent("Please help");
    expect(input).toHaveTextContent("Find courts near me.");
    expect(submit).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("groups options while keyboard navigation skips section labels", async () => {
    render(
      <AgentComposerEditor
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        disabled={false}
        capabilities={{ ...capabilities, allowGameCreation: true }}
      />
    );
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    paste(input, "/");
    const create = await screen.findByRole("group", { name: "Create" });
    const explore = screen.getByRole("group", { name: "Explore" });
    expect(
      within(create).getByRole("option", { name: /Create a game/ })
    ).toBeVisible();
    for (const _option of within(create).getAllByRole("option")) {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    }
    expect(within(explore).getAllByRole("option")[0]).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
  it("delegates creation while retaining text outside the slash command", async () => {
    const create = vi.fn();
    const submit = vi.fn();
    render(
      <AgentComposerEditor
        value=""
        onChange={vi.fn()}
        onSubmit={submit}
        disabled={false}
        capabilities={{ ...capabilities, allowGameCreation: true }}
        onCreate={create}
      />
    );
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    paste(input, "Keep this idea /create");
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(create).toHaveBeenCalledWith("game");
    expect(input).toHaveTextContent("Keep this idea");
    expect(input).not.toHaveTextContent("/create");
    expect(submit).not.toHaveBeenCalled();
  });
  it("recognizes a slash query at a word boundary, preserving URLs and paths", () => {
    expect(slashQuery("/")).toBe("");
    expect(slashQuery("Help me /court")).toBe("court");
    expect(slashQuery("/create game")).toBe("create game");
    expect(slashQuery("https://relay.test/agent")).toBeNull();
    expect(slashQuery("games/history")).toBeNull();
    expect(slashQuery("ordinary text")).toBeNull();
  });
  it("filters the shared catalog and respects disabled creation flags", () => {
    expect(
      matchingSlashCommands(capabilities, "").some(
        (item) => item.category === "Create"
      )
    ).toBe(false);
    expect(
      matchingSlashCommands(capabilities, "court").map((item) => item.label)
    ).toEqual(["Find courts near me"]);
    expect(
      matchingSlashCommands(
        { ...capabilities, allowGameCreation: true },
        "create game"
      ).map((item) => item.label)
    ).toContain("Create a game");
  });
  it("inserts a selected prompt without sending and preserves preceding text", async () => {
    const change = vi.fn();
    const submit = vi.fn();
    render(
      <AgentComposerEditor
        value=""
        onChange={change}
        onSubmit={submit}
        disabled={false}
        capabilities={capabilities}
      />
    );
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    paste(input, "Please help: /court");
    await screen.findByRole("listbox", { name: "Available Agent actions" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(change).toHaveBeenLastCalledWith(
        "Please help: Find courts near me."
      )
    );
    expect(submit).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("moves the highlight with arrows and closes with Escape without changing the draft", async () => {
    const change = vi.fn();
    const menuChange = vi.fn();
    render(
      <AgentComposerEditor
        value=""
        onChange={change}
        onSubmit={vi.fn()}
        disabled={false}
        capabilities={capabilities}
        onActionsOpenChange={menuChange}
      />
    );
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    paste(input, "/");
    await screen.findByRole("listbox");
    expect(menuChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute(
      "aria-selected",
      "true"
    );
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(menuChange).toHaveBeenLastCalledWith(false);
    expect(change).toHaveBeenLastCalledWith("/");
  });
  it("offers an empty result instead of sending an unmatched command", async () => {
    const submit = vi.fn();
    render(
      <AgentComposerEditor
        value=""
        onChange={vi.fn()}
        onSubmit={submit}
        disabled={false}
        capabilities={capabilities}
      />
    );
    const input = await screen.findByRole("textbox", { name: "Message Agent" });
    paste(input, "/unavailable");
    expect(await screen.findByText("No available actions match")).toBeVisible();
    expect(screen.getByText("Try another word or press Escape.")).toBeVisible();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByRole("listbox")).not.toHaveTextContent(
      "No available actions match"
    );
    fireEvent.keyDown(input, { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
  });
});
