# Join policies, ratings, and the Relay “super app” direction

Research date: 2026-08-19

## Interpretation

“Let players first before they can join” could mean one of three controls:

1. the host approves the player;
2. the player pays before the spot is confirmed;
3. the player signs in before responding.

Relay should support all three eventually through one coherent **Join policy**, but they solve different problems and must not become three unexplained toggles.

## Executive decision

Relay can become more complete than Reclub for private and casual pickleball, but “super app” should mean **one complete session lifecycle**, not every sports-business feature.

The product should cover:

**Find court → create → invite → qualify/approve → repay → check in → play → score → recap → play again**

It should not expand into a public feed, tournament platform, professional rating system, venue marketplace, coaching marketplace, or generic club operating system.

The strongest positioning remains:

> **Everything a friend group needs for one great pickleball session.**

## Reclub benchmark

Reclub presents clubs, meets, competitions, and community as one platform. Its Meet tools include RSVP, waitlists, team assignments, and player management. Its payment system records a host’s bank or wallet details, lets participants pay externally—including through GCash—and accepts receipt screenshots for host verification. Reclub does not process the transaction. Its safety guidance tells players to inspect host history before transferring money. Reclub also supports external DUPR ratings.

Sources:

- [Reclub platform](https://reclub.co/platform)
- [Reclub payment confirmation](https://help.reclub.co/hc/reclub-help/articles/1765846764-i-requested-to-join-a-meet-competition-how-to-make-the-payment-to-confirm)
- [How Reclub payments work](https://help.reclub.co/hc/reclub-help/articles/1765845748-how-do-payments-work-in-recub)
- [Reclub and DUPR ratings](https://help.reclub.co/hc/reclub-help/articles/1765844537-how-do-i-get-a-dupr-rating)

Relay already overlaps with Reclub on RSVP, waitlists, external payment details, GCash-compatible proof, host confirmation, chat, court assignments, and scoring. Relay’s opportunity is not broader club functionality. It is a substantially better private-link, game-day, repayment, and memory experience for pickleball friends.

## Existing Relay behavior

Relay already has an optional `requiresApproval` session setting:

- it is off by default;
- a Going response becomes `pending`;
- the host receives a join-request notification;
- approval checks current capacity;
- an approved player becomes Going or Waitlisted;
- the host may reject or remove the player.

That is the correct default and foundation. The current setting should be made easier to understand and folded into a larger join-policy model rather than duplicated.

## Recommended join policy

### Default preset: Friends with the link

- Anyone with the link can understand the game.
- Guest RSVP is allowed.
- Going is confirmed immediately while spots remain.
- Capacity automatically creates a waitlist.

This remains the default because it produces the least work for a normal friend organizer.

### Optional preset: Host approves requests

- Anyone with the link can request a spot.
- Guest or account RSVP may be allowed.
- Requests remain Pending until approved.
- Approval assigns Going or Waitlisted based on current capacity.
- The host gets one actionable request inbox, not repeated messages.

This is the existing Relay behavior with clearer presentation.

### Optional preset: Payment confirms the spot

Use only for open or cost-sensitive sessions where no-shows create a real loss.

Recommended state flow:

```text
Request spot
→ spot held temporarily
→ player sees exact amount and host payment details
→ player uploads one proof
→ host confirms
→ Going
```

If the host rejects the proof or the hold expires, the place returns to the next eligible person.

Important constraints:

- This is **proof-required confirmation**, not “pay through Relay.”
- Relay cannot automatically know that a bank or GCash transfer is genuine.
- A player must see the host’s identity/history and refund/cancellation policy before paying.
- The host chooses a clear hold period, with a safe default such as two hours when the game is more than a day away.
- A host can override every state.
- Payment-first should be hidden unless an expense/collection exists.
- Existing friends manually added by the host can be marked exempt.

This feature creates more host review work. Use it only when it prevents more work than it adds.

### Optional preset: Account required

- The public link still shows the complete plan.
- Sign-in is required only when the person attempts to RSVP, chat, or pay.
- Existing guest-first sessions remain unchanged.

Use for public/open games where identity history matters. Do not use it as the default for friend links.

### Optional preset: Invite only

- Only explicitly invited account players or group members can join.
- Others can see an unavailable/request-access state depending on visibility.

Use for fixed crews and private paid reservations.

## Avoid a toggle wall

Hosts should choose an outcome-labeled preset, then optionally refine it under Advanced:

| Preset                | Identity               | Confirmation              | Best for                 |
| --------------------- | ---------------------- | ------------------------- | ------------------------ |
| Friends with the link | Guest or account       | Instant                   | Normal friend sessions   |
| Approve requests      | Guest or account       | Host approval             | Controlled rosters       |
| Payment confirms spot | Account recommended    | Proof + host confirmation | Cost-sensitive open play |
| Invite only           | Invited accounts/group | Invitation                | Fixed crews              |

The UI should explain the consequence in one sentence and preview what invitees will experience.

## Domain model

Join control has three independent dimensions even if the UI presents presets:

```text
Audience
- link
- group
- invited_only

Identity
- guest_allowed
- account_required

Confirmation
- instant
- host_approval
- payment_proof
```

Payment-proof confirmation additionally needs:

- hold expiration;
- required amount snapshot;
- proof status;
- host decision;
- exemption reason;
- cancellation/refund note;
- audit timestamps.

Do not overload RSVP status with every payment state. RSVP describes intent and roster position; confirmation requirements describe why the spot is not final.

## Ratings decision

“Ratings” must be separated into three unrelated concepts.

### 1. Playing experience: yes, keep it lightweight

Relay already uses:

- Just starting
- Casual
- Regular
- Experienced

This is the right default. It supports Balanced Mix without pretending to be an official rating. Display it only where it helps a decision: roster setup, team balancing, or an optional public-game requirement.

A host may optionally set a broad experience fit such as **All levels**, **Newer players**, or **Regular/Experienced**. Treat it as guidance or an approval aid, not an automatic exclusion by default.

### 2. Competitive rating: optional external identity later

If users demand it, Relay may display an optional verified DUPR value sourced from DUPR. Relay should not calculate its own numeric rating or market Session Standings as one.

This remains outside the friend-session V1 because it shifts behavior toward competition and increases profile anxiety.

### 3. Trust and reputation: show facts, not stars

For public or payment-required sessions, organizer trust matters more than a five-star score. Reclub’s own payment safety guidance tells participants to inspect host history before transferring money.

Show factual signals:

- account age;
- completed sessions hosted;
- mutual groups or players;
- verified email/identity when available;
- cancellation history in neutral language;
- clear refund/cancellation note;
- venue and prior session history.

Do not add public player star ratings. They invite popularity contests, retaliation, discrimination, and moderation work while making recreational play less welcoming.

Do not add venue ratings until Relay has enough verified visits, fraud controls, and moderation. **Last verified**, factual amenities, and official links are more useful initially.

## Better than Reclub: Relay’s wedge

Relay should be better in a narrow, coherent way:

1. **The link works before adoption.** Invitees understand and join without installing an app.
2. **The session is the product.** Plan, join rules, repayment, arrival, courts, scores, chat, and recap stay together.
3. **Game day is first class.** Check-in, fair rotations, multi-court scoring, shared timers, and realtime state are not secondary event fields.
4. **Philippine repayment fits reality.** GCash, Maya, bank, cash, proof, and host review are explicit without pretending Relay moved money.
5. **Court discovery hands into creation.** The host can find a place, book externally, and create with the venue prefilled.
6. **The night becomes retention.** Recaps, Play Again, and Save this crew make the next session easier.
7. **Social stays contextual.** No generic influencer feed or direct-message network is required.

## The complete organizer journey

### 1. Decide where

Find a court, compare trusted facts, open official booking, and select the venue.

### 2. Create the session

Date, time, capacity, courts, cost estimate, venue, and one join preset. Advanced requirements remain collapsed.

### 3. Invite

Share one rich-preview link. Invitees see the plan before authentication or payment.

### 4. Confirm the roster

Relay handles instant spots, approvals, payment holds, expiry, waitlist order, and promotion according to the selected policy.

### 5. Prepare

Readiness highlights only unresolved work: booking, minimum roster, unpaid confirmed players, missing court labels, or pending requests.

### 6. Arrive

Players mark themselves here. Late arrivals enter the next eligible rotation. The host handles no-shows without changing historical RSVP.

### 7. Play

Choose a clear format, optional timer, teams, courts, and score method. Everyone sees the same realtime assignments.

### 8. Close out

Confirm results and outstanding repayment without blocking session completion.

### 9. Remember and repeat

Generate the recap, add photos, share a story, Play Again, or save the recurring crew.

This is a “super app” because the lifecycle is complete—not because the navigation contains every sports category.

## Organizer automation that is worth adding

Prioritize automation that removes repeated host decisions:

- expiring approval/payment holds;
- one-tap approve/reject with capacity outcome shown beforehand;
- waitlist promotion and reminders;
- “needs attention” queue grouped by session;
- cancellation deadline and host-written refund policy;
- automatic payment-share recalculation before any proof is submitted;
- check-in and no-show handling;
- recent venue and Play Again defaults;
- post-session prompt to save the crew;
- reusable join-policy preset per group.

Avoid automation that silently changes teams, removes players, refunds money, or claims payment verification.

## Recommended sequence

### Phase 1 — polish existing approval

- Rename the control **Host approves join requests**.
- Show the invitee’s Pending state clearly.
- Give the host one actionable request queue.
- Preview whether approval means Going or Waitlisted.
- Add approval/rejection notifications and audit history.

Most of the domain behavior already exists.

### Phase 2 — identity requirements

Add account-required and invite-only policies for public/open or fixed-crew sessions. Keep the public plan visible.

### Phase 3 — payment-confirmed spots

Prototype with five real organizers who currently require advance payment. Validate hold duration, cancellations, exemptions, and proof workload before general release.

### Phase 4 — trust signals

Add factual host history for public/payment-required sessions. Defer star ratings and external competitive ratings.

### Phase 5 — reusable organizer templates

Let groups remember venue, join policy, capacity, court count, and common invitees. Do not introduce club administration unless repeated friend-group use proves it necessary.

## Success metrics

- join requests requiring manual chat outside Relay;
- median host time to resolve a request;
- approval-to-going conversion;
- payment hold completion and expiry rate;
- no-show rate by join policy;
- waitlist spots successfully filled;
- sessions reaching minimum players;
- second-session creation by the same host;
- support and dispute rate for payment-confirmed spots.

The goal is lower organizer work and more successfully played sessions—not more restrictions, more profile scores, or more screens.

## Final recommendation

Keep **Friends with the link** as the default. Improve the existing optional host-approval flow first. Add account-required and payment-confirmed spots as progressive presets for organizers who genuinely need them.

Show recreational playing experience and factual host trust. Do not add public player star ratings or a Relay-generated competitive score.

Relay can become a complete pickleball session super app, but its scope should end where venue commerce, professional ratings, leagues, tournaments, and generic social media begin.
