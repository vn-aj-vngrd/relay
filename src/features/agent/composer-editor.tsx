"use client";

import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { notify } from "@/components/ui/action-notice";
import styles from "./answer.module.css";
import type { AgentCapabilities } from "./capabilities";
import { agentMessageMaxLength } from "./constants";
import type { CreationFlow } from "./creation-form-model";
import { useAgentSlashCommands } from "./slash-commands";

export type AgentComposerHandle = {
  focus: () => void;
  openActions: () => void;
};
export function AgentComposerEditor({
  value,
  onChange,
  onSubmit,
  disabled,
  capabilities,
  onCreate,
  onActionsOpenChange,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled: boolean;
  capabilities?: AgentCapabilities;
  onCreate?: (flow: CreationFlow) => void;
  onActionsOpenChange?: (open: boolean) => void;
  ref?: Ref<AgentComposerHandle>;
}) {
  const callbacks = useRef({ onChange, onSubmit });
  callbacks.current = { onChange, onSubmit };
  const accepted = useRef(value);
  const slashKeys = useRef<((event: KeyboardEvent) => boolean) | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    editable: !disabled,
    editorProps: {
      attributes: {
        id: "agent-message",
        role: "textbox",
        "aria-label": "Message Agent",
        "aria-multiline": "true",
        "data-placeholder": "Ask Agent…",
        class: `agent-composer-input agent-rich-composer ${styles.markdown} min-h-12 max-h-48 overflow-y-auto outline-none`,
      },
      handleKeyDown: (view, event) => {
        if (slashKeys.current?.(event)) return true;
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing &&
          !view.composing &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          event.preventDefault();
          callbacks.current.onSubmit(accepted.current);
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const instance = editorRef.current;
        if (!instance?.isEditable) return true;
        event.preventDefault();
        // Only clipboard text enters the editor. Never insert clipboard HTML or files.
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const selected = instance.state.doc.textBetween(
          instance.state.selection.from,
          instance.state.selection.to,
          "\n"
        );
        const room = Math.max(
          0,
          agentMessageMaxLength -
            instance.getMarkdown().length +
            selected.length
        );
        const clipped = text.slice(0, room);
        if (clipped !== text)
          notify(
            "Messages can contain up to 4,000 characters. Extra text was removed; review your message before sending."
          );
        if (clipped)
          instance.commands.insertContent(clipped, { contentType: "markdown" });
        return true;
      },
      handleDrop: () => true,
    },
    onUpdate: ({ editor: instance }) => {
      const markdown = instance.isEmpty ? "" : instance.getMarkdown();
      if (markdown === accepted.current) return;
      if (markdown.length > agentMessageMaxLength) {
        instance.commands.setContent(accepted.current, {
          contentType: "markdown",
          emitUpdate: false,
        });
        notify(
          "Messages can contain up to 4,000 characters. Shorten your message before adding more text or formatting."
        );
        return;
      }
      accepted.current = markdown;
      callbacks.current.onChange(markdown);
    },
  });
  const slash = useAgentSlashCommands(editor, capabilities, disabled, onCreate);
  slashKeys.current = slash.keyDown;
  useEffect(() => {
    onActionsOpenChange?.(slash.isOpen);
  }, [slash.isOpen, onActionsOpenChange]);
  const editorRef = useRef(editor);
  editorRef.current = editor;
  useImperativeHandle(
    ref,
    () => ({
      openActions: slash.open,
      focus: () => {
        editor?.commands.focus();
      },
    }),
    [editor, slash.open]
  );
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (!editor || value === accepted.current) return;
    accepted.current = value;
    editor.commands.setContent(value, {
      contentType: "markdown",
      emitUpdate: false,
    });
  }, [editor, value]);
  return (
    <div className="relative">
      {slash.popup}
      <EditorContent
        editor={editor}
        className={disabled ? "opacity-50" : undefined}
      />
    </div>
  );
}
