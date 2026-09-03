import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({ db: { execute: vi.fn() } }));

import { db } from "@/db/client";

import { GET } from "./route";

describe("health route", () => {
  it("returns a database-free liveness response", async () => {
    const response = await GET(new Request("https://relay.test/api/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
    expect(db.execute).not.toHaveBeenCalled();
  });

  it("keeps deep readiness checks private", async () => {
    vi.stubEnv(
      "HEALTHCHECK_SECRET",
      "a-secure-healthcheck-secret-at-least-32-chars"
    );
    const response = await GET(
      new Request("https://relay.test/api/health?deep=1")
    );
    expect(response.status).toBe(401);
    expect(db.execute).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
