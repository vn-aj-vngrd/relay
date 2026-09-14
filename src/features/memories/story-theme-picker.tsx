import Image from "next/image";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

import {
  type StoryArtOptions,
  type StoryTheme,
  storyMemoryFont,
  storyPosterEdges,
  storyScoreFont,
  storySurface,
  storyThemeDecorations,
  storyThemes,
} from "./story-theme";
import styles from "./story-workspace.module.css";

// Small vector covers reuse the artwork and selected photo without hidden
// full-story renders. Labels describe the look, never invented game data.
export function StoryThemePicker({
  theme,
  accent,
  subject,
  photoUrl,
  light,
  onChange,
}: {
  theme: StoryTheme;
  accent: string;
  subject: StoryArtOptions["subject"];
  photoUrl?: string;
  light?: boolean;
  onChange: (theme: StoryTheme) => void;
}) {
  return (
    <div className="mt-6 min-w-0">
      <p className="text-sm font-semibold">Story theme</p>
      <TabChipRail
        label="Story theme"
        className={styles.themeRail}
        itemClassName={styles.themeOption}
        items={storyThemes.map(({ id, label }) => ({ value: id, label }))}
        value={theme}
        onChange={onChange}
        renderItem={({ value, label }) => (
          <>
            <span className="relative block">
              <svg
                aria-hidden="true"
                viewBox="0 0 1080 1440"
                className={styles.themeThumbnail}
                fill="none"
              >
                <path
                  d="M0 0H1080V1440H0Z"
                  fill={storySurface(value, { color: accent, light }).color}
                />
                <g transform="scale(1 .75)">
                  {storyPosterEdges(
                    value,
                    value === "minimal" && !light ? "#fff" : "#17181d"
                  ).map((part) => (
                    <path
                      key={part.path}
                      d={part.path}
                      fill={part.fill ?? "none"}
                      stroke={part.stroke}
                      strokeWidth={part.strokeWidth}
                    />
                  ))}
                </g>
                <text
                  x="88"
                  y="320"
                  fill={value === "minimal" && !light ? "#fff" : "#17181d"}
                  fontSize="124"
                  fontWeight="900"
                  fontFamily={
                    subject === "people"
                      ? storyMemoryFont(value)
                      : storyScoreFont(value)
                  }
                >
                  {label.split(" ").map((word, index) => (
                    <tspan key={word} x="88" dy={index ? 190 : 0}>
                      {word}
                    </tspan>
                  ))}
                </text>
                <g transform="translate(0 480)">
                  {subject === "people" ? (
                    <>
                      <path d="M110 170H970V690H110Z" fill="#fffdf7" />
                      <path d="M144 204H936V646H144Z" fill="#dce2d5" />
                      {!photoUrl ? (
                        <path
                          d="M490 354h100M540 304v100"
                          stroke="#658074"
                          strokeWidth="12"
                        />
                      ) : null}
                      {value === "scrapbook" ? (
                        <path
                          d="M180 162l200 -12 2 36 -200 12ZM730 652l200 12 -2 36 -200 -12Z"
                          fill="#dac398"
                        />
                      ) : null}
                    </>
                  ) : (
                    storyThemeDecorations(value, { accent, subject }).map(
                      (part) => (
                        <path
                          key={part.path}
                          d={part.path}
                          fill={part.fill ?? "none"}
                          stroke={part.stroke}
                          strokeWidth={part.strokeWidth}
                        />
                      )
                    )
                  )}
                </g>
                <path
                  d="M88 1230H700M88 1290H470"
                  stroke={value === "minimal" && !light ? "#fff" : "#17181d"}
                  strokeWidth="20"
                />
              </svg>
              {subject === "people" && photoUrl ? (
                <span
                  className="absolute left-[13.333%] top-[47.5%] h-[30.694%] w-[73.333%] overflow-hidden"
                  aria-hidden
                >
                  <Image
                    src={photoUrl}
                    alt=""
                    fill
                    sizes="52px"
                    unoptimized
                    className="object-cover"
                  />
                </span>
              ) : null}
            </span>
            <span>{label}</span>
          </>
        )}
      />
    </div>
  );
}
