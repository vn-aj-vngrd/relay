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
import {
  endQuickPlay,
  finishQuickPlayMatch,
  quickPlayPreviousKey,
  quickPlayStorageKey,
  scoreQuickPlayMatch,
  serializeQuickPlaySession,
  startQuickPlay,
} from "./quick-play-session";

function storeEndedSession() {
  let session = startQuickPlay({
    players: ["Van", "AJ", "Mika", "John"].map((name) => ({
      id: name,
      name,
      experience: 2,
    })),
    courtCount: 1,
    mode: "queue",
    queueRule: "four_off",
    fixedPairs: [],
    roundDurationMinutes: null,
  });
  session = scoreQuickPlayMatch(session, session.activeMatches[0].id, 0, 1);
  session = finishQuickPlayMatch(session, session.activeMatches[0].id);
  session = endQuickPlay(session);
  localStorage.setItem(quickPlayStorageKey, serializeQuickPlaySession(session));
  return session;
}

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
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
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
  it("adds pasted names for review and reports duplicates without losing entered players", () => {
    render(<PublicQuickPlay />);
    fireEvent.change(screen.getByRole("textbox", { name: "Player 1" }), {
      target: { value: "Van" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Paste names" }));
    const input = screen.getByRole("textbox", { name: "Names, one per line" });
    fireEvent.change(input, { target: { value: "van\nAna" } });
    fireEvent.click(screen.getByRole("button", { name: "Add names" }));
    expect(screen.getByRole("alert")).toHaveTextContent("unique name");
    expect(screen.getByRole("textbox", { name: "Player 1" })).toHaveValue(
      "Van"
    );
    fireEvent.change(input, { target: { value: "Ana\nBen\nCarlo\nDana" } });
    fireEvent.click(screen.getByRole("button", { name: "Add names" }));
    expect(screen.getByRole("textbox", { name: "Player 5" })).toHaveValue(
      "Dana"
    );
    openOptions();
    expect(
      screen.getByRole("heading", { name: "Choose how this game runs" })
    ).toBeVisible();
  });

  it("adds a late arrival from Players and keeps the court score", () => {
    render(<PublicQuickPlay />);
    startDefaultGame();
    fireEvent.click(
      screen.getByRole("button", { name: "Add a point to Van + AJ" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Players (4)" }));
    const drawer = screen.getByRole("dialog", { name: "Players (4)" });
    fireEvent.change(
      within(drawer).getByRole("textbox", { name: "Add a player" }),
      { target: { value: "Ana" } }
    );
    fireEvent.click(within(drawer).getByRole("button", { name: "Add player" }));
    expect(within(drawer).getByRole("status")).toHaveTextContent(
      "Ana joined the end"
    );
    fireEvent.click(
      within(drawer).getByRole("button", { name: "Close players" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Queue" }));
    expect(
      screen.getByRole("region", { name: "Paddle stack" })
    ).toHaveTextContent("Ana");
    expect(
      screen.getByRole("region", { name: "Active rotation rules" })
    ).toBeVisible();
    const stored = JSON.parse(
      localStorage.getItem(quickPlayStorageKey) ?? "{}"
    );
    expect(stored.session.activeMatches[0].scores).toEqual([1, 0]);
  });

  it("reuses the crew and preserves a read-only previous recap across reloads", () => {
    const ended = storeEndedSession();
    const view = render(<PublicQuickPlay />);
    fireEvent.click(
      screen.getByRole("button", { name: "Play again with these players" })
    );
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Play again with these players?" })
      ).getByRole("button", { name: "Review players" })
    );
    expect(screen.getByRole("textbox", { name: "Player 1" })).toHaveValue(
      "Van"
    );
    expect(localStorage.getItem(quickPlayPreviousKey)).toBe(
      serializeQuickPlaySession(ended)
    );
    view.unmount();
    render(<PublicQuickPlay />);
    expect(screen.getByRole("textbox", { name: "Player 4" })).toHaveValue(
      "John"
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous recap" }));
    expect(
      screen.getByRole("heading", { name: "Quick Play recap" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Correct Court 1 score" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start new session" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to setup" }));
    openOptions();
    startFromOptions();
    expect(localStorage.getItem(quickPlayPreviousKey)).toBe(
      serializeQuickPlaySession(ended)
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous recap" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Back to current game" })
    );
    expect(screen.getByRole("button", { name: "Players (4)" })).toBeVisible();
  });

  it("keeps the current recap if archiving fails", () => {
    const ended = storeEndedSession();
    render(<PublicQuickPlay />);
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value
    ) {
      if (key === quickPlayPreviousKey) throw new Error("Storage full");
      setItem.call(this, key, value);
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Play again with these players" })
    );
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Play again with these players?" })
      ).getByRole("button", { name: "Review players" })
    );
    expect(
      screen.getByRole("heading", { name: "Quick Play recap" })
    ).toBeVisible();
    expect(screen.getByText(/This browser couldn’t save/)).toBeVisible();
    expect(localStorage.getItem(quickPlayStorageKey)).toBe(
      serializeQuickPlaySession(ended)
    );
  });

  it("shows who should prepare and starts the teams displayed in Up next", () => {
    render(<PublicQuickPlay />);
    for (let index = 0; index < 4; index += 1)
      fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    namePlayers(["Van", "AJ", "Mika", "John", "Ana", "Ben", "Carlo", "Dana"]);
    openOptions();
    startFromOptions();
    let next = within(screen.getByRole("region", { name: "Up next" }));
    expect(next.getByText("Ana + Ben")).toBeVisible();
    expect(next.getByText("Carlo + Dana")).toBeVisible();
    expect(next.getByText("Next available court")).toBeVisible();
    expect(next.queryByRole("button")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Add a point to Van + AJ" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish match" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Finish Court 1 at 1–0?" })
      ).getByRole("button", { name: "Finish match" })
    );
    next = within(screen.getByRole("region", { name: "Up next" }));
    expect(next.getByText("Ana + Ben")).toBeVisible();
    expect(next.getByText("Carlo + Dana")).toBeVisible();
    fireEvent.click(next.getByRole("button", { name: "Start next match" }));
    expect(
      screen.getByRole("button", { name: "Add a point to Ana + Ben" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Add a point to Carlo + Dana" })
    ).toBeVisible();
  });

  it("lets players rest after a match and rejoin through the Players drawer", () => {
    render(<PublicQuickPlay />);
    startDefaultGame();
    fireEvent.click(screen.getByRole("button", { name: "Players (4)" }));
    const drawer = screen.getByRole("dialog", { name: "Players (4)" });
    fireEvent.click(
      within(drawer).getByRole("button", {
        name: "Take a break after this match for Van",
      })
    );
    expect(
      within(drawer).getByText("Taking a break after this match")
    ).toBeVisible();
    fireEvent.click(
      within(drawer).getByRole("button", { name: "Close players" })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add a point to Van + AJ" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish match" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Finish Court 1 at 1–0?" })
      ).getByRole("button", { name: "Finish match" })
    );
    expect(
      screen.queryByRole("button", { name: "Start next match" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Players (4)" }));
    fireEvent.click(
      within(drawer).getByRole("button", {
        name: "Rejoin queue for Van",
      })
    );
    fireEvent.click(
      within(drawer).getByRole("button", { name: "Close players" })
    );
    expect(
      screen.getByRole("button", { name: "Start next match" })
    ).toBeVisible();
  });

  it("guides setup through Players, Game options, and Review", () => {
    render(<PublicQuickPlay />);
    expect(
      screen.getByRole("navigation", { name: "Quick Play setup progress" })
    ).toHaveTextContent("Step 1 of 31Players2Game options3Review");
    expect(screen.getByRole("link", { name: /Create game/ })).toHaveAttribute(
      "href",
      "/games/new"
    );
    const helper = screen.getByText("Quick Play stays on this device.");
    expect(helper).toBeVisible();
    expect(helper.parentElement).toContainElement(
      screen.getByRole("button", { name: "Continue" })
    );
    expect(helper.parentElement).toContainElement(
      screen.getByRole("link", { name: /Create game/ })
    );
    namePlayers();
    openOptions();
    expect(
      screen.queryByText("Quick Play stays on this device.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Choose how this game runs" })
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Create game/ })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review setup" }));
    expect(screen.getByText("This device only")).toBeVisible();
    expect(
      screen.getByText(/cannot be shared or moved into account history/)
    ).toBeVisible();
  });

  it("runs a scored match, records standings, and corrects the result", () => {
    render(<PublicQuickPlay />);
    startDefaultGame();
    expect(screen.getByText("Play in progress")).toBeVisible();

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

    fireEvent.click(screen.getByRole("button", { name: "Standings" }));
    expect(
      screen.getByRole("heading", { name: "Session Standings" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Results" }));
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
      screen.queryByRole("button", { name: "End session" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    expect(screen.getByRole("button", { name: "End session" })).toBeDisabled();
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

  it("keeps a valid neighboring player clear when Player 4 has a duplicate name", () => {
    render(<PublicQuickPlay />);
    namePlayers(["Alex", "Bea", "Casey", "Alex"]);
    openOptions();
    const player3 = screen.getByRole("textbox", { name: "Player 3" });
    const player4 = screen.getByRole("textbox", { name: "Player 4" });
    expect(player3).toHaveAttribute("aria-invalid", "false");
    expect(player3).not.toHaveAttribute("aria-describedby");
    expect(player4).toHaveAttribute("aria-invalid", "true");
    expect(player4).toHaveAccessibleDescription("Use a unique player name.");
    expect(player3).toHaveValue("Casey");
    fireEvent.change(player4, { target: { value: "Drew" } });
    openOptions();
    expect(
      screen.getByRole("heading", { name: "Choose how this game runs" })
    ).toBeVisible();
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

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.click(screen.getByRole("button", { name: "Close Court 1" }));
    expect(screen.getByText("Closing after this match")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Queue" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "End this session?" })
      ).getByRole("button", { name: "End session" })
    );
    expect(
      screen.getByRole("heading", { name: "Quick Play recap" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Session highlights" })
    ).toBeVisible();
    expect(screen.getByText("Pair that clicked")).toBeVisible();
    expect(screen.getByText("Closest finish")).toBeVisible();
    expect(screen.getByText("1–0")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Recap summary" })
    ).toHaveTextContent("1match1points played");
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
    fireEvent.click(
      screen.getByRole("button", { name: "Correct Court 1 score" })
    );
    const correction = screen.getByRole("dialog", {
      name: "Correct Court 1 score",
    });
    fireEvent.change(within(correction).getByLabelText("Van + AJ"), {
      target: { value: "0" },
    });
    fireEvent.change(within(correction).getByLabelText("Mika + John"), {
      target: { value: "2" },
    });
    fireEvent.click(
      within(correction).getByRole("button", { name: "Save correction" })
    );
    expect(
      screen.getByRole("region", { name: "Recap summary" })
    ).toHaveTextContent("2points played");
    expect(
      within(
        screen.getByRole("region", { name: "Session highlights" })
      ).getByText("0–2")
    ).toBeVisible();
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

  it("ends a cancelled game with an honest empty recap", () => {
    render(<PublicQuickPlay />);
    startDefaultGame();
    expect(
      screen.queryByRole("button", { name: "Cancel Court 1" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel Court 1" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Cancel Court 1?" })).getByRole(
        "button",
        { name: "Cancel match" }
      )
    );
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "End this session?" })
      ).getByRole("button", { name: "End session" })
    );
    expect(
      screen.getByRole("region", { name: "Recap summary" })
    ).toHaveTextContent("0matches");
    expect(
      screen.queryByRole("heading", { name: "Session highlights" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Manage" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start new session" })
    ).toBeVisible();
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
