# Public launch review — 2026-09-16

Decision: public-release readiness is not yet established. Complete the critical journeys below before expanding beyond the existing beta. This is a source, runbook and deployment-evidence review, not a completed browser or security audit.

## Current evidence

- Clean local `master`: `e7d0ed4eeb865940e25098312b585ff08279bbd8` before this report.
- Production `/api/health` returned `status: ok`, release `e7d0ed4eeb86` on September 16.
- Current-commit [CI](https://github.com/vn-aj-vngrd/relay/actions/runs/35059649793), [CodeQL](https://github.com/vn-aj-vngrd/relay/actions/runs/35059649808), [Release](https://github.com/vn-aj-vngrd/relay/actions/runs/35060005871), and [health monitor](https://github.com/vn-aj-vngrd/relay/actions/runs/35063400954) succeeded.
- GitHub returned no runs for `reliability.yml`. This does not rule out separate local testing.
- The authenticated scenario in `e2e/smoke.spec.ts` requires explicit trusted-fixture opt-in and skips password/CAPTCHA. CI success cannot establish real signup or email delivery.
- Existing authorities: `PUBLIC_RELEASE_AUDIT.md`, `CRITICAL_USER_JOURNEYS.md`, `RELIABILITY.md` and `BETA_FIELD_SESSIONS.md`. Their historical findings need current evidence; their old pass records do not certify this commit.

## Launch-critical journeys

| Priority | Journey / gap | Acceptance before public launch |
| --- | --- | --- |
| Blocker | New visitor creates an account. Real CAPTCHA, confirmation delivery, login and recovery remain unverified in the journey register. | Use an approved mailbox: signup → receive email → confirm → onboarding → home. Also verify password reset and return from an invitation. Check mobile email opening in the same and a different browser; record any continuity limitation. |
| Blocker | Authentication navigation historically received 429s. September 13 evidence showed a firewall rule counting GETs as authentication attempts. Current rule was not inspected in this review. | Inspect live conditions, correct only if still necessary, then verify ordinary login/signup navigation and bounded shared-network navigation while keeping abuse protection enabled. |
| Blocker | Fresh organizer lifecycle has no current uninterrupted evidence. Prior resumed-game success does not cover creation. | On a dedicated account with available allowance: create → review → publish → open share link in a separate guest browser → RSVP → host sees roster → arrivals/booking → start Play → score → finish → recap. Confirm persisted state after reload at key transitions. |
| Blocker | Guest becomes an account user. `auth/destination.ts` claims the RSVP using a device cookie, but the matrix lacks real-browser verification. | Joining then signing up preserves one roster entry, status, game destination and authorized access. Existing invitations must not create duplicate players. Exercise email return/onboarding, not just direct password login. |
| Blocker | Core courtside collaboration lacks current multi-device proof. | Host and signed-in assigned player see the same court/score. A stale score submission cannot silently overwrite a result. Brief disconnect/reconnect restores authoritative state. Finish produces matching shared and authenticated results. |
| Blocker if advertised | Repayment and media uploads need current integrated evidence. | Guest sees recipient and exact amount, uploads proof, sees pending; host reviews and confirms; guest sees paid after refresh. Verify a normal phone photo, a rejected oversized upload, and recovery. No real transfer is required for software verification. |
| Blocker if enabled | Agent now includes saved chats and confirmed creation, beyond the older release audit. Migration 0062 and capability enablement are separate operations. | Verify applied schema and saved provider connection. Ask a real authorized-data question, restore chat, prepare a game/group, correct details, explicitly approve, and open the result. Double confirmation must create only one resource. Test disabled capabilities and exhausted allowance. Keep unverified capabilities disabled and align public copy. |
| Required | Story and repeat hosting complete the value loop. | Add a phone photo → customize → export → actual device share/download; verify readable image and correct game facts. Play Again preserves useful setup while requiring review of the new date and payment details. |

These are verification gaps unless explicitly labeled as a historical reproduced issue. They are not claims that each implementation is broken.

## Product and operating gaps

1. **Public access policy:** signup has a configurable account cap (schema default 200), and error handling still describes a full beta. Verify the actual cap and intended launch policy. Do not silently remove the safeguard.
2. **Paid-plan scope:** paid plans default to Coming soon; collection is manual and access starts after admin approval. If selling at launch, exercise request → proof → review → entitlement → renewal/expiry, including rejection and support. If launching free, ensure landing/pricing consistently describe what is available. Automatic charges and refunds are not implemented promises.
3. **Release record freshness:** the release authority still leads with September 13 and mixes older Complete rows with newer unresolved findings. Replace those statuses only with dated evidence for the actual release candidate.
4. **Real-world evidence:** the field log records 0/5 qualifying sessions. Run five observed games without database repair, as the existing release gate requires. Record friction that forces hosts back into group chat.
5. **Operations:** alert setup remains pending in the register. Verify alert delivery, operator response, current backup/restore and rollback/read-only procedures. A health endpoint does not prove these work.

## Recommended execution order

1. Fix the launch scope: core games plus only verified Agent capabilities; decide whether paid plans are open.
2. Establish approved mailbox, disposable test account with normal quota, and dedicated non-production backend for automated mutations.
3. Run the existing full reliability profile and real-auth smoke separately. Use the existing host/guest scenario as the reference; add missing real regression coverage where a failure is found.
4. Fix reproduced failures in small changes with their regression tests and Help Center updates. Run the pre-commit gate before authorized commits.
5. Verify the resulting deployed commit, real mobile handoffs and five field games. Update the release register with links, dates and remaining limitations.

No product code, configuration, account quota or deployment was changed in this review. Local test/build commands and browser suites were not run. Validation deferred to pre-commit. Current CI evidence above is independently observed and does not substitute for the missing journeys.
