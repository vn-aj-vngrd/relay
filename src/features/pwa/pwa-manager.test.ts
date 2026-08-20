import { describe, expect, it, vi } from "vitest";

import { clearDevelopmentPwa } from "./pwa-manager";

describe("clearDevelopmentPwa", () => {
  it("removes a production worker and Relay caches before development hydrates", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const removeCache = vi.fn().mockResolvedValue(true);
    const serviceWorker = {
      controller: {} as ServiceWorker,
      getRegistrations: vi.fn().mockResolvedValue([{ unregister }]),
    } as unknown as ServiceWorkerContainer;
    const cacheStorage = {
      keys: vi.fn().mockResolvedValue(["relay-pwa-v1-static", "other-app-cache"]),
      delete: removeCache,
    } as unknown as CacheStorage;

    await expect(clearDevelopmentPwa(serviceWorker, cacheStorage)).resolves.toBe(true);
    expect(unregister).toHaveBeenCalledOnce();
    expect(removeCache).toHaveBeenCalledOnce();
    expect(removeCache).toHaveBeenCalledWith("relay-pwa-v1-static");
  });
});
