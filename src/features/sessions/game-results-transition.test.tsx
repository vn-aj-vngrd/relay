import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  GameResults,
  GameResultsTransition,
  useGameResultsTransition,
} from "./game-results-transition";

vi.mock("./game-view-menu", () => ({ useGameViewMode: () => "list" }));
afterEach(cleanup);

it("shows result skeletons during navigation while keeping controls available", async () => {
  let finish: () => void = () => undefined;
  const navigation = new Promise<void>((resolve) => {
    finish = resolve;
  });
  function Filters() {
    const [, startTransition] = useGameResultsTransition();
    return (
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await navigation;
          })
        }
      >
        Change filters
      </button>
    );
  }
  render(
    <GameResultsTransition>
      <Filters />
      <GameResults>
        <p>Existing games</p>
      </GameResults>
    </GameResultsTransition>
  );
  fireEvent.click(screen.getByRole("button", { name: "Change filters" }));
  expect(screen.getByTestId("game-results-skeleton")).toBeVisible();
  expect(screen.getByText("Existing games")).not.toBeVisible();
  expect(screen.getByRole("button", { name: "Change filters" })).toBeVisible();
  expect(screen.queryByText("Updating games…")).not.toBeInTheDocument();
  await act(async () => {
    finish();
    await navigation;
  });
  expect(screen.queryByTestId("game-results-skeleton")).not.toBeInTheDocument();
  expect(screen.getByText("Existing games")).toBeVisible();
});
