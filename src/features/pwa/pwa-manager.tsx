"use client";

import { useEffect } from "react";

export type RelayInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __relayInstallPrompt?: RelayInstallPrompt;
  }
}

const developmentCleanupKey = "relay-development-sw-cleanup";

export async function clearDevelopmentPwa(
  serviceWorker: ServiceWorkerContainer,
  cacheStorage: CacheStorage | undefined
) {
  const registrations = await serviceWorker.getRegistrations();
  const cacheNames = cacheStorage ? await cacheStorage.keys() : [];
  const relayCaches = cacheNames.filter((name) =>
    name.startsWith("relay-pwa-")
  );
  await Promise.all([
    ...registrations.map((registration) => registration.unregister()),
    ...relayCaches.map((name) => cacheStorage?.delete(name)),
  ]);
  return Boolean(
    serviceWorker.controller || registrations.length || relayCaches.length
  );
}

export function PwaManager({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!enabled) {
      void clearDevelopmentPwa(
        navigator.serviceWorker,
        "caches" in window ? window.caches : undefined
      )
        .then((cleaned) => {
          const alreadyReloaded =
            sessionStorage.getItem(developmentCleanupKey) === "1";
          if (cleaned && !alreadyReloaded) {
            sessionStorage.setItem(developmentCleanupKey, "1");
            window.location.reload();
          } else if (!cleaned) {
            sessionStorage.removeItem(developmentCleanupKey);
          }
        })
        .catch(() => undefined);
      return;
    }

    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => registration.update().catch(() => undefined))
        .catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.__relayInstallPrompt = event as RelayInstallPrompt;
      window.dispatchEvent(new Event("relay-install-available"));
    };
    const installed = () => {
      window.__relayInstallPrompt = undefined;
      window.dispatchEvent(new Event("relay-install-available"));
    };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, [enabled]);

  return null;
}
