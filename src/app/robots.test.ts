import { describe, expect, it, vi } from "vitest";

import robots from "./robots";

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://relay.example" }),
}));

describe("robots", () => {
  it("allows public discovery routes and blocks private product surfaces", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(result.host).toBe("https://relay.example");
    expect(result.sitemap).toBe("https://relay.example/sitemap.xml");
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toEqual(expect.arrayContaining(["/admin/", "/games/", "/groups/", "/s/"]));
    expect(rules?.disallow).not.toEqual(expect.arrayContaining(["/courts", "/play"]));
  });
});
