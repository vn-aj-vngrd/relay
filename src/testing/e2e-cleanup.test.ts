import { describe, expect, it, vi } from "vitest";
import { withLifecycleCleanup } from "../../e2e/helpers/cleanup";

describe("tracked game lifecycle cleanup", () => {
  it("deletes the captured game when the first post-publication action fails", async () => {
    let id: string | undefined;
    const remove = vi.fn();
    const failure = new Error("creation-banner dismissal failed");
    await expect(
      withLifecycleCleanup(
        async () => {
          id = "exact-new-game";
          throw failure;
        },
        async () => {
          if (id) await remove(id);
        },
        vi.fn()
      )
    ).rejects.toBe(failure);
    expect(remove).toHaveBeenCalledExactlyOnceWith("exact-new-game");
  });
  it("does not delete anything when publication never supplied an ID", async () => {
    const id: string | undefined = undefined;
    const remove = vi.fn();
    await expect(
      withLifecycleCleanup(
        async () => {
          throw new Error("publish failed");
        },
        async () => {
          if (id) await remove(id);
        },
        vi.fn()
      )
    ).rejects.toThrow("publish failed");
    expect(remove).not.toHaveBeenCalled();
  });
  it("cleans up after success", async () => {
    const cleanup = vi.fn();
    await withLifecycleCleanup(async () => {}, cleanup, vi.fn());
    expect(cleanup).toHaveBeenCalledOnce();
  });
  it("preserves the original error and reports cleanup failure separately", async () => {
    const original = new Error("score failed");
    const report = vi.fn();
    await expect(
      withLifecycleCleanup(
        async () => {
          throw original;
        },
        async () => {
          throw new Error("quota");
        },
        report
      )
    ).rejects.toBe(original);
    expect(report).toHaveBeenCalledOnce();
  });
  it("fails an otherwise passing lifecycle when cleanup fails", async () => {
    const report = vi.fn();
    await expect(
      withLifecycleCleanup(
        async () => {},
        async () => {
          throw new Error("quota");
        },
        report
      )
    ).rejects.toThrow("quota");
    expect(report).toHaveBeenCalledOnce();
  });
});
