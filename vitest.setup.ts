import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, vi } from "vitest";
import { ToastViewport } from "./src/components/ui/action-notice";

vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: vi.fn(async () => undefined),
}));

// Match the root layout: action results are rendered in the shared toast host.
beforeEach(() => render(createElement(ToastViewport)));
afterEach(() => {
  for (const button of screen.queryAllByRole("button", {
    name: "Dismiss notification",
  }))
    fireEvent.click(button);
  cleanup();
});
