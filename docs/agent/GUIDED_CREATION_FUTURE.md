# Guided creation — deferred proposal

Status: deferred on 2026-09-16. Current creation is chat-only; see [Capabilities](CAPABILITIES.md) for the shipped contract. The form implementation was removed because it interrupted the conversational experience. This document preserves the idea, not an implementation requirement.

## When to reconsider

Revisit only with a new product request or evidence that users struggle to enter structured details in chat. Compare completion, corrections, and abandonment against the current one-question-per-reply flow before choosing a form.

## Candidate interaction

- An optional question panel above the composer, matching the Actions popover width and surface.
- One focused question at a time, visible progress, Back and Next, and free-text answers alongside relevant choices.
- Prefill saved chat details and retain answers when navigating steps or dismissing the panel.
- Keep chat available and support switching without losing answers.
- Bound the panel to the viewport and account for mobile keyboards and keyboard navigation.

Possible sequences: game/draft court and schedule → players/settings → review; replay/group game/crew source → details → review; group name/description → review; Quick Play players → courts/format → review.

## Implementation gate

Start from the current shared preparation, validation, proposal, and confirmation services. Avoid retaining dormant UI or introducing a separate creation engine. Review accessibility, mobile layout, persistence and recovery before enabling it. Completion requires coverage for switching modes, reloads, failed saves, corrections and stale approval IDs, plus updated Help Center guidance.

Every path ends at the same explicit approval review. Next, chat replies, and form submission alone must never create resources. Changed details require a new review.
