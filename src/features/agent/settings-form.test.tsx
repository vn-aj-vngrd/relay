import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  saveAgentSettings: vi.fn(async () => ({ success: "Agent settings saved." })),
}));

import { AgentSettingsForm } from "./settings-form";
import { defaultAgentConfig } from "./validation";

it("keeps a stored key out of unrelated settings submissions and uses switches for capabilities", () => {
  const { container } = render(
    <AgentSettingsForm
      config={defaultAgentConfig}
      hasKey
      storageReady
      models={[]}
    />
  );
  expect(screen.queryByLabelText("API key")).not.toBeInTheDocument();
  expect(
    screen.getByRole("switch", { name: "Enable Agent" })
  ).not.toBeChecked();
  expect(
    screen.getByRole("checkbox", { name: "Remove stored API key" })
  ).not.toBeChecked();
  const form = container.querySelector("form");
  if (!form) throw new Error("Missing settings form");
  expect(new FormData(form).get("keepKey")).toBe("on");
  fireEvent.click(screen.getByRole("button", { name: "Replace API key" }));
  expect(screen.getByLabelText("API key")).toHaveAttribute("type", "password");
  expect(new FormData(form).get("keepKey")).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Keep stored key" }));
  expect(new FormData(form).has("apiKey")).toBe(false);
});
