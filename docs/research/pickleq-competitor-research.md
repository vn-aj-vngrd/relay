# PickleQ competitor research

Research date: 2026-09-21. Target: **pickleq.app**, the Philippine open-play product operated by PickleQ.app Technologies OPC. Findings do not describe similarly named apps or third-party competitor comparisons. Operator attribution: [official privacy notice](https://pickleq.app/privacy/).

## Evidence boundary

Read the official homepage, September 2026 product guide, terms, privacy notice, and refund policy. The research agent's Chrome initialization failed twice, but the lead auditor subsequently viewed the public homepage and setup/live tour images in the in-app browser. Automatic approval review blocked the Start free action because it might create an external session. Consequently, this is a **published-product and public-tour audit**, not a completed hands-on usability test. No signup, club creation, payment, real player entry, offline test, or notification test occurred.

## What PickleQ publicly promises

The homepage leads with rapid setup, no signup, offline operation, and free play for up to four courts. Its three-part tour follows setup → running courts → player visibility. Free features advertised include matching, queue/standings sharing, roster import, and saved players. Venue Pro adds larger venues, self check-in, kiosk winner reporting, and DUPR-oriented results. These are **official claims**, not measured setup speed, reliability, or retention. [Homepage](https://pickleq.app/)

The current guide documents:

| Journey | Documented behavior |
| --- | --- |
| First session | Separate casual and club paths; casual play needs no account. Balanced is recommended. |
| Attendance | Saved roster, Reclub import, walk-ins, check-in/out, late arrivals, and optional fixed partners. |
| Queue | Check-in order supplies the base; players see position, games, skill, and estimated wait. |
| Court transition | The guide describes staged matches and staff-controlled starts; this is not a universal prohibition on automatic dispatch (see kiosk exception below). |
| Recovery | Undo, manual replacements, and corrections to older results. |
| Player view | Connected-club live page; selecting a name can enable alerts, vibration, or a chime, subject to browser permissions. |
| Return visit | Retained roster/settings, player result cards, shared results, and club lifetime records. |
| Constraints | Local data belongs to its browser/device; public live pages require a connected club and published session. |

These capabilities are **documented**, not independently exercised. [Official product guide](https://pickleq.app/how-to-use.html)

**Observed public-tour exception:** the desktop play screenshot shows two courts side by side, with the queue and Up Next together below. It also displays “Kiosk auto-send: On” and “Pause auto-send”; its explanatory copy says kiosk results can record automatically and send the next match to court. Therefore, PickleQ publicly presents both staff-controlled staging and optional kiosk automation. The guide mentions configurable kiosk result behavior but does not fully reconcile this exception with its manual-start explanation. Actual defaults and dispatch behavior remain untested. [Official play screenshot](https://pickleq.app/screenshots/PickleQ-GameScreen.png)

## Pricing and adoption friction

Venue Pro is prepaid per club: **₱199 / 24 hours, ₱599 / month, ₱1,499 / three months, ₱4,999 / year**. These are one-time purchases with no automatic renewal. Pricing checked in official terms on the research date; recheck before making public comparisons. [Terms](https://pickleq.app/terms/)

Unused access or change of mind normally does not qualify for a refund; service failure and duplicate-charge remedies are documented. This makes a short paid pass an available trial-sized purchase, although its conversion effectiveness is unknown. [Refund policy](https://pickleq.app/refunds/)

## UX interpretation and opportunities for Relay

These are **audit hypotheses**, not findings that Relay already outperforms PickleQ:

1. **Compete on confidence during play.** The useful outcome is a player knowing whether they are waiting, preparing, playing, or taking a break. Test whether someone can identify their state and next action within five seconds on a phone, without asking the organizer.
2. **Make the court handoff obvious.** Present the finished game, its consequence, and the next deliberate action together. If automation is available, make its enabled state and pause control obvious so a result tap has a predictable consequence. Measure organizer actions and idle time per transition.
3. **Explain fairness without promising certainty.** Show understandable ordering reasons and distinguish a preview from a committed assignment. If reliable duration data is unavailable, prefer position or games ahead over a precise-looking wait estimate.
4. **Protect the first session from configuration overload.** Put names, available courts, and a sensible default first. Reveal advanced choices when they become relevant. Measure time to the first playable court rather than page completion alone.
5. **Make mistakes cheap to fix.** Result correction, player departure, an occupied court, and an accidental tap are ordinary courtside events. Include recovery in the main journey audit, not only the success path.
6. **Earn return use through remembered work.** Reusing a group, resuming a session, and sharing an honest personal recap are stronger hypotheses than adding generic streaks or notification pressure. Measure repeat organizer sessions and repeat player participation; sharing alone does not prove retention.

A fair comparison should test the same 12-player/two-court scenario, including one late arrival, one break, one mistaken result, and one connection interruption. Count successful actions, recovery effort, uncertainty, and facilitator questions. Do not claim a winner without comparable hands-on evidence.

## Official visual references for the next audit pass

- [Setup](https://pickleq.app/screenshots/PickleQ-Setup.png)
- [Live courts and queue](https://pickleq.app/screenshots/PickleQ-GameScreen.png)
- [Shareable player results](https://pickleq.app/screenshots/PickleQ-ShareStats.png)

These are first-party illustrative screenshots linked from the guide, not proof of current responsive behavior, accessibility, or performance.

## Remaining evidence needed

Live desktop/mobile walkthrough, keyboard and screen-reader exercise, actual no-account setup time, live-view latency, notification permission behavior, loss/recovery of connectivity, and a real repeated-session study. No claims about adoption, matching quality, wait-estimate accuracy, or retention are supported by this research.
