# Relay Sessions

Relay organizes recreational pickleball around one shared session while preserving the difference between account identity, participation, and management authority.

## Language

**Session**:
The shared plan, roster, payments, courts, conversation, results, and memories for one pickleball gathering.
_Avoid_: Event, game record

**Session workspace**:
The authenticated view of a session for an account participant. It presents the same session information as the shared link and adds only the actions that participant is authorized to take.
_Avoid_: Host dashboard, admin view

**Overview**:
The session’s at-a-glance home: plan, roster and waitlist state, current play, payment state, and the viewer’s next useful action.
_Avoid_: Plan tab, dashboard

**Play**:
The courtside part of a session: court assignments, paddle stack, rotations, matches, scores, and session standings.
_Avoid_: Game tab, Courts tab, Live tab

**Paddle Stack**:
Continuous open play. Waiting order controls the next match; the host chooses adaptive rotation, four-off/four-on, or winner-stays, then may mix partners or keep pairs together.
_Avoid_: Queue algorithm

**Keep pairs together**:
A Paddle Stack partner policy where two-player teams enter, play, and rotate through the queue as one unit.
_Avoid_: Adjacent paddles, tournament team

**Team Round Robin**:
Synchronized fixed-pair rounds where every pair plays every other pair once; an odd number of pairs receives deterministic byes.
_Avoid_: Tournament, bracket, league

**Mix It Up**:
Synchronized social rounds that prioritize fair rests, new partners, and fewer repeated opponents.
_Avoid_: Random mode, Americano tournament

**Balanced Mix**:
Synchronized social rounds that use each participant’s self-described playing experience to create teams with similar combined experience while still prioritizing fair rests. It is a session aid, never a rating or ranking.
_Avoid_: Skill matchmaking, rated play, competitive balance

**Court Climb**:
Synchronized multi-court rounds where winners move toward Court 1, losers move down, and former partners split.
_Avoid_: Ladder, King of the Court tournament

**Session readiness**:
The host’s concise setup state across roster, court booking, and player repayment collection. It guides preparation; it is not a quality score.
_Avoid_: Completion score, event health

**Session recap**:
The session’s factual result record: matches, points, court time, standings, and defensible highlights. It may be provisional during play and final after completion.
_Avoid_: Wrapped, rating, performance report

**Session story**:
The Story destination and completed session’s expressive layer: a manually controlled portrait story and game photos. A participant chooses one supported focus, a bounded layout, background, crop, contrast, and personal line. It remains part of the session rather than becoming a feed post.
_Avoid_: Social feed, freeform design editor, fabricated highlight

**Playing experience**:
A participant’s optional self-description—Just starting, Casual, Regular, or Experienced—used only to help friends form enjoyable teams. An account player’s value comes from their profile and changes only in profile settings; a guest player may choose a session-specific value while responding.
_Avoid_: Rating, rank, proficiency score

**Court directory coverage**:
The geographic area where Relay accepts court submissions, verified listing coordinates, and map requests. It describes supported geography, not an exhaustive inventory of every operating court.
_Avoid_: Complete court coverage, court inventory

**Open game**:
A published or live public session that has not ended and discloses either Free or an estimated per-player cost. Signed-in players discover and open it inside the authenticated session workspace, where they can join, request approval, or waitlist without leaving the app shell. The shared game link remains the account-optional external entry point.
_Avoid_: Community post, pickup feed

**Cost expectation**:
The pre-join price context for a session: Free, a per-player amount, or not set yet. Creation starts unset for every visibility. A public session becomes an Open game only after the host marks it Free or adds a per-player amount after creation. It is not a charge or checkout.
_Avoid_: Price guarantee, checkout amount

**Shared game link**:
The account-optional URL used to understand and join a public or link-only session. It is the canonical entry point for guests and invitees, not a separate copy of the session. A private session never becomes accessible merely because someone knows its identifier.
_Avoid_: Public version, guest app

**Invite**:
A host’s unanswered request for a Relay account player to join one session. Invites appear separately on Home and Games until the player chooses Going, Maybe, or Can’t go. Going may become **pending** when host approval is required or **waitlisted** when capacity is full; those are participation states, not unanswered invites.
_Avoid_: Pending game, notification only

**Account player**:
A session participant linked to a persistent Relay account and history.
_Avoid_: Authenticated user type

**Guest player**:
A session participant identified within one shared game link without a Relay account. Their participation remains session-scoped.
_Avoid_: Anonymous user

**Participant**:
An account player or guest player attached to a session with an RSVP state. Authentication does not itself make someone a participant.
_Avoid_: User

**Host**:
The participant who owns the session and may change its plan, roster, payments, courts, scoring, and completion state.
_Avoid_: Admin

**Host-paid expense**:
A shared cost the host already paid in full, optionally supported by a receipt. Relay divides repayment among the other going players; the host never owes a share or submits player payment proof.
_Avoid_: Host payment, invoice

**Player repayment**:
A player’s assigned share of a host-paid expense. The player pays outside Relay, submits one screenshot, and the host confirms it.
_Avoid_: Checkout, transaction

**Co-host**:
A participant delegated authority to manage a session’s plan, roster, payments, courts, and matches. A co-host cannot end or delete the session.
_Avoid_: Moderator

**Group**:
A reusable crew of account players who regularly organize sessions together. A group accelerates invitations and preserves shared session history; it is never required before creating a session.
_Avoid_: Club, league, community

**Group owner**:
The account player who creates a group and may add members. Any group member may host a new session for the group.
_Avoid_: Club administrator

**Platform admin**:
A Relay operator with platform-management access. Platform administration is separate from session participation and host authority.
_Avoid_: Session admin
