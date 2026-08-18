import { describe, expect, it } from "vitest";
import { sessionAccentStyle } from "./accent";

describe("sessionAccentStyle", () => {
  it("uses the selected game color for the cover and controls", () => {
    const style = sessionAccentStyle("coral") as Record<string, string>;

    expect(style["--session-cover"]).toContain("#bd4545");
    expect(style["--scoreboard-field"]).toContain("#bd4545");
    expect(style["--scoreboard-line"]).toContain("#bd4545");
    expect(style["--primary"]).toContain("#bd4545");
  });

  it("falls back to the default accent for unknown values", () => {
    const style = sessionAccentStyle("unknown") as Record<string, string>;

    expect(style["--session-cover"]).toContain("#635bde");
  });
});
