import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ActionNotice } from "./action-notice";

afterEach(() => {
  for (const button of screen.queryAllByRole("button", {
    name: "Dismiss notification",
  }))
    fireEvent.click(button);
  cleanup();
  vi.useRealTimers();
});
it("announces a result once per response, including repeated identical saves", () => {
  const response = {};
  const view = render(
    <ActionNotice message="Saved" response={response} variant="success" />
  );
  expect(screen.getAllByRole("status")).toHaveLength(1);
  view.rerender(
    <ActionNotice message="Saved" response={response} variant="success" />
  );
  expect(screen.getAllByRole("status")).toHaveLength(1);
  view.rerender(
    <ActionNotice message="Saved" response={{}} variant="success" />
  );
  expect(screen.getAllByRole("status")).toHaveLength(2);
});
it("pauses successful notification dismissal while focused and keeps errors until dismissed", () => {
  vi.useFakeTimers();
  render(
    <>
      <ActionNotice message="Saved" variant="success" />
      <ActionNotice message="Try again" />
    </>
  );
  fireEvent.focus(
    screen.getAllByRole("button", { name: "Dismiss notification" })[0]
  );
  act(() => vi.advanceTimersByTime(9000));
  expect(screen.getByRole("status")).toHaveTextContent("Saved");
  fireEvent.blur(
    screen.getAllByRole("button", { name: "Dismiss notification" })[0]
  );
  act(() => vi.advanceTimersByTime(8000));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Try again");
});
