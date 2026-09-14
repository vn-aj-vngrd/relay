# Story redesign: pickleball posters inspired by Wrapped 2025

Date: 2026-09-13
Status: Approved by the user on 2026-09-13. The plan below records the agreed scope; implementation is on `van/story-court-pop`, with validation deferred to pre-commit.

## Recommendation

Make Story feel like a personal pickleball poster worth saving. Evolve **Court Pop** into the expressive default, expose visual theme previews before Customize, and give game invitations, people/photos, and recorded results distinct compositions. Preserve Minimal as an explicit choice and retain the other existing themes. Build on the current Story renderer and export pipeline.

This is a visual and composer improvement, not the broader artifact-publishing platform proposed in `story-activation-plan-2026-09.md`. No schema migration, new feed, analytics system, public artifact URLs, automatic posting, or new animation dependency is needed.

The editor is an Operate surface: someone on a phone wants to choose and share quickly. The exported image is an Experience surface: a friend should immediately recognize pickleball, the people/game, and the featured moment.

## What the current feature explains

Inspected the current implementation and compared the relevant source files with freshly fetched origin/master; these Story sources and DESIGN.md had no differences. The user's active checkout has unrelated in-progress convention changes, so this document is isolated on `van/story-wrapped-2025-plan` in a separate worktree.

- `recap-share-card.tsx` initializes the theme to `minimal`. Theme choices sit inside Customize → Theme; first use does not expose the expressive options visually.
- `story-theme.ts` already contains Minimal, Scrapbook, Coquette, Court Pop, and Retro Rally, with original paddle, perforated-ball, court, ribbon, and stripe artwork. Adding another small pickleball icon alone would repeat existing work.
- `story-scene.ts` largely allocates the same factual/art regions across themes. Non-photo art occupies a canonical 480px-high slot; typography and content remain comparatively similar. This is a structural reason the expressive variants may still feel like the same template with different decoration, rather than a proven usability finding.
- `recap-story-card.tsx`, `story-invitation-layout.ts`, `story-framed-invitation.ts`, and `story-recap-layout.ts` already share canonical coordinates and text layout with Canvas drawing. Preserve this investment rather than building a second renderer.
- Current features already support 1080×1920 PNG, optional native file sharing, local/session photos, crop and photo placement, captions, focus navigation, and eligible invitation QR/link footers.
- The existing `story-creative-direction.md` explicitly researched **2024** Spotify imagery. Its advice is useful historical context, but does not satisfy the requested 2025 reference.

Evidence boundary: the running public landing page's DOM contains real Story renderer examples using Minimal and illustrative data. This was read, but an authenticated Story tab was not inspected in this session. Browser screenshot capture stalled; no current screenshot or end-to-end verification is claimed. The diagnosis above is grounded in source, not an invented visual audit.

## Research: what is actually 2025

### First-party sources

| Source | Date | What it establishes |
| --- | --- | --- |
| [Spotify campaign explanation](https://newsroom.spotify.com/2025-12-03/wrapped-marketing-campaign/) | Dec 3, 2025 | A personal “visual mixtape,” combining analog/digital textures, bold imagery and a reduced palette; expressive but clear. |
| [Spotify 2025 media kit](https://newsroom.spotify.com/media-kit/2025-wrapped-media-kit/) | 2025 campaign | Official downloadable examples used for direct visual inspection below. |
| [Spotify product experience](https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/) | Dec 3, 2025 | Personalized, shareable moments, revisiting individual stories, and controls for experience speed. The useful transfer is a meaningful individual moment, not compulsory autoplay. |
| [Vucko project account](https://vucko.co/work/spotify-wrapped-2025) | Undated | The credited studio worked with Spotify on a motion identity and toolkit across marketing and product. |
| [Rive implementation account](https://www.rive.app/blog/spotify-used-rive-for-spotify-wrapped-2025) | Jan 9, 2026 | Data-driven design prototyping and attention to text, localization and device constraints. This supports robust layout planning; it does not justify adding Rive here. |
| [Spotify 2024 retrospective](https://newsroom.spotify.com/2024-12-04/10-years-spotify-wrapped/) | Dec 4, 2024 | The earlier campaign emphasized vivid combinations and looping 2/4 shapes. Those are not the specific 2025 visual reference. |

### Directly inspected official visuals

| Reference | Observed design | Relay interpretation (proposal) |
| --- | --- | --- |
| [Top Songs](https://storage.googleapis.com/pr-newsroom-wp/1/2025/12/Top-5-Songs-Static.png) | Charcoal field, off-white headline strip, broad heavy type, photo strip, scribble and cropped optical pattern. | An invitation as a graphic court poster, with a large game title and a disciplined practical-details area. |
| [Listening Age](https://storage.googleapis.com/pr-newsroom-wp/1/2025/12/Listening-Age-Static-02.png) | Huge outlined pink number, off-white background, fine contours, cropped black geometry. | One large recorded total with an explicit unit, framed by ball perforations or a court corner. |
| [Artist sharecard](https://storage.googleapis.com/pr-newsroom-wp/1/2025/12/2025WrappedForArtist_Sharecard.png) | Large portrait, dotted/scribbled edges, vertical year, inverted name label, orderly supporting stats. | Photo-first crew keepsake: people dominate, caption and factual context remain readable. |
| [Fan Leaderboard](https://storage.googleapis.com/pr-newsroom-wp/1/2025/12/Fan-Leaderboard-Static-01.png) | Monochrome rings and globe-like lines frame a portrait and a single statement. | Recognizable court/net framing around the subject; avoid importing music-specific optical shapes unchanged. |
| [Wrapped Party](https://storage.googleapis.com/pr-newsroom-wp/1/2025/12/WP_Individual-scaled.jpg) | Portraits overlap oversized colored names; black label strips, doodles and patterned borders create personality. | Strong personal-name/photo hierarchy with original pickleball line art. Do not import its award mechanic or invent player accolades. |

These five static assets were inspected directly, not inferred from search snippets. Motion frames were not inspected. The study supports an aesthetic direction; it does not establish that these elements improve shares or engagement. Reference images remain research-only temporary downloads, not Relay production assets.

## Proposed creative system

Working direction: **Your court story**. Keep the Relay mark intact. Distinguish the illustrated perforated pickleball from the official hole-free brand mark.

Use ink/off-white as the graphic foundation with one selected Relay-compatible accent. Court blue and pink are natural starting variants. A larger optic-yellow illustration is a proposed **Story-artwork-only exception** to the app's sparse signal-color rule; document that scope if approved. Keep surrounding UI tokens and semantic colors unchanged.

Use oversized upright display lettering for the main subject, with compact readable factual text. Start with the existing available font assets and weights; any dedicated display face requires an explicit, licensed, self-hosted selection and identical preview/export loading. Do not imitate Spotify's proprietary typeface. No display font in controls, no warped names, no tiny labels to accommodate more decoration.

Use three composition families within Court Pop, selected by existing focus and photo state—not three new top-level themes or a restored Layout selector:

| Family | Existing focuses | Composition |
| --- | --- | --- |
| **Court poster** | Invitation, We're playing, Night recap, Your story without a photo | Large game title anchored to a cropped paddle or ball; a broad court boundary provides structure; a single practical-details rail finishes the composition. Invitation reserves space for price, availability and optional join footer from the start. |
| **People and photos** | The crew, photo-first Your story; compatible photo selections on other focuses | One dominant photograph with an offset print edge, large subject/title, and a short caption. One paddle/ball doodle attaches to the frame. Names remain complete and do not imply attendance unless the existing source supports it. No photo produces an intentional typographic roster/poster. |
| **Big result** | My game, Winning team, Top of the table, Closest finish, Points played, Court time, Busiest court, Match pulse | One defensible name, result or number at poster scale; clear unit immediately beside/below it; one supporting group plus game/date/venue. Standings stays a structured ranking composition with the same graphic language. |

The families should differ in silhouette and content hierarchy, not merely in background color. Court marks can organize regions, ball holes can create a cropped edge rhythm, and a paddle can anchor a title. One simple hand-drawn rally flourish may suggest motion decoratively; never present it as a tracked shot path. Use one hero motif and at most two supporting accents. No gradients, generic confetti field, illegible texture over facts, or stacked dashboard metric cards.

Personal copy can be playful without making claims. Offer a small optional caption list in the existing message controls, such as “Meet you at the kitchen.” for an invitation and “Same court next time?” for a recap. Leave it opt-in; never replace a game title, add a fake award, or assert unrecorded rallies, calories, aces, attendance, or rankings.

## Proposed Story tab flow

1. **Open to a finished-looking poster.** Court Pop is the initial theme; preserve the current data-eligible focus selection. Minimal remains selectable. Check any saved-choice behavior before changing initialization.
2. **Choose the moment.** Reuse the current focus rail and manual Previous/Next, swipe and keyboard interaction. Keep names like Invitation, Night recap and My game.
3. **Choose a look visibly.** Add a compact, horizontally scrollable theme thumbnail rail beside/below the preview using the existing five theme IDs and selection semantics. Each thumbnail demonstrates its composition. Do not render five full hidden export canvases or add a duplicate theme selector inside Customize.
4. **Customize only when needed.** Keep photo, crop, placement, palette and message controls behind the existing disclosure. Selecting a theme must not reset those independent choices. Existing themes remain available; only Court Pop receives the new composition system in the first release.
5. **Share or save.** Retain Share Story as the primary action and Download PNG as the explicit fallback. Keep QR/link options where currently eligible. Never claim a native share-sheet completion means a social post was published.

Keep the current bounded 896px desktop workspace and mobile stacking, unless a real thumbnail layout requires a small adjustment. Use shared `TabChipRail`, buttons, focus handling and existing state feedback. Preserve authenticated/shared route parity. The intentional differences from the incumbent are the default, visible theme choices, and Court Pop's composition; the rest of the composer stays familiar.

## Implementation sequence after approval

1. **Ground the final visual spec.** Inspect the authenticated/shared Story view and current exports; create a small review sheet for invitation, crew/photo and one metric using realistic synthetic content. Confirm phone legibility and original artwork before expanding to remaining focuses. This is future work, not a completed mockup.
2. **Extend shared geometry first.** Update `story-scene.ts`, `story-theme.ts`, `story-invitation-layout.ts`, `story-framed-invitation.ts` and `story-recap-layout.ts` only where the Court Pop compositions require it. Keep factual derivation and non-Court-Pop behavior intact. Do not create a parallel Story subsystem.
3. **Render the same design twice consistently.** Update `recap-story-card.tsx` and Canvas drawing in `recap-share-card.tsx` from shared shape/text coordinates. Font readiness, clipping, photo crop, footer reservation and text wraps must match. Retain 1080×1920 as the first-release export format.
4. **Improve discovery.** Change initial theme, introduce the compact thumbnail selection, and simplify the now-duplicated Theme customization section. Reuse `story-workspace.module.css` and shared controls; preserve selected state across focus changes.
5. **Cover changed behavior and update authority.** Update relevant unit suites, Story E2E fixtures and the Story section of DESIGN.md, documenting the deliberate default and artwork exceptions. Follow current runbooks rather than older research documents' validation timing.

No new dependencies, storage uploads, backend contracts or app-wide redesign are planned. Additional aspect ratios, animated/video export, multi-card batch export and wider theme redesigns are deferred.

## Acceptance and validation plan

- At phone size the game/subject and headline result read first; date, venue, price and availability remain readable. A missing photo is an intentional design, not a hole.
- Court Pop invitation, people and metric compositions remain distinguishable in grayscale. Pickleball identity is recognizable without depending on the wordmark.
- Retain full long names, accented/unbroken words, captions, large values and dense standings. Keep existing truthful truncation summaries such as Top 5 of N where applicable; do not silently omit required data to keep a large headline.
- Published/full/waitlisted/approval-required/free/paid states retain correct invitation facts. Live uses safe aggregates. No-score completion remains meaningful. Private games expose no join prompts. Local photos stay local; cancelled/denied states keep current permissions.
- Test default selection and thumbnail semantics in `recap-share-card.test.tsx`/`story-workspace.test.ts`; theme/geometry/overflow in existing `story-theme`, `story-scene`, invitation and recap layout tests; retain photo, QR and permission regressions.
- Maintain `e2e/story-creative.spec.ts`, `story-export.spec.ts` and `story-preview.spec.ts` for preview/download agreement and focus/theme/photo combinations. Map changes to the current critical journey matrix.
- When browser validation is authorized, compare shared/account views at 390px and 1440px, light/dark themes, keyboard selection/focus, reduced motion, loading/error states and no horizontal overflow. Compare actual downloaded PNGs, not preview alone. Exercise share cancel, unsupported file share, download failure and QR failure/recovery.
- Social overlays are not proven by the 9:16 ratio. Prototype a conservative content inset and review an actual organic Story draft before finalizing placement; do not label an internal inset an official universal safe zone. Keep decorative bleed separate from critical content, especially QR and manual URL. No social posting is included in verification without explicit authorization.
- Run `pnpm check:full` before an authorized code commit; documentation-only commits use the documented `pnpm check:fast` gate. E2E execution stays opt-in.

No lint, typecheck, unit suite, build, E2E or hook command ran in this planning phase. **Validation deferred to pre-commit.**

## Decision to approve

Approve this bounded direction: **Court Pop as the expressive default; original pickleball collage/poster artwork inspired by Wrapped 2025; three data-aware compositions; visible theme thumbnails; static PNG first.** Minimal and the existing other themes stay available. Implementation begins only after the user approves the plan.

## Direction contract

THESIS: A personal pickleball poster, with a distinct subject, sporting image and factual finish.

OWN-WORLD: Ink/off-white paper, selected game accent, original paddle and perforated-ball geometry; unchanged Relay chrome.

STORY: Choose the moment, choose a visible look, personalize if desired, share or download.

FIRST VIEWPORT: Bounded portrait beside focus/theme controls on desktop; readable stacked portrait on mobile. Share follows Customize.

FORM: Data-aware poster, people and result compositions inside Court Pop; framed photos retain independent placement.

FINISH: Record implementation scope and inspection limits in the handoff; automated validation follows the repository's explicit pre-commit policy.

## Follow-up: all five themes

User requested improvements across every theme. Extend the researched analog-paper direction through distinct theme papers, full-scene edge treatments, stronger original paddle/ball prints and matching thumbnail covers. Reuse the fitted poster layout for all expressive themes to remove the detached art/low-aligned-copy gap, keeping each theme's type character. Minimal stays restrained with fine court corners. Reuse the existing photo allocation, crop, footer and sharing flows. Palette accents must remain visible in every expressive theme and photo mat. Validation remains deferred to pre-commit.
