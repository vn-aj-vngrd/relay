import {
  ArrowsClockwise,
  CrownSimple,
  Scales,
  Stack,
  UsersFour,
} from "@phosphor-icons/react";

import type { PlayMode } from "./rotation";

export const playModeOptions: ReadonlyArray<{
  mode: PlayMode;
  title: string;
  description: string;
  icon: typeof Stack;
}> = [
  {
    mode: "queue",
    title: "Paddle Stack",
    description: "Keep courts moving as players arrive, rest, or leave.",
    icon: Stack,
  },
  {
    mode: "random",
    title: "Mix It Up",
    description: "Rotate together with new partners and fair rests each round.",
    icon: ArrowsClockwise,
  },
  {
    mode: "balanced",
    title: "Balanced Mix",
    description:
      "Build close teams from everyone’s self-described playing experience.",
    icon: Scales,
  },
  {
    mode: "king_of_court",
    title: "Court Climb",
    description: "Winners move toward Court 1 and partners split every round.",
    icon: CrownSimple,
  },
  {
    mode: "round_robin",
    title: "Team Round Robin",
    description: "Keep pairs together and play every other pair once.",
    icon: UsersFour,
  },
];
