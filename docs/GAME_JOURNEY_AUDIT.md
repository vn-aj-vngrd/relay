# Game journey UX audit — 2026-09-13

Scope: create a game, manage its plan and roster, share with friends, respond as a guest or account player, prepare courts and arrivals, start and finish play, track payment, and export a Story. The primary user is a friend organizing from a phone, including courtside use. This is a targeted journey audit, not a complete accessibility, performance, or security certification.

## Findings and fixes

| Priority | Gap and user impact | Correction | Implementation reference |
| --- | --- | --- | --- |
| P0 | Submitting payment proof crashed the shared page with PostgreSQL error 42703. Drizzle rewrote nested expense columns to the outer payment alias; proof, review-note, and exclusion reads reused the broken condition. | Give the inner expense table a stable SQL alias, retaining current-collection checks under the session lock. Add regression tests against real Drizzle-generated relational-read and update SQL. | `src/features/payments/active-collection-query.ts` |
| P1 | RSVP’s Share game copied the current workspace URL. A friend receiving `/games/[id]` could hit authentication/access restrictions instead of the account-optional invitation. | Both route families now share the canonical `/s/[slug]` link through the existing ShareButton. | `src/features/sessions/rsvp-control.tsx` |
| P1 | RSVP acquired a session lock but continued using pre-lock lifecycle, access, approval, and capacity data. A concurrent host change could leave a response inconsistent with the current game. | Re-read the session under the lock; reject ended/closed games and apply current access, capacity, approval, and live-queue rules. | `src/features/sessions/actions.ts` |
| P2 | Approval-required invitations could say Confirm I’m going or Join waitlist before the host had approved the player. | Request to join and an explicit approval explanation now appear before submission, including invited players and full games. Existing approved participants retain their normal update path. | `src/features/sessions/rsvp-control.tsx`; both Overview routes |
| P2 | ShareButton threw on browser sharing/clipboard failure, and analytics could interfere with successful feedback. | Native-share failure falls back to copying; if both fail, show a selectable link in the shared Dialog. Cancellation is quiet, repeated taps are disabled while pending, analytics is best effort, and mobile menus stay mounted until recovery is done. | `src/features/sessions/share-button.tsx` |
| P2 | Setup called every eligible player “here,” even when the existing no-attendance fallback included all Going players. An unavailable Continue action also lacked a nearby explanation. | Say “in rotation” for eligibility; explain the existing arrival fallback and Mark all here; show how many more arrivals are needed beside Continue. No attendance or rotation algorithm was changed. | `src/features/matches/play-setup-form.tsx`, `play-setup-wizard.tsx`; setup route |
| P2 | On mobile, the proof upload CTA appeared before the recipient and QR details, asking for evidence before explaining where to pay. | Move proof submission after payment details on both route families; retained paid/closed QR images no longer say Scan to pay. | Both Payments routes |
| P2 | Payment details repeated Pay the host after proof submission or payment confirmation, potentially prompting duplicate payment. Cancelled games could also retain that instruction. | Suppress new-payment instructions on the account route unless a payable unpaid share exists; the shared route explains proof pending, paid, or cancelled status instead. | Both Payments routes |
| P3 | Story preview and export produced “matchs,” “1 points,” and “1 minutes.” | Use the existing plural helper with the correct irregular plural and singular counts in the shared layout. | `src/features/memories/story-recap-layout.ts` |

## Journey assessment

- **Create:** Existing Plan → Players → Details → Review progression, saved browser drafts, review editing, and payment-intent setup already support progressive disclosure. Retain this structure.
- **Manage and share:** Existing contextual host controls and created-game sharing panel are the reference. Reuse ShareButton and Dialog rather than a second share implementation.
- **Respond:** Keep account-optional guest entry, Going/Maybe/Can’t go, exact pending/waitlist outcomes, and the secondary account handoff. The corrected CTA now matches the server’s approval-before-capacity rule.
- **Prepare and play:** Keep the existing Players → Game options → Review wizard, booking gate, roster controls, stale-review protection, and live Players drawer. The changes clarify participation facts rather than adding steps.
- **Payments:** Preserve independent setup, expense breakdown, proof review, adjustment consent, and retained history. Submitted proof is not the same as payment confirmation.
- **Story:** Source inspection found existing local-photo validation, preview/customization, QR recovery, download fallback, export error feedback, and best-effort analytics. No speculative redesign was introduced; export inspection is recorded below.

## Validation record

- Local app: `http://localhost:3002`, backed by configured hosted Supabase.
- Dedicated non-admin test account provisioned with user authorization; see `AGENT_VALIDATION.md`. Credentials and browser state remain ignored.
- Targeted component/domain tests cover canonical sharing, native-share failure, clipboard failure, cancellation, analytics failure, approval language, concurrent closure, setup messaging, and both payment route families.
- TypeScript check passed after implementation.
- Changed files passed Biome after formatting.
- First authenticated browser attempt stopped at the dedicated account’s first-run tour before creating a game; this was setup interference, not a demonstrated game-flow defect. The tour was dismissed before restarting.
- Browser inspection confirmed a synthetic guest can decline without an account and retains the saved guest identity.
- Existing lifecycle assertions were updated for the visible first-run tour, itemized payment amounts, current host payment copy, and the correct Your payment heading level. Retained runs now save guest state to ignored test artifacts for focused follow-up.
- A later browser run reproduced the real proof-upload crash. A focused SQL-generation regression failed before the fix and passed afterward; 24 payment-related tests passed after the correction.
- The resumed host/guest lifecycle passed through guest joining, chat, payment setup, proof submission and confirmation, individual arrivals, booking selection, play setup/start, scoring, match completion, standings, ending the game, and both recap routes. Creation passed in earlier runs; this was verification in stages, not an uninterrupted clean run from creation.
- Desktop host (1440px) and mobile guest (390px) Play, Payments, and Story were inspected in light and dark themes, plus the guest overview in both themes. All 14 views had one page heading and no horizontal overflow; the 12 Play/Payments/Story views recorded no browser errors.
- Actual Story PNG export was inspected at 1080×1920. After correcting pluralization, host/guest Story captures and export were regenerated successfully; all 343 Story layout tests and the final TypeScript check passed.
- Five owned test games remain available for review; the completed lifecycle game is recorded in the ignored account Markdown. The account's five-game allowance has been used; no quota or plan was changed.
- On the subsequent commit request, `pnpm check:full` passed lint and typechecking; the full suite reported 2,018 passing tests and one failure caused by temporary E2E diagnostic wording. Restoring the original generic auth error resolved that failure: all four affected tests passed on rerun. The production build then passed. Unchanged passing checks were not repeated, following the code quality runbook.

## Intentional boundaries

The existing rule allowing all Going players into a first rotation before any arrivals are marked remains intact and is now disclosed accurately. Enforcing explicit attendance for every game would change that product rule and was not necessary to correct the misleading count. Payment processing remains external. No invitations were sent to real people and no money moved. The user subsequently authorized committing and pushing the audited changes.

Automated coverage does not establish CAPTCHA, SMTP, actual mobile operating-system share sheets, or external payment-app behavior. No aggregate UX/a11y score is assigned without evidence for those dimensions.
