import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  courts: vi.fn(),
  court: vi.fn(),
  search: vi.fn(),
  game: vi.fn(),
  groups: vi.fn(),
}));
vi.mock("./reads", () => ({
  searchAgentGames: mocks.search,
  readAgentGame: mocks.game,
  readAgentGroups: mocks.groups,
}));

vi.mock("./courts", () => ({
  searchAgentCourts: mocks.courts,
  readAgentCourt: mocks.court,
}));

import { createAgentTools } from "./tools";
import { defaultAgentConfig } from "./validation";

describe("Agent read-only registry", () => {
  it("passes named-place searches to the court service", async () => {
    const tools = createAgentTools(
      "user",
      defaultAgentConfig,
      new AbortController().signal
    );
    const input = { query: "Cebu City", nearMe: false, offset: 0 };
    await tools.searchCourts.execute!(input, {
      toolCallId: "court",
      messages: [],
      context: {},
    });
    expect(mocks.courts).toHaveBeenCalledWith(input);
    expect(
      createAgentTools(
        "user",
        { ...defaultAgentConfig, allowCourtSearch: false },
        new AbortController().signal
      )
    ).not.toHaveProperty("searchCourts");
  });
  it("exposes only read tools and honors disabled capabilities", () => {
    expect(
      Object.keys(
        createAgentTools(
          "user",
          defaultAgentConfig,
          new AbortController().signal
        )
      )
    ).toEqual([
      "searchGames",
      "gameDetails",
      "myGroups",
      "searchCourts",
      "courtDetails",
      "helpIndex",
      "searchHelp",
      "readHelp",
    ]);
    expect(
      createAgentTools(
        "user",
        {
          ...defaultAgentConfig,
          allowGameData: false,
          allowHelp: false,
          allowCourtSearch: false,
        },
        new AbortController().signal
      )
    ).toEqual({});
  });
  it("binds identity on the server and sanitizes read errors", async () => {
    mocks.game.mockRejectedValue(new Error("DATABASE_PASSWORD=secret"));
    const tools = createAgentTools(
      "server-user",
      defaultAgentConfig,
      new AbortController().signal
    );
    const result = await tools.gameDetails.execute!(
      { id: "game-id", userId: "victim" },
      { toolCallId: "test", messages: [], context: {} }
    );
    expect(mocks.game).toHaveBeenCalledWith("server-user", "game-id");
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(result).toHaveProperty("unavailable", true);
  });
  it("caps concurrent model tool calls at twelve authorized reads", async () => {
    mocks.game.mockReset().mockResolvedValue({ id: "game" });
    const tools = createAgentTools(
      "server-user",
      defaultAgentConfig,
      new AbortController().signal
    );
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        tools.gameDetails.execute!(
          { id: "game" },
          { toolCallId: String(index), messages: [], context: {} }
        )
      )
    );
    expect(mocks.game).toHaveBeenCalledTimes(12);
    expect(mocks.game).toHaveBeenCalledWith("server-user", "game");
    expect(results.slice(12)).toEqual(
      Array.from({ length: 8 }, () => ({
        unavailable: true,
        reason: "Read limit reached. Narrow the question.",
      }))
    );
  });
  it("does no data reads after cancellation", async () => {
    mocks.game.mockClear();
    const controller = new AbortController();
    controller.abort();
    const tools = createAgentTools(
      "user",
      defaultAgentConfig,
      controller.signal
    );
    await tools.gameDetails.execute!(
      { id: "game" },
      { toolCallId: "test", messages: [], context: {} }
    );
    expect(mocks.game).not.toHaveBeenCalled();
  });
});

it("exposes preparation only when enabled and tied to a persisted conversation", () => {
  const signal = new AbortController().signal;
  const context = {
    conversationId: "chat",
    messageId: "message",
    requestId: "request",
  };
  expect(
    createAgentTools("user", defaultAgentConfig, signal, context)
      .prepareCreation
  ).toBeUndefined();
  const config = { ...defaultAgentConfig, allowGameCreation: true };
  expect(
    createAgentTools("user", config, signal).prepareCreation
  ).toBeUndefined();
  const tools = createAgentTools("user", config, signal, context);
  expect(tools.prepareCreation).toBeDefined();
  expect(tools.creationStatus).toBeDefined();
  expect(tools.confirmCreation).toBeUndefined();
});
