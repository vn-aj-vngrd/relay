# Relay V1 launch plan

## Objective

Prove that Relay makes a real friend-group pickleball night easier than coordinating the same night in chat.

The launch is successful when at least 10 organizers each run two successful sessions within 30 days. A successful session is published, reaches four going players, and completes at least one match.

## Beachhead

Start with casual organizers in Metro Cebu—initially Cebu City, Mandaue, and Lapu-Lapu—who:

- arrange games in Messenger, WhatsApp, or iMessage;
- gather 6–16 friends on one to four courts;
- reserve with the venue separately;
- collect shares through GCash, Maya, bank transfer, or cash;
- care about fair court time more than ratings.

Relay is not initially marketed to clubs, tournament directors, venue operators, or players looking for a competitive rating.

## Positioning

**Category:** the shared home for a pickleball night with friends.

**Promise:** share one link. Everyone knows the plan, who is playing, what they owe, where they are next, and how the night went.

**One-line pitch:** Relay takes a pickleball night from group chat to game recap with one shared link—guest RSVP, courts, scores, repayment, chat, and memories included.

**Contrast:**

- Group chat gets people interested. Relay gets the game organized.
- Booking apps reserve the court. Relay handles everything around it.
- Rating apps record competitive results. Relay keeps friend games moving.

## Four-week launch

### Week 1 — recruit and observe

- Recruit five organizers personally.
- Set up their next real session together in under five minutes.
- Ask them to share Relay’s link in the group chat they already use.
- Observe creation, invite opening, RSVP, arrival, first match, and repayment.
- Record every moment when someone leaves Relay to coordinate in chat.

### Week 2 — remove activation friction

- Recruit five more organizers using the first sessions as concrete examples.
- Fix the three most repeated breakdowns before adding breadth.
- Verify Open Graph previews in Messenger, iMessage, WhatsApp, and Discord.
- Measure invite view → RSVP and published game → four going players.

### Week 3 — prove game day

- Attend or remotely observe at least three sessions with two or more courts.
- Validate check-in, late arrivals, timer, score correction, realtime updates, and reconnect behavior.
- Ask every host whether they would run the same night with Relay again.

### Week 4 — prove retention

- Prompt completed hosts to use Play Again.
- Offer Save this crew only after a repeated group is visible.
- Help participants share one genuine recap.
- Measure second-session creation within 14 and 30 days.

## Channels

1. **Organizer referrals:** ask after a host completes their second game, not during onboarding.
2. **Shared invite links:** the primary acquisition surface; every preview must explain the game before the click.
3. **Recap shares:** tasteful Relay attribution on a real photo or result.
4. **Local communities:** moderator-approved posts in Metro Cebu pickleball Facebook and Messenger groups.
5. **Venue partners:** a small “Organize your group after booking” QR or link at reception and in confirmation messages. No booking integration required.
6. **Organizer education:** practical guides about fair rotations, two-court nights, collecting shares, no-shows, and timed rounds.

Paid acquisition waits until second-session retention and invite conversion are known.

## Lifecycle metrics

| Stage    | Event or measure                                   |
| -------- | -------------------------------------------------- |
| Create   | `session_published`                                |
| Share    | `invite_shared`                                    |
| Join     | `rsvp_saved`; percent of invite views that respond |
| Ready    | sessions reaching four going players               |
| Play     | `play_started` and `first_match_completed`         |
| Finish   | `session_completed`                                |
| Remember | `recap_shared`                                     |
| Repeat   | `play_again_published` and `group_saved`           |

Review the funnel weekly in the admin console. Keep analytics free of names, messages, addresses, payment details, and scores.

## Interview script

Ask after a real session:

1. What still had to happen in the group chat?
2. When did you have to explain Relay to someone?
3. Where did play stop or become confusing?
4. Was collecting shares clearer than your normal method?
5. What would stop you from tapping Play Again next week?

Avoid asking whether the person “likes the app.” Ask for concrete behavior and comparisons with their previous process.

## Launch assets checklist

- Landing page with actual product surfaces and no invented metrics.
- Session-specific 1200×630 Open Graph image.
- Three portrait recap examples using real test session data.
- 15-second screen recording: create → share → guest RSVP.
- 20-second courtside recording: check in → start round → score → next matchup.
- One repayment example using fictional GCash/Maya details.
- Venue partner one-pager.
- Privacy policy and terms before public outreach.
- Support email and Help Center route checked from mobile.

## Release gate

Do not announce broadly until:

- password sign-up/sign-in and guest-to-account claim pass in production;
- public links preview correctly in common messaging apps;
- one host and one guest can see realtime roster, chat, score, and payment changes;
- daily reminders are idempotent;
- no P0/P1 issue remains from a 390px and 1440px dogfood pass;
- at least five real sessions complete without manual database repair.
