import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  game: vi.fn(),
  groups: vi.fn(),
}));
vi.mock("./reads", () => ({
  searchAgentGames: mocks.search,
  readAgentGame: mocks.game,
  readAgentGroups: mocks.groups,
}));

import { createAgentTools } from "./tools";
import { defaultAgentConfig } from "./validation";

describe("Agent read-only registry", () => {
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
      "helpIndex",
      "searchHelp",
      "readHelp",
    ]);
    expect(
      createAgentTools(
        "user",
        { ...defaultAgentConfig, allowGameData: false, allowHelp: false },
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
