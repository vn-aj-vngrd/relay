import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { PublicQuickPlay } from "./public-quick-play";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

function namePlayers(names = ["Van", "AJ", "Mika", "John"]) {
  names.forEach((name, index) => {
    fireEvent.change(
      screen.getByRole("textbox", { name: `Player ${index + 1}` }),
      { target: { value: name } }
    );
  });
}

function openOptions() {
  fireEvent.click(
    screen.getByRole("button", { name: "Continue to game options" })
  );
}

function startFromOptions() {
  fireEvent.click(screen.getByRole("button", { name: "Review setup" }));
  fireEvent.click(screen.getByRole("button", { name: "Start Play" }));
}

function startDefaultGame() {
  namePlayers();
  openOptions();
  startFromOptions();
}

describe("PublicQuickPlay", () => {
  it("guides setup through Players, Game options, and Review", () => {
    render(<PublicQuickPlay />);
    expect(
      screen.getByRole("navigation", { name: "Quick Play setup progress" })
    ).toHaveTextContent("Step 1 of 31Players2Game options3Review");
    expect(screen.getByRole("link", { name: /Create game/ })).toHaveAttribute(
      "href",
      "/games/new"
    );
    namePlayers();
    openOptions();
    expect(
      screen.getByRole("heading", { name: "Choose how this game runs" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Review setup" }));
    expect(screen.getByText("This device only")).toBeVisible();
    expect(
      screen.getByText(/cannot be shared or moved into account history/)
    ).toBeVisible();
  });

  it("runs a scored match, records standings, and corrects the result", () => {
    render(<PublicQuickPlay />);
    startDefaultGame();
    expect(
      screen.getByText("Paddle Stack · scores and rotations stay on this page")
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: /Add a point to Van \+ AJ/ })
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish match" }));
    const finishDialog = screen.getByRole("dialog", {
      name: "Finish Court 1 at 1–0?",
    });
    fireEvent.click(
      within(finishDialog).getByRole("button", { name: "Finish match" })
    );

    fireEvent.click(screen.getByRole("button", { name: "Results" }));
    expect(screen.getByRole("heading", { name: "Standings" })).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Correct Court 1 score" })
    );
    const correctionDialog = screen.getByRole("dialog", {
      name: "Correct Court 1 score",
    });
    fireEvent.change(within(correctionDialog).getByLabelText("Van + AJ"), {
      target: { value: "0" },
    });
    fireEvent.change(within(correctionDialog).getByLabelText("Mika + John"), {
      target: { value: "2" },
    });
    fireEvent.click(
      within(correctionDialog).getByRole("button", {
        name: "Save correction",
      })
    );
    expect(
      within(
        screen.getByRole("region", { name: "Completed matches" })
      ).getByText("2")
    ).toBeVisible();
  });

  it("protects an active session from being discarded", () => {
    render(<PublicQuickPlay />);
    startDefaultGame();
    expect(
      screen.getByRole("button", { name: "End Quick Play" })
    ).toBeDisabled();
    expect(
      screen.getByText("Finish or cancel active matches before ending.")
    ).toBeVisible();
  });

  it("restores the active session and score after a browser reload", () => {
    const view = render(<PublicQuickPlay />);
    startDefaultGame();
    fireEvent.click(
      screen.getByRole("button", { name: /Add a point to Van \+ AJ/ })
    );
    expect(localStorage.getItem("relay-quick-play-session")).toContain(
      '"scores":[1,0]'
    );
    view.unmount();
    render(<PublicQuickPlay />);
    expect(screen.getByLabelText("Van + AJ score 1")).toHaveTextContent("1");
  });

  it("opens a full-screen scoreboard and switches between courts", () => {
    render(<PublicQuickPlay />);
    for (let index = 0; index < 4; index += 1)
      fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    namePlayers(Array.from({ length: 8 }, (_, index) => `Player ${index + 1}`));
    openOptions();
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Active courts" }),
      { target: { value: "2" } }
    );
    startFromOptions();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Open full-screen scoreboard" })[0]
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Next court, Court 2" })
    );
    expect(
      screen.getByRole("dialog", { name: "Court 2 full-screen scoreboard" })
    ).toHaveAttribute("open");
  });

  it("requires a unique name for every player before game options", () => {
    render(<PublicQuickPlay />);
    namePlayers(["Van", "van", "Mika", ""]);
    openOptions();
    expect(screen.getAllByText("Use a unique player name.")).toHaveLength(2);
    expect(screen.getByText("Enter a player name.")).toBeVisible();
    expect(screen.getByLabelText("Player 1")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(
      screen.queryByRole("heading", { name: "Choose how this game runs" })
    ).not.toBeInTheDocument();
  });

  it("offers every saved-game Play mode and Relay listboxes", () => {
    const { container } = render(<PublicQuickPlay />);
    namePlayers();
    openOptions();
    expect(screen.getByRole("radio", { name: /Paddle Stack/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Mix It Up/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Balanced Mix/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Court Climb/ })).toBeEnabled();
    expect(
      screen.getByRole("radio", { name: /Team Round Robin/ })
    ).toBeEnabled();
    expect(container.querySelector("select")).not.toBeInTheDocument();
  });

  it("collects experience and a timer for round modes", () => {
    render(<PublicQuickPlay />);
    namePlayers();
    openOptions();
    fireEvent.click(screen.getByRole("radio", { name: /Balanced Mix/ }));
    for (const name of ["Van", "AJ", "Mika", "John"]) {
      expect(
        screen.getByRole("button", { name: `${name} — experience` })
      ).toBeVisible();
    }
    fireEvent.click(screen.getByRole("button", { name: "Round timer" }));
    fireEvent.click(screen.getByRole("option", { name: "10 minutes" }));
    startFromOptions();
    expect(screen.getByText("10:00")).toBeVisible();
  });

  it("bounds court count and explains missing players", () => {
    render(<PublicQuickPlay />);
    namePlayers();
    openOptions();
    const courts = screen.getByRole("spinbutton", { name: "Active courts" });
    expect(courts).toHaveAttribute("min", "1");
    expect(courts).toHaveAttribute("max", "6");
    fireEvent.change(courts, { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Review setup" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add 8 more players before reviewing."
    );
  });

  it("closes courts and reorders the local waiting queue", () => {
    render(<PublicQuickPlay />);
    for (let index = 0; index < 4; index += 1)
      fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    namePlayers(Array.from({ length: 8 }, (_, index) => `Player ${index + 1}`));
    openOptions();
    startFromOptions();

    fireEvent.click(screen.getByText("Manage courts"));
    fireEvent.click(screen.getByRole("button", { name: "Close Court 1" }));
    expect(screen.getByText("Closing after match")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^Queue,/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Move to top: Player 8" })
    );
    expect(
      within(screen.getByRole("region", { name: "Paddle stack" })).getAllByRole(
        "listitem"
      )[0]
    ).toHaveTextContent("Player 8");
  });

  it("restores an unfinished setup at its selected step", () => {
    const view = render(<PublicQuickPlay />);
    namePlayers();
    openOptions();
    fireEvent.click(screen.getByRole("radio", { name: /Balanced Mix/ }));
    fireEvent.click(screen.getByRole("button", { name: "Van — experience" }));
    fireEvent.click(screen.getByRole("option", { name: /Experienced/ }));
    view.unmount();
    render(<PublicQuickPlay />);
    expect(
      screen.getByRole("heading", { name: "Choose how this game runs" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Van — experience" })
    ).toHaveTextContent("Experienced");
    fireEvent.click(screen.getByRole("button", { name: "Review setup" }));
    expect(
      within(
        screen.getByRole("region", { name: "Review Quick Play" })
      ).getByText("Experienced")
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit players" }));
    expect(screen.getByRole("textbox", { name: "Player 1" })).toHaveValue(
      "Van"
    );
  });

  it("ends into a persistent recap and only clears it after a separate confirmation", () => {
    const view = render(<PublicQuickPlay />);
    startDefaultGame();
    fireEvent.click(screen.getByRole("button", { name: /Add a point to Van/ }));
    fireEvent.click(screen.getByRole("button", { name: "Finish match" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Finish Court 1 at 1–0?" })
      ).getByRole("button", { name: "Finish match" })
    );
    fireEvent.click(screen.getByRole("button", { name: "End Quick Play" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "End this Quick Play session?" })
      ).getByRole("button", { name: "End Play" })
    );
    expect(
      screen.getByRole("heading", { name: "Quick Play recap" })
    ).toBeVisible();
    view.unmount();
    render(<PublicQuickPlay />);
    expect(
      screen.getByRole("heading", { name: "Quick Play recap" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Completed matches" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Start next match" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Start a new Quick Play session?" })
      ).getByRole("button", { name: "Keep recap" })
    );
    expect(
      screen.getByRole("heading", { name: "Quick Play recap" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Start a new Quick Play session?" })
      ).getByRole("button", { name: "Start new session" })
    );
    expect(screen.getByRole("textbox", { name: "Player 1" })).toHaveValue("");
    expect(localStorage.getItem("relay-quick-play-session")).toBeNull();
  });

  it("keeps scoring usable and warns when browser storage fails", () => {
    const view = render(<PublicQuickPlay />);
    startDefaultGame();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    fireEvent.click(screen.getByRole("button", { name: /Add a point to Van/ }));
    expect(screen.getByLabelText("Van + AJ score 1")).toHaveTextContent("1");
    expect(
      screen.getByText(/This browser couldn’t save or restore Quick Play/)
    ).toBeVisible();
    view.unmount();
  });

  it("explains when a corrupt saved session cannot be restored", () => {
    localStorage.setItem("relay-quick-play-session", "not-json");
    render(<PublicQuickPlay />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "The saved Quick Play session could not be restored"
    );
  });
});
