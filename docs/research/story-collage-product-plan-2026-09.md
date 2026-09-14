# Relay Story: a memory maker players want to share

Research and consolidated proposal · September 14, 2026

Implementation update: the initial poster/collage foundation is authored on `van/story-photo-collages`, with 1–4 photos, independent crops, reorder/remove, shared preview/export slots and Photos/Layout/Look/Details controls. All five looks remain together inside Look because that panel already removes them from the default editor. This intentionally avoids a second disclosure for only two additional looks. Updated loading states and regression coverage are included. Pre-commit formatting, strict types, the full unit suite (2,197 tests) and production build passed. Browser E2E and real-device sharing remain unverified. Carousel pages, 4:5 output, further art direction and real-device social export checks remain subsequent work.

## Recommendation

Build around **“Pick your moments. Relay makes the story.”** Players select photos, receive a finished composition with their game details, and can personalize it without building a design from scratch.

Offer three outputs: **Poster** (one striking image), **Collage** (multiple photos on one image), and **Carousel** (an ordered set of separate images). Keep these separate from visual themes and from the game facts being shown. Start with excellent posters and collages, then reuse that foundation for carousels.

This should feel like keeping a memory with friends. Winning is one possible story; arriving, playing together, a funny moment and the after-game photo are equally valid reasons to share.

## What research supports—and what remains unproven

- TikTok Photo Mode supports photo sequences and viewer-controlled swiping. Its introduction used photography and diary-style examples. This is established format behavior, not a new trend. [TikTok, October 2022](https://newsroom.tiktok.com/editing-tools?lang=en)
- TikTok's 2026 forecast favors candid moments, behind-the-scenes material and community. That supports a court diary direction; it does not prove which pickleball layout will perform best. [TikTok Next 2026](https://ads.tiktok.com/business/en-US/next)
- Instagram's own examples connect carousels with camera-roll memories and music, and Stories with instant-photo frames and cutouts. This supports personal photographs and restrained scrapbook details. [Meta carousel announcement](https://about.fb.com/news/2023/08/music-and-collabs-on-instagram/), [Meta Story stickers](https://about.fb.com/news/2024/05/new-stickers-in-instagram-stories/)
- Spotify Wrapped 2025 turns personal data into distinct share cards, adds playful identity/community stories, and lets people revisit specific moments. Relay can borrow that structure: one recognizable personal story per card, with data supporting its meaning. Copying its graphics alone would miss the useful product idea. [Spotify, December 3, 2025](https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/)
- TikTok's carousel advertising playbook recommends a strong opening image and a coherent narrative. Use this as composition guidance only; its advertising results are not organic reach evidence. [TikTok playbook](https://ads.tiktok.com/business/library/Image_Ads_Carousel_Ads_Playbook.pdf)

Direct TikTok creator posts were blocked during research. No current organic pickleball carousel was visually verified, so this proposal does **not** claim to reproduce a proven viral trend. Before promoting it as trend-led, collect a dated set of accessible sports/community posts and validate the concepts with players. The design direction is sufficiently grounded to prototype now.

See [the platform evidence and export note](story-collage-platform-evidence-2026-09.md) for source dates, limitations and additional recipes. This consolidated plan takes precedence where its initial scope is narrower.

## Assessment of the current feature

The existing implementation already has useful foundations: shared public/private Story UI, a game album, local story photos, theme previews, recorded game facts, customization disclosure, and image export. Keep them.

The main constraint is structural: `recap-share-card.tsx` holds one custom background and creates one 1080×1920 card; `story-scene.ts` allocates one photo region; `story-photo.ts` draws one cropped bitmap. More decorative themes cannot solve this single-photo model.

The editor also asks users to understand separate photo, story-focus, theme and advanced settings. Adding collage chips to every existing row would increase that burden. The next design should make a complete suggestion first, then reveal controls for the part being edited.

## Consolidate the five themes

Keep all five existing theme IDs and user choices. Consolidate their layout and photo behavior; make each look visually distinct instead of creating more themes.

| Existing look | Stronger role | Change |
| --- | --- | --- |
| Court Pop | Main sports editorial look | Oversized but fitted headline, asymmetric photos, score in the margin, purposeful court geometry. Recommended for results/posters. |
| Scrapbook | Main memory/collage look | Warm paper, intentional photo overlap, short handwritten annotation, restrained tape. Recommended for photo dumps. |
| Minimal | Quiet photography look | Generous image area, strong alignment, small date/result signature. Recommended when the photo should dominate. |
| Coquette | Playful keepsake look | Preserve blush and ribbon personality; use details as accents around photos rather than filling the canvas. |
| Retro Rally | Vintage sporting print | Ticket edges, ink-like colors, condensed editorial details and a photographic contact-sheet feel. |

Show Court Pop, Scrapbook and Minimal first; retain Coquette and Retro Rally under **More looks**. A selected additional look stays visible. Changing the look must preserve photos, crop, headline and chosen facts.

Court lines, pickleball perforations, paddle silhouettes and score notation should organize the composition. Avoid placing every motif on every card. Strong photography plus one sport-specific detail is often enough.

## Initial formats and layouts

| Format | Initial layouts | Suggested default |
| --- | --- | --- |
| Poster | Hero photo; match poster with result | One selected photo → Hero |
| Collage | Split pair; hero plus two; four-photo contact sheet | Two, three or four selected photos → matching arrangement |
| Carousel, second phase | Cover → moments → closing recap | Three pages generated from the same selected photos and facts |

Initial single-card layouts accommodate **one to four photos**. This is layout capacity, not a new game-album upload quota. Explain it only at selection: “Choose up to 4 photos for this collage.” Do not duplicate album/storage restrictions inside the creative controls.

Carousel starts with three pages and supports two to five pages, reordering and removal. These are proposed product scope bounds to test, not platform limits. Every page can be edited, but the first experience should require no page construction.

With no photo selected, show attractive slot placeholders and an Add photos action. Export must not silently include empty photo placeholders. With fewer photos, adapt to a smaller arrangement; never duplicate an image without the user's intent.

## Concrete stories to make

| Recipe | Composition / sequence | Pickleball character |
| --- | --- | --- |
| **Our kind of game** | Hero group photo + paddle detail + candid moment; date/court in margin | A memory worth sharing regardless of result |
| **Straight from the camera roll** | Four unevenly sized photos, short optional captions | Court arrival, action, funny miss, post-game hangout |
| **The final score** | Large real score, one or two team photos, optional closing line | Editorial match poster; no invented winner or comeback |
| **Same court next week?** | Crew photograph, two small snapshots, optional next-game message | Friendly invitation; no private game link added automatically |
| **A night in three slides** | Favorite photo cover → collage of moments → result or crew closing card | A ready-to-export carousel with a beginning and ending |

These are original proposed recipes, not verified trending post titles. Avoid automatic “MVP,” “longest rally,” “comeback,” or lifetime milestones when available data cannot establish them. User-written captions can tell the personal story.

## Simple editor, flexible results

Keep **Make / Photos** as the existing compact tabs. Photos remains the shared album; Make creates a personal composition from game photos and/or device photos.

Default Make flow:

1. **Add photos.** A unified picker has Game photos and Device sources, selection numbers and clear ownership/storage copy. Local photos stay local to the story unless separately uploaded to the album.
2. **See a finished suggestion.** Automatically choose a layout from photo count and populate appropriate game details. Retain the user's most recent explicit style choice during editing.
3. **Adjust only what matters.** Three compact controls: **Photos · Layout · Look**. Tapping a photo opens its crop/replace actions; tapping the text opens its wording controls.
4. **Share or save.** Keep one primary Share action and a secondary Download option, with destination-format choices in the export sheet.

On mobile, show the preview before controls; editing opens one bottom sheet at a time. Keep Share reachable without obscuring the image or device safe area. On desktop, retain the established preview/editor split.

Place headline, caption, color, decorations and facts inside an **Edit details** disclosure. Replace the always-visible wall of statistic types with **Show on story** choices there. Suggested facts remain editable/hideable. Keep the familiar existing story-focus logic underneath.

Photo editing needs independent horizontal/vertical position and zoom per slot, plus Reset. Provide explicit Move earlier/later buttons alongside optional drag reordering. Swapping a layout must not discard photo edits silently. Cropping and text fitting must match the exported image.

Use one headline and one primary statistic by default, with at most two supporting facts. Names get measured fitting and intentional wrapping, never mid-word clipping. Date, venue and names can be hidden individually before sharing. Do not infer who appears in an uploaded photo.

## Export and platform behavior

- Preserve 1080×1920 (9:16) for Story output. Add a separately composed 1080×1350 (4:5) Post layout with carousel work. These are recommended Relay canvases, not claims about platforms' maximum supported ratios.
- Export carousel pages as separate, consistently sized, ordered images. Current template navigation is not a carousel: page navigation must be clearly labeled “Page 1 of 3.”
- Use file sharing when supported, and provide reliable individual downloads otherwise. Desktop ZIP can be an additional convenience; it is not a universal mobile carousel import solution.
- Users choose the destination and add music, native stickers and mentions there. Image export cannot preserve interactive stickers or guarantee that a share sheet creates a TikTok/Instagram carousel. Offer copyable caption text.
- Validate real-device crop, page order, readability, image quality and save behavior in Instagram, TikTok and Facebook Stories before release. This research did not perform those app tests.

## Engineering approach and safeguards

Extend the existing shared memories feature. Introduce an ordered photo selection, per-photo crop data, layout slots and page composition while retaining the current theme and recorded-stat helpers. Use the same resolved composition for preview and canvas output; do not implement competing layout calculations.

Adapt the current single-photo state to a one-item selection first, then add multiple slots. Decode/downsample images to appropriate working sizes, render exports sequentially and release bitmaps/object URLs. Four full-resolution device photographs must not require four unbounded full-size canvas buffers.

Pregame supports photo/crew/invitation memories; competitive facts become available only when recorded. Preserve album authorization, host storage accounting and public/private parity. Do not change billing or album quotas for this work.

Required coverage: one through four images; portrait/landscape combinations; replace/remove/reorder; independent crops; long names; missing/failed images; empty and pregame states; private/public routes; theme/layout switching; export parity; keyboard/focus behavior; carousel ordering and device-memory failures. Run the repository's required gate before any implementation commit; E2E execution remains separately opt-in under the project runbook.

## Delivery plan

1. **Visual prototype and player check:** make a contact sheet using the same real sample photos in all five looks, with one-, two- and four-photo layouts. Test with a small group of players: which would they actually share, and can they customize it without explanation? Collect organic-post references when accessible. No production rewrite before this visual checkpoint.
2. **Multi-photo foundation:** ship posters/collages, photo-count-aware defaults, independent crops, shared preview/export composition and the simplified controls. Polish all five looks against the same sample set.
3. **Carousel and Post output:** generate a coherent three-page recap, add page management and 4:5 reflow, then verify mobile export workflows.
4. **Refine with usage:** improve weak layouts and defaults before adding motion, a font catalog, AI cutouts or more art packs. Those are deferred ideas, not initial requirements.

## Make it a product hook

Recommend the same session album as a starting point, but let every player choose their own photos, words and result. The value proposition is personal ownership with almost no design work. A subtle Relay credit can aid discovery; large watermarks and mandatory promotional QR codes would compete with the memory.

Keep useful posters and collages available to free users. Later paid options could include additional art collections or saved personal styles, after evidence of value; no subscription changes are proposed here.

Measure photo selection → first successful export, time to first export, edits abandoned, export errors, repeat creation across games, and which layouts get used. Treat share-sheet handoff separately from an actual social post. A first usable export within 60 seconds is a usability test target, not a measured current result. Do not collect private image contents or captions for analytics.

The launch criterion is a composition players choose to share with minimal editing, with reliable crop/export behavior on mobile—not a larger number of templates.
