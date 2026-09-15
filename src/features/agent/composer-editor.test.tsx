import { fireEvent, render, screen } from "@testing-library/react";
import { Markdown } from "@tiptap/markdown";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { expect, it, vi } from "vitest";
import { AgentComposerEditor } from "./composer-editor";

it("bolds selected text visually and serializes the formatting as Markdown", () => {
  const editor = new Editor({
    extensions: [StarterKit, Markdown],
    content: "Next game",
    contentType: "markdown",
  });
  try {
    editor.commands.setTextSelection({ from: 1, to: 5 });
    editor.commands.toggleBold();
    expect(editor.getHTML()).toContain("<strong>Next</strong>");
    expect(editor.getMarkdown()).toBe("**Next** game");
    editor.commands.toggleBold();
    expect(editor.getMarkdown()).toBe("Next game");
  } finally {
    editor.destroy();
  }
});
it("restores a formatted draft and submits Markdown on Enter", async () => {
  const submit = vi.fn();
  render(
    <AgentComposerEditor
      value="**Next** game"
      onChange={vi.fn()}
      onSubmit={submit}
      disabled={false}
    />
  );
  const input = await screen.findByRole("textbox", { name: "Message Agent" });
  expect(input.querySelector("strong")).toHaveTextContent("Next");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(submit).toHaveBeenCalledWith("**Next** game");
});
it("ignores clipboard HTML and never inserts images or scripts", async () => {
  render(
    <AgentComposerEditor
      value=""
      onChange={vi.fn()}
      onSubmit={vi.fn()}
      disabled={false}
    />
  );
  const input = await screen.findByRole("textbox", { name: "Message Agent" });
  fireEvent.paste(input, {
    clipboardData: {
      getData: (type: string) =>
        type === "text/plain"
          ? "**Safe**"
          : '<img src="bad" onerror="alert(1)">',
    },
  });
  expect(input.querySelector("strong")).toHaveTextContent("Safe");
  expect(input.querySelector("img,script")).toBeNull();
});
