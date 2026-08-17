import type { CSSProperties } from "react";

export const sessionAccents = [
  { id: "violet", label: "Violet", solid: "#635bde", soft: "#eeecff" },
  { id: "blue", label: "Court blue", solid: "#2563eb", soft: "#eaf1ff" },
  { id: "teal", label: "Teal", solid: "#0f766e", soft: "#e5f5f2" },
  { id: "green", label: "Baseline green", solid: "#327a4f", soft: "#e9f4ec" },
  { id: "orange", label: "Orange", solid: "#b85a17", soft: "#fff0e3" },
  { id: "coral", label: "Coral", solid: "#bd4545", soft: "#ffeded" },
] as const;

export type SessionAccent = (typeof sessionAccents)[number]["id"];

export function sessionAccent(value: string | null | undefined) {
  return sessionAccents.find((accent) => accent.id === value) ?? sessionAccents[0];
}

export function sessionAccentStyle(value: string | null | undefined): CSSProperties {
  const accent = sessionAccent(value);
  return {
    "--session-accent": accent.solid,
    "--session-accent-soft": `color-mix(in oklch, ${accent.solid} 13%, var(--surface))`,
    "--session-cover": `color-mix(in srgb, ${accent.solid} 32%, var(--court))`,
    "--primary": `color-mix(in oklch, ${accent.solid} 82%, var(--ink))`,
    "--primary-hover": `color-mix(in oklch, ${accent.solid} 72%, var(--ink))`,
    "--primary-soft": `color-mix(in oklch, ${accent.solid} 13%, var(--surface))`,
  } as CSSProperties;
}
