# Relay Story: photo collage and carousel platform evidence

Research checked 2026-09-14. Research and product recommendations only; no implementation or posting performed.

## Decision supported by this research

Make photos and the story sequence the core of Story. Offer a single-photo poster, a multi-photo collage, and an ordered carousel as formats of the same editable recap. Keep visual themes separate from formats and narrative recipes: changing a theme should not remove photos or force a particular kind of story. This is a Relay product recommendation, not a platform requirement or a measured engagement result.

## Primary-source findings

| Evidence | What it supports for Relay | Boundary |
| --- | --- | --- |
| TikTok's Photo Mode announcement describes still-image carousels, music, and viewer-controlled swiping; its concrete examples include artwork, fashion diaries and photography. [TikTok Newsroom, October 2022](https://newsroom.tiktok.com/editing-tools?lang=en) | A court diary or match-day album can be a native photo sequence; video production is unnecessary. | Historical format introduction, not proof of what is trending in September 2026. |
| TikTok's 2025 forecast encourages creator/community collaboration and content with personality. [TikTok Newsroom, January 30, 2025](https://newsroom.tiktok.com/tiktok-whats-next-report-2025?lang=en-ZA) | Personal captions and a group's own humor belong beside results. | Marketing forecast, with regional context; no claim about pickleball post performance. |
| TikTok Next 2026 forecasts interest in candid stories, behind-the-scenes moments, process and community. [TikTok Next 2026, checked September 14, 2026](https://ads.tiktok.com/business/en-US/next) | Let ordinary court photos, missed shots and after-game moments coexist with polished hero images. | Forecast for brands; not an independently measured ranking of current creative formats. |
| TikTok's Image Ads Playbook advises a strong first image, continuous narrative, legible text, visual consistency, vertical 9:16 composition and safe-zone placement. [TikTok playbook, pages 7–8; undated](https://ads.tiktok.com/business/library/Image_Ads_Carousel_Ads_Playbook.pdf) | Compose a readable cover, then distinct story beats; preserve a coherent visual system across slides. | Advertising guidance. The publicly accessible PDF contains draft placeholders later in the document and conflicts with newer help on some ad availability. Do not use its performance statistics, slide-count recommendations or availability tables as organic-product evidence. |
| Instagram explicitly introduced music for photo carousels, using summer memories and camera-roll moments as examples. [Meta, August 11, 2023](https://about.fb.com/news/2023/08/music-and-collabs-on-instagram/) | Export a photo set; users can add the soundtrack within Instagram. | Announcement establishes the capability, not all current account-specific limits. |
| Instagram's Frames sticker presents photos as instant prints; Cutouts turns a photo subject into a reusable sticker. [Meta, May 3, 2024](https://about.fb.com/news/2024/05/new-stickers-in-instagram-stories/) | Framed snapshots and small personal photo details are recognizable visual vocabulary for a casual court diary. | An exported raster cannot preserve native interactive stickers. |
| Canva supports grids/frames, photo replacement, independent crop/scale, text and image export. [Canva combine-images product page, checked September 14, 2026](https://www.canva.com/es_es/funciones/combinar-imagenes/) | Use fixed arrangements with photo swapping and crop adjustment; broad freeform editing is unnecessary for the initial experience. | Product capability, not usability or engagement evidence. |
| Unfold separates Story and Post templates; its post documentation specifies 4:5. Its product page offers templates, photo editing and optional brand customization. [Unfold help, December 16, 2020](https://help.unfold.com/hc/en-us/articles/360054433031-Using-post-templates), [Unfold, checked September 14, 2026](https://unfold.com/) | Keep photo layouts easy to start and colors/text easy to personalize, while retaining format-specific composition. | Older template documentation is not the current Instagram specification. |

## Five adaptable pickleball recipes

These are original Relay proposals inferred from the patterns above, not reproduced viral posts. Names are working labels for content recipes, not five additional visual themes. Every recipe can use the same theme collection.

| Recipe | Concrete sequence | Poster/collage equivalent | Data boundary |
| --- | --- | --- | --- |
| **Court diary** | Cover: “Sunday at the kitchen” + favorite photo → arrival/paddles → action → teammates → post-game snack/group picture. Keep captions optional and conversational. | One large hero plus 2–4 smaller snapshots and date/court. | Works without scoring; do not fabricate competitive highlights. |
| **The match we nearly lost** | Cover with the actual result → optional user-supplied setup → decisive moment/photo → final result → group reaction. | Two opposing player/team photos, recorded score, one short personal caption. | A comeback requires real score history or an explicit user-written account. A final score alone cannot establish the story. |
| **Meet the crew** | Group cover → partner portraits or pairs → a shared court moment → “Same time next week?” ending. | 2×2 or asymmetric portrait collage, names optional. | Use selected people/photos; attendance is not proof every person is pictured. Avoid inferred rankings or awards. |
| **Firsts worth keeping** | “First open play” / “First tournament together” cover → first moment → favorite rally/photo → personal takeaway → closing portrait. | One hero with a supporting detail photo and a short milestone line. | Milestones come from the user unless the product can establish them. Avoid inferring first win, lifetime totals or skill level. |
| **One session, five moments** | Cover → best action photo → funny miss → paddle/ball/detail → friends → final court photo. Use an intentionally varied camera-roll rhythm. | Contact sheet with one dominant image, up to five supporting photos, minimal labels. | The photos carry the story; optional recorded session count/result is secondary. No unsupported “longest rally” statistic. |

Recommended default: propose 4–6 slides when enough photos exist, with add/remove/reorder controls. This is a manageable product starting point to test, not a platform-proven optimum. One photo should produce a strong poster; two photos should produce a deliberate diptych; missing images should reduce the layout rather than create fake placeholders.

## Practical customization and export proposal

Expose four decisions in order: **photos → format/layout → look → wording**. Keep replace, reorder, crop, headline, caption, accent color and show/hide session facts available. Keep a theme's typography and spacing coherent by default. No arbitrary layers, font catalog, automatic invented awards, or mandatory statistics are needed to serve these recipes.

| Destination | Proposed Relay output | Verified constraint / caveat |
| --- | --- | --- |
| Instagram/TikTok story-oriented sharing | 1080×1920 raster (9:16), one file per slide; preview with room for destination controls. | Product canvas recommendation. TikTok's ad guide supports 9:16 direction, but native organic safe zones and behavior still need device verification. Do not promise a single exact safe-zone geometry across apps. |
| Feed poster/carousel | 1080×1350 raster (4:5) with all slides composed to the same ratio. Optional square later if demanded. | Conservative product choice consistent with Unfold's documented post layout, not a claim that 4:5 is Instagram's tallest/current maximum. Current Instagram Help Center resolution content could not be retrieved in this run; newer 3:4 support and exact carousel limits require direct primary verification before hard-coding. |
| Download/share files | JPEG for photo-heavy output, PNG option where useful; ordered filenames and a cover-first preview. | Distinguish successful file creation/share-sheet handoff from a completed social post. A ZIP is useful for desktop bulk download but cannot be assumed to import as a mobile carousel. |
| Future TikTok direct publishing | Separate integration, outside this design scope. | TikTok's photo API allows up to 35 image URLs and requires publicly accessible verified URLs; unaudited clients are limited to private visibility. Its media-transfer guide specifies JPEG/WebP, maximum 1080p and 20 MB per image. These are API limits, not universal native-app upload limits. [Photo API](https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post), [media transfer](https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide) |

Music should be added in the destination app for the initial image-export flow. Raster images cannot carry playable music, clickable mentions, native stickers or accessible text semantics. Offer a copyable caption/image-description companion if feasible; do not imply that painted text or a pictured URL remains interactive.

## Research limitations and required follow-through

- Direct TikTok creator posts under `tiktok.com/@` were blocked by robots.txt. No individual pickleball photo carousel was visually inspected, and no claim of current virality, engagement lift or regional popularity is made. Search results dominated by TikTok Shop listings were excluded as creative evidence.
- Official source examples establish useful creative vocabulary, not a validated Relay conversion outcome. A dated visual reference set of accessible organic pickleball/sports posts remains necessary before claiming the design reflects current platform trends.
- The 2025/2026 material is platform marketing/forecast evidence. Editorial posters, camera-roll diaries and collages are design directions to test, not independently verified “top trends.”
- Validate exports in Instagram and TikTok on actual target devices: slide order, chosen cover, crop, text size, face framing, image quality, multiple-file share support and save fallback. This research did not perform app posting or implementation checks.
- Consolidate the existing five themes through the main product/code review. This note deliberately proposes no replacement theme names: formats, recipes and themes should remain separate choices so all five can share the same photo and export machinery.
