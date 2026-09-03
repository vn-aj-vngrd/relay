"use client";

import { CheckCircle, DownloadSimple } from "@phosphor-icons/react";
import { useState, useSyncExternalStore } from "react";

import { Button, ButtonSpinner } from "@/components/ui/button";

import type { RelayInstallPrompt } from "./pwa-manager";

type InstallState = "available" | "installed" | "ios" | "manual";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function installState(): InstallState {
  if (
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    (navigator as NavigatorWithStandalone).standalone
  )
    return "installed";
  if (window.__relayInstallPrompt) return "available";
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios";
  return "manual";
}

function subscribe(callback: () => void) {
  const media =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)")
      : null;
  window.addEventListener("relay-install-available", callback);
  window.addEventListener("appinstalled", callback);
  media?.addEventListener("change", callback);
  return () => {
    window.removeEventListener("relay-install-available", callback);
    window.removeEventListener("appinstalled", callback);
    media?.removeEventListener("change", callback);
  };
}

export function InstallAppControl() {
  const state = useSyncExternalStore(subscribe, installState, () => "manual");
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState("");

  async function install() {
    const prompt = window.__relayInstallPrompt as
      | RelayInstallPrompt
      | undefined;
    if (!prompt) return;
    setInstalling(true);
    setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      window.__relayInstallPrompt = undefined;
      window.dispatchEvent(new Event("relay-install-available"));
      setMessage(
        choice.outcome === "accepted"
          ? "Relay was added to this device."
          : "Installation was cancelled."
      );
    } catch {
      setMessage("Installation couldn’t start. Use your browser menu instead.");
    } finally {
      setInstalling(false);
    }
  }

  return (
    <section aria-labelledby="install-app-title">
      <h2 id="install-app-title" className="text-sm font-semibold">
        Relay app
      </h2>
      <div className="mt-2 flex min-h-16 flex-wrap items-center justify-between gap-4 border-y border-line py-3">
        <div className="max-w-xl">
          <p className="text-sm font-medium">Add Relay to this device</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            {state === "installed"
              ? "Relay is already running as an installed app."
              : state === "ios"
                ? "In Safari, open Share and choose Add to Home Screen."
                : state === "available"
                  ? "Open Relay from your home screen with its own app window."
                  : "Use your browser menu and choose Install app or Add to Home Screen."}
          </p>
          {message ? (
            <p role="status" className="mt-1 text-xs font-medium text-muted">
              {message}
            </p>
          ) : null}
        </div>
        {state === "available" ? (
          <Button
            type="button"
            onClick={() => void install()}
            disabled={installing}
          >
            {installing ? (
              <ButtonSpinner />
            ) : (
              <DownloadSimple aria-hidden size={16} />
            )}
            {installing ? "Installing…" : "Install Relay"}
          </Button>
        ) : state === "installed" ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle aria-hidden weight="fill" size={17} /> Installed
          </span>
        ) : null}
      </div>
    </section>
  );
}
