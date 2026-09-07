import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DomTooltips } from "./dom-tooltips";

function Fixture() {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef} data-testid="map">
      <DomTooltips rootRef={rootRef} />
    </div>
  );
}
afterEach(cleanup);

describe("DomTooltips", () => {
  it("adapts dynamic map controls and label changes without a second tooltip implementation", async () => {
    render(<Fixture />);
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Zoom in");
    button.title = "Zoom in";
    await act(async () => {
      screen.getByTestId("map").append(button);
    });
    await waitFor(() => expect(button).not.toHaveAttribute("title"));
    fireEvent.focus(button);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Zoom in");
    expect(screen.getByRole("tooltip").firstElementChild).toHaveClass(
      "relay-tooltip"
    );
    act(() => {
      button.title = "Zoom closer";
    });
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent("Zoom closer")
    );
    expect(button).toHaveAttribute("aria-label", "Zoom in");
    act(() => button.remove());
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    );
  });
});
