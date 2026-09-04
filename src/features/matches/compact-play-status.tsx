"use client";

import {
  Broadcast,
  CaretRight,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const soundPreferenceKey = "relay-play-alert-sound";

function playReadyCue() {
  navigator.vibrate?.([120, 80, 120]);
  const AudioContextConstructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
  oscillator.addEventListener("ended", () => void context.close(), {
    once: true,
  });
}

export function CompactPlayStatus({
  href,
  label,
  urgent,
}: {
  href: string;
  label: string;
  urgent: boolean;
}) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const fingerprint = `${href}:${label}`;

  useEffect(() => {
    const enabled = localStorage.getItem(soundPreferenceKey) === "on";
    setSoundEnabled(enabled);
    if (!enabled || !urgent) return;
    const alertKey = `relay-play-alert-last:${href}`;
    if (localStorage.getItem(alertKey) === fingerprint) return;
    localStorage.setItem(alertKey, fingerprint);
    playReadyCue();
  }, [fingerprint, href, urgent]);

  return (
    <div className="shrink-0 border-b border-line bg-surface px-4 sm:px-8 lg:px-0">
      <div className="mx-auto flex min-h-11 w-full max-w-6xl items-center gap-1">
        <Link
          href={href}
          prefetch={false}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
        >
          <Broadcast
            aria-hidden
            size={16}
            weight={urgent ? "fill" : "regular"}
            className={urgent ? "text-live" : "text-muted"}
          />
          <span className="min-w-0 flex-1 truncate">Your Play · {label}</span>
          <span className="hidden shrink-0 items-center gap-1 text-xs text-muted sm:inline-flex">
            Open Play <CaretRight aria-hidden size={13} />
          </span>
        </Link>
        <button
          type="button"
          aria-label={
            soundEnabled
              ? "Mute Play alerts"
              : "Enable sound and vibration for Play alerts"
          }
          title={soundEnabled ? "Mute Play alerts" : "Enable Play alerts"}
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            localStorage.setItem(soundPreferenceKey, next ? "on" : "off");
            if (next) playReadyCue();
          }}
          className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          {soundEnabled ? (
            <SpeakerHigh aria-hidden size={16} />
          ) : (
            <SpeakerSlash aria-hidden size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
