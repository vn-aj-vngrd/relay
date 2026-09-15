import type { IconProps } from "@phosphor-icons/react";
import { Cursor } from "@phosphor-icons/react/dist/ssr";

/** Shared outlined cursor branding for every Agent surface. */
export function AgentMark({ size = 24, ...props }: IconProps) {
  return <Cursor {...props} aria-hidden size={size} weight="regular" />;
}
