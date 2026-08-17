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
Continuous open play. Waiting order controls the next match; the host chooses adaptive rotation, four-off/four-on, or winners-stay-and-split before Play starts.
_Avoid_: Queue algorithm

**Mix It Up**:
Synchronized social rounds that prioritize fair rests, new partners, and fewer repeated opponents.
_Avoid_: Random mode, Americano tournament

**Court Climb**:
Synchronized multi-court rounds where winners move toward Court 1, losers move down, and former partners split.
_Avoid_: Ladder, King of the Court tournament

**Session readiness**:
The host’s concise setup state across roster, court booking, and player repayment collection. It guides preparation; it is not a quality score.
_Avoid_: Completion score, event health

**Shared game link**:
The account-optional URL used to understand and join a session. It is the canonical entry point for guests and invitees, not a separate copy of the session.
_Avoid_: Public version, guest app

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
A participant delegated session-management authority by the host.
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
