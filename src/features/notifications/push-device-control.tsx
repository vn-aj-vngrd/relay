"use client";

import { Bell, BellSlash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Button, ButtonSpinner } from "@/components/ui/button";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export function PushDeviceControl({ compact = false }: { compact?: boolean }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    void Promise.resolve().then(() => setSupported(available));
    if (available)
      void navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setSubscribed(Boolean(subscription)))
        .catch(() => undefined);
  }, []);

  async function enable() {
    setPending(true);
    setMessage("");
    try {
      const configResponse = await fetch("/api/notifications/subscriptions", { cache: "no-store" });
      const config = (await configResponse.json()) as { enabled?: boolean; publicKey?: string };
      if (!config.enabled || !config.publicKey) throw new Error("Push delivery is not configured yet.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications remain off for this browser.");
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(config.publicKey),
        }));
      const response = await fetch("/api/notifications/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("This device could not be registered.");
      setSubscribed(true);
      setMessage("Push notifications are ready on this device. You can fine-tune categories above.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Push notifications could not be enabled.");
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/notifications/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setMessage("Push notifications are off on this device.");
    } catch {
      setMessage("This device could not be removed. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (supported === false)
    return <p className="text-sm text-muted">Push notifications aren’t supported in this browser.</p>;
  if (supported === null) return null;

  return (
    <div className={compact ? "" : "border-y border-line py-4"}>
      <Button type="button" variant="secondary" disabled={pending} onClick={subscribed ? disable : enable}>
        {pending ? (
          <ButtonSpinner />
        ) : subscribed ? (
          <BellSlash aria-hidden size={16} />
        ) : (
          <Bell aria-hidden size={16} />
        )}
        {pending ? "Updating…" : subscribed ? "Disable on this device" : "Enable on this device"}
      </Button>
      {message ? (
        <p role="status" className="mt-2 text-xs leading-5 text-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
