import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const query = vi.hoisted(() => vi.fn());
vi.mock("@/db/client", () => ({
  db: { query: { agentSettings: { findFirst: query } } },
}));

import { getPublicAgentOffer } from "./public-offer";

describe("public Agent plan offer", () => {
  it("selects only public limits and availability", async () => {
    const values = {
      enabled: true,
      freeMessages: 50,
      plusMessages: 250,
      proMessages: 750,
    };
    query.mockResolvedValue(values);
    expect(await getPublicAgentOffer()).toEqual(values);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: {
          enabled: true,
          freeMessages: true,
          plusMessages: true,
          proMessages: true,
        },
      })
    );
  });
  it("does not advertise Agent as available if setup is missing", async () => {
    query.mockRejectedValue(new Error("missing migration"));
    expect(await getPublicAgentOffer()).toEqual({
      enabled: false,
      freeMessages: 50,
      plusMessages: 250,
      proMessages: 750,
    });
  });
});
