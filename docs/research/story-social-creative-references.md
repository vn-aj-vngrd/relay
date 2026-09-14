# Story creative follow-up: social references and five-theme direction

Date: 2026-09-14
Scope: Research for the user's request to handle long names and keep improving all five game/pickleball Story themes. This supplements `story-wrapped-2025-plan.md`; it is not a claim that implementation or export QA is complete.

## Evidence and access limits

The user supplied a concrete failure: `vanajvanguardia` breaks into `vanajvangua` and `rdia` in an oversized headline. That screenshot establishes the awkward word break, not its implementation cause.

Read the six first-party sources below. Attempted direct PPA Instagram and TikTok feeds; neither could be fetched. Meta's Instagram Stories ad guide redirected to a blocked/login page; its Facebook Stories guide was robots-blocked. The linked Instagram and PPA image assets also failed to load. Therefore this research does **not** claim a visual audit of current TikTok/Instagram/Facebook feeds, observed viral trends, engagement evidence, or an official universal pixel safe zone. Theme recommendations below are design inferences from accessible platform guidance, current Story source, and the user's screenshot. Older platform announcements establish design vocabulary, not current trend prevalence.

## Six first-party references

| Source | Established observation | Useful translation for Relay |
| --- | --- | --- |
| [TikTok Creative Codes](https://ads.tiktok.com/business/en/creative-codes) | TikTok recommends vertical 9:16, room for interface overlays, a hook/body/close structure, and platform-native creative. Its guidance concerns ads/video. | A static game card can still have one immediate hook, one hero moment, then compact context. Do not claim a PNG delivers video transitions or native sound. |
| [TikTok in-feed specifications](https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en-GB), updated June 2026 | Safe-zone size varies with aspect ratio, caption length, and added formats. | Separate decorative bleed from critical text. Treat a Relay inset as an internal composition rule, then verify a draft on the target placement. |
| [Instagram Stories stickers](https://about.fb.com/news/2024/05/new-stickers-in-instagram-stories/), May 2024 | Frames turn a photo into an instant print; Cutouts use objects from photos/videos as reusable stickers; optional captions and music support personal sharing. | Scrapbook can feel like a real court keepsake. Use original paddle/ball cutout-style art around the user's photo, with factual session context. A static export must not imitate a working interactive sticker. |
| [Facebook edits and collages](https://about.fb.com/news/2025/10/new-facebook-feature-suggests-edits-and-collages-to-share/), October 2025 | Facebook describes optional, private suggestions that turn real camera-roll memories into collages/edits for sharing, including Stories. | Make the real crew/game the subject; provide a finished composition quickly while retaining user control. This is supporting direction, not a request to add camera-roll access or AI editing. |
| [PPA Championship Sunday recap](https://www.ppatour.com/championship-sunday-standout-stats-from-the-veolia-pickleball-national-championships/), September 8, 2026 | The tour's own recap connects named players, actual final scores, place/date, and specific recorded standout statistics. | A sports story becomes meaningful through its particular people and result. Relay should feature only data it actually records: do not invent longest rallies, dink counts, winners, skill labels, or lifetime milestones. |
| [PPA / JOOLA Pops Summer Tour](https://www.ppatour.com/a-summer-to-remember-recapping-the-2026-joola-pops-summer-tour/), July 29, 2026 | The first-party campaign account combines real pickleball community events with playful nostalgia: popsicle truck, paddle demos, games and a red/white/blue collection. | Retro and social themes can be warm, playful sporting souvenirs rather than generic performance dashboards. Borrow the principle of a cohesive world; do not copy JOOLA marks or campaign art. |

## Priority: names are identity, not decoration

Use one shared preview/export fitting policy. Prefer word-boundary wrapping for names and titles. Before splitting a continuous name, reduce only that heading's font size within a legible range; preserve the rest of the hierarchy. If an exceptionally long token still cannot fit, split as a last resort with balanced lines rather than a tiny orphan fragment. Preserve the full name, accents and emoji grapheme sequences. Do not silently abbreviate, append ellipses, or stretch text horizontally. Verify ordinary short names stay appropriately bold, and compare the actual exported PNG as well as the preview.

## Five-theme assessment and next direction

This is a source-based assessment of `story-theme.ts` and shared layout design, not five newly inspected live screenshots.

| Theme | What to retain | What should improve | Game-specific expression |
| --- | --- | --- | --- |
| Minimal | Restrained court corners, ample space, clear score typography. | A useful hierarchy must survive long names without the card looking accidentally wrapped. Avoid compensating with more ornaments. | Name/title as identity; one recorded result or session fact as hero; compact date/venue. |
| Scrapbook | Paper layers, tape, original paddles, framed photo option. | Let the subject distinguish a crew keepsake from a result card; avoid the identical paddle scene for every focus. | Crew/photo feels collected after a game; a result can resemble a saved score slip. Keep tape outside faces and facts. |
| Coquette | Blush paper, serif character, scalloped/ribbon sporting print. | Keep the paddle recognizable and ribbon subordinate to the name/result. Prevent long names from becoming a huge two-line block above delicate art. | Invitational club-card energy for upcoming games; a tied keepsake for crew; an elegant score medallion only for actual results. |
| Court Pop | High contrast, oversized type, court geometry, vivid accent. | Highest priority for headline fit: boldness should come from contrast and composition, not forcing a username to huge size. Reduce generic black-panel dead space. | Distinct invitation poster, crew collage and result graphic. Keep the result hero separate from the player's complete identity. |
| Retro Rally | Warm paper, sporting stripes, serif scores, ticket framing. | A ticket needs a crisp information rhythm; decorations must not compete with venue/date or join details. | A court pass for upcoming play, match-day souvenir for crew, score ticket for completed results. No fictional ticket number or invented historical claim. |

The strongest next iteration is **content-aware composition**, not a sixth theme or more scattered stickers. Preserve the five visual identities, but let invitation, people, and recorded result produce different artwork balance. Keep factual fields and export geometry shared. Use playful optional captions such as “Meet you at the kitchen” as user choices, not claims about what happened during the game.

## Bounded review criteria

- Full unbroken username from the screenshot; ordinary multiword names; accented names; long venue/title; photo and no-photo, across all five themes.
- Name readable first, hero moment obvious second, game context legible third; no tiny final-line fragment when fitting can avoid it.
- Decorative framing never covers names, faces, QR/manual join details or score labels.
- Preview and PNG use the same layout/fitting result; no visual-only browser CSS fix.
- Verify native Story/Reel draft overlays separately before asserting platform-safe output. Do not post to social accounts without authorization.

No lint, typecheck, test suite, build or E2E command ran for this research. **Validation deferred to pre-commit.**
