# Court Pop implementation handoff

Date: 2026-09-14. Branch: `van/story-court-pop`. Uncommitted implementation; validation deferred to pre-commit.

## Scope and reference

Implemented the approved [Wrapped 2025 Story plan](../research/story-wrapped-2025-plan.md). The reference is the existing `RecapShareCard` / `RecapStoryCard` composer and its shared invitation/recap row layouts, artwork paths, photo geometry, native-share and PNG flow. Reused `TabChipRail` for visible vector theme covers, including its selected-state and focus-reveal behavior. The new optional item renderer leaves existing rail callers unchanged.

Court Pop is now the composer default. Its subject/art/details composition replaces only Court Pop's former art-first baseline. Original court, paddle and ball graphics have separate game, people and result treatments; framed photography retains the existing placement/crop contract. Saturated colors accent paper and results; Baby Pink tints the paper. Minimal and the other themes remain available. Customize now contains Background and Message, with opt-in editable caption suggestions. Mobile previews use a readable 320px width rather than a viewport-height cap. No dependencies, data contracts, uploads, posting permissions or game facts were added.

## Inspection and coverage

A bounded manual inspection used the running local app: the shared completed Story at 390×844 and the authenticated completed Story at 1440×1000. Court Pop opened selected, theme covers and export controls were visible, and the rendered recap/result compositions retained their existing session context. The browser viewport override was reset afterward. These observations cover the inspected light-theme, no-photo session only; they do not establish all lifecycle/role combinations, accessibility conformance, photo export fidelity or social-platform safety.

Authored/updated tests cover the default and visible theme selection, independent customization, opt-in captions, preview/Canvas row coordinates, artwork/selected-accent agreement, footer-aware invitation allocation and non-overlapping story regions. The synthetic Story E2E fixture now uses current SVG factual rows rather than removed fitted-HTML selectors and exposes the new default. Journey J13 and DESIGN.md describe the changes.

No lint, formatting check, typecheck, unit suite, build, E2E or hook command was run. No commit, push or PR was created. **Validation deferred to pre-commit**: run `pnpm check:full` before an authorized code commit. E2E execution remains opt-in. Actual downloaded PNGs, local/session-photo combinations, dark theme, QR recovery and native social sharing still need the planned verification.

## All-theme follow-up

Expanded the redesign to Minimal, Scrapbook, Coquette and Retro Rally. Added theme-specific shared SVG/Canvas edges, expressive paper palettes and accent details, refreshed illustrations and thumbnail covers, and extended the fitted poster layout to every expressive theme. Minimal keeps its solid palette and factual baseline with restrained court corners. Existing Story scene, photo mat, footer, chip rail and export implementations remain the reference. Added unit coverage for all-theme paper/photo preservation, edge parity, selected accents and footer-aware poster separation; the existing five-theme creative E2E journey remains applicable. Validation deferred to pre-commit.

Bounded visual inspection: signed-in local completed-game Story, no photo, Coral palette; manually inspected the five themes. This does not establish PNG pixel parity, full-background photo contrast, published invitations, mobile coverage or passing automated checks for this follow-up.

## Long-name and social-creative refinement

User screenshot reproduced an oversized username split. Shared heading fitting now reduces only the headline to preserve ordinary handles, wraps complete words, keeps team connectors with names, and balances exceptional breaks using grapheme clusters. All expressive art and theme covers vary by invitation, people and results; Minimal no-photo recap facts are vertically balanced. Existing shared copy preparation, Story scene and Canvas/SVG art remain the reference implementations. Unit coverage and the five-theme E2E fixture now cover the reported username. No tests, build, typecheck or lint ran; validation deferred to pre-commit.

Research: `docs/research/story-social-creative-references.md` contains six primary sources with explicit access limits. No claim of observed viral feed trends or universal platform safe zones. Manual inspection on the signed-in completed-game route covered Court Pop desktop and all five no-photo Teal result previews at 390 × 844. The username remained whole. PNG file parity, native social draft overlays, published invitations and photo variations remain unverified in this pass.


## Selected direction B: photo memories

The user selected courtside diary, superseding the sports-editorial concept. Implemented a visible photo placeholder, direct attachment/gallery controls, larger photo area, editable caption with prompts, compact real game statistics and results, and thin theme-specific mat treatments across all five themes. Completed games default to Your story and Scrapbook. Reused RecapShareCard photo validation/local decoding, shared scene geometry, theme paths, and TabChipRail. The intentional difference is the photo-first entry and caption handwriting.

Latest visual verification is blocked: the separate Edge review tab remains blank while loading the local Story route. The existing user tab and its local photograph were preserved. No latest-pass PNG parity or responsive verification is claimed. Unit and E2E coverage updated but not executed. Validation deferred to pre-commit.
