import { readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const transaction = Object.assign(
    vi.fn(async (parts: TemplateStringsArray) =>
      parts.join("").includes("INSERT INTO venues") ? [{ id: "venue-id" }] : []
    ),
    { array: vi.fn((values: string[]) => values) }
  );
  const sql = Object.assign(
    vi.fn(async () => []),
    {
      begin: vi.fn(async (run: (query: typeof transaction) => Promise<void>) =>
        run(transaction)
      ),
      end: vi.fn(async () => undefined),
    }
  );
  return {
    transaction,
    sql,
    connect: vi.fn(() => sql),
    readFile: vi.fn(),
  };
});

vi.mock("postgres", () => ({ default: mocks.connect }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));

const snapshot = JSON.parse(
  readFileSync(
    new URL(
      "../../../data/courts/manila-operators-2026-09-16.json",
      import.meta.url
    ),
    "utf8"
  )
) as { records: Record<string, unknown>[] };

function mockSource(options: {
  archiveMissing?: boolean;
  record?: Record<string, unknown>;
}) {
  mocks.readFile.mockImplementation(async (file: URL) => {
    const key = file.pathname.split("/").at(-1) ?? "fixture";
    return JSON.stringify({
      source: key,
      sourceUrl: "https://example.com/courts",
      publishedAt: "2026-09-16",
      verificationRequired: true,
      archiveMissing: options.archiveMissing,
      records: [
        {
          ...snapshot.records[0],
          name: key,
          slug: key,
          sourceExternalId: key,
          operatingHours: [],
          ...options.record,
        },
      ],
    });
  });
}

describe("nationwide court importer", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://fixture:fixture@localhost/fixture"
    );
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.argv = [...originalArgv, "--apply"];
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects verification without a location source before opening the database", async () => {
    mockSource({ record: { locationSourceUrl: undefined } });
    await expect(import("../../../scripts/import-ph-courts")).rejects.toThrow(
      "Missing reviewed location evidence"
    );
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("does not archive absent venues for an additive snapshot", async () => {
    mockSource({ archiveMissing: false });
    await import("../../../scripts/import-ph-courts");
    const statements = mocks.transaction.mock.calls.map(([parts]) =>
      parts.join("")
    );
    expect(
      statements.some((query) => query.includes("INSERT INTO venues"))
    ).toBe(true);
    expect(
      statements.some((query) => query.includes("listing_status = 'archived'"))
    ).toBe(false);
    expect(mocks.sql.end).toHaveBeenCalled();
  });

  it("retains managed-source archival when the new option is omitted", async () => {
    mockSource({});
    await import("../../../scripts/import-ph-courts");
    expect(
      mocks.transaction.mock.calls.some(([parts]) =>
        parts.join("").includes("listing_status = 'archived'")
      )
    ).toBe(true);
  });
});
