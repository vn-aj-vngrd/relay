# Story design reassessment

The user rejected the latest five-theme iteration as still not reaching the intended visual quality. This is a direction study, not another shipped redesign.

## What is not working

- Four expressive themes share nearly the same headline / framed illustration / bottom facts composition. Different paper and borders do not establish distinct visual identities.
- The central vector scene reads like inserted clipart. It consumes substantial space without expressing the particular game.
- Too much of the personality comes from edge decoration; the information and image placement remain predictable.
- Every meaningful value receives a similar treatment. A crew keepsake, personal result, and game invitation should not have identical visual priorities.
- Phone previews are readable after the name fix, but readability alone does not make someone want to share them.

## Keep

Truthful game data, full names, independent photo crop, accessible theme/focus controls, shared preview/export geometry, existing route access rules and join details. Keep Relay's app shell and five recognizable theme choices.

## Next visual decisions

Create a comparison board with sample data before another implementation pass:

1. **Sport editorial:** large type integrated with a dynamic photographic crop; name as identity, score as the focal event, compact game context.
2. **Courtside diary:** actual friends and photographs dominate; layered candid memories with a short personal caption, practical metadata subordinate.
3. **Graphic play:** confident oversized court/ball forms and expressive typography; strong no-photo composition without an illustration boxed in the center.

These are composition studies, not proposed new theme IDs. The selected direction should guide the five existing themes while leaving each with its own structure. Photos in a generated concept are illustrative; real Story must use a selected game/device photo and supply an intentional no-photo composition.

## Implementation acceptance

- A photo story and a no-photo result look materially different in silhouette.
- Each theme has a recognizable composition without relying on borders or color alone.
- Long names stay complete, independently fitted and clearly secondary to the chosen moment where appropriate.
- A person can identify the game's memorable subject at thumbnail size.
- Type and artwork share the composition instead of occupying disconnected stacked boxes.
- Only recorded facts become metrics. Optional playful captions remain user choices.
- Preview and downloaded PNG agree before claiming export fidelity; native platform overlay compatibility requires separate evidence.

No application code changed in this direction-study turn. Automated validation remains deferred to pre-commit.


## Selected direction B: photo memories

The user selected courtside diary, superseding the sports-editorial concept. Implemented a visible photo placeholder, direct attachment/gallery controls, larger photo area, editable caption with prompts, compact real game statistics and results, and thin theme-specific mat treatments across all five themes. Completed games default to Your story and Scrapbook. Reused RecapShareCard photo validation/local decoding, shared scene geometry, theme paths, and TabChipRail. The intentional difference is the photo-first entry and caption handwriting.

Latest visual verification is blocked: the separate Edge review tab remains blank while loading the local Story route. The existing user tab and its local photograph were preserved. No latest-pass PNG parity or responsive verification is claimed. Unit and E2E coverage updated but not executed. Validation deferred to pre-commit.
