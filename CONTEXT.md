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
