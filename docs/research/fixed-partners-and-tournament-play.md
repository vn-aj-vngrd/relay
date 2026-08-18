# Fixed partners and tournament-shaped play

Research completed before implementation. Relay now follows this recommendation with **Keep pairs together** in Paddle Stack and **Team Round Robin** as the bounded fourth setup; generic tournaments remain out of scope.

## Question

Should Relay add more Play setups, especially a tournament option or a way to keep pairs together?

## Recommendation

**Add fixed partners before adding another Play mode. Do not add a tournament mode to the consumer session flow.**

Fixed partners solve a common social need—couples, regular doubles partners, or friends who arrived as a pair—without changing Relay into competition software. They should be an explicit **partner policy** inside existing Play setups, not a fourth top-level mode:

- **Mix partners** — current behavior and the default.
- **Keep pairs together** — host defines two-player pairs before Play starts.

This separation matches Swish’s first-party recreational product, which distinguishes rotating-partner and set-partner formats while listing pool play and elimination brackets as separate, more formal formats [1].

A future **Team Round Robin** could be justified if groups repeatedly ask for every fixed pair to play every other pair. It should be a later preset built on fixed-pair infrastructure—not a generic “Tournament” button.

## Why fixed partners are the right next depth

### The behavior is familiar

Official pickleball doubles consists of two-player teams. USA Pickleball’s tournament rules treat a doubles partnership as a real competitive unit and tightly restrict partner substitution after competition begins [2]. Relay does not need tournament-level rigidity, but the underlying expectation is familiar: some people want to play the night with the same partner.

Swish explicitly offers both rotating-partner and set-partner recreational formats [1]. That is stronger evidence for a partner choice than for adding another named algorithm.

### Existing open-play rules make a different choice

Fixed partners cannot be silently layered onto Relay’s current adaptive Paddle Stack. Lexington Pickleball Club’s published policy deliberately splits the winning team when one to three players are waiting; with four or more waiting, all four players rotate off [3]. Relay’s current adaptive and winner-stays rules follow this social-mixing pattern.

Therefore, “keep pairs together” must visibly change the active rule:

- a pair enters and leaves the queue as one unit;
- a winning pair stays together;
- the next waiting pair enters together;
- four-off means two complete pairs rotate off;
- a consecutive-game cap still protects fairness.

The Play screen should state this directly: **“Pairs stay together · winners may stay for 2 games.”**

## Recommended product model

Partner policy and court flow are separate decisions:

| Concern        | Choices                              | Meaning                        |
| -------------- | ------------------------------------ | ------------------------------ |
| Play setup     | Paddle Stack, Mix It Up, Court Climb | How courts and rounds progress |
| Partner policy | Mix partners, Keep pairs together    | Whether partnerships change    |
| Queue rule     | Adaptive, four rotate, winners stay  | Who leaves after a match       |
| Scoring        | Result only, point-by-point          | How a result is recorded       |

### Compatibility

| Play setup   | Mix partners | Keep pairs together | Recommendation                                                                      |
| ------------ | -----------: | ------------------: | ----------------------------------------------------------------------------------- |
| Paddle Stack |          Yes |                 Yes | Best first place for fixed pairs                                                    |
| Mix It Up    |          Yes |                  No | Keeping pairs contradicts the purpose of the mode                                   |
| Court Climb  |          Yes |               Later | Fixed teams moving between courts is valid, but requires synchronized team movement |
| Manual       |          Yes |                 Yes | Host may preserve or change pairs directly                                          |

The UI should reveal **Partner style** only after the host chooses a compatible setup. This preserves the fast default.

## Fixed-pair setup flow

1. Host chooses **Paddle Stack**.
2. Under **Partner style**, the default remains **Mix partners**.
3. Host chooses **Keep pairs together**.
4. Relay proposes pairs from roster order.
5. Host swaps players using a compact pair builder.
6. Unpaired players remain visibly unassigned; Play cannot start until every active doubles player is paired.
7. The queue displays pairs as one row: `Van + AJ`, not two loosely adjacent players.

Useful safeguards:

- one player belongs to at most one active pair;
- pairs can be changed before Play starts;
- changing a pair after matches exist requires explicit confirmation and affects future matches only;
- a late arrival is waiting until paired or manually assigned;
- if one partner leaves, the pair becomes unavailable rather than silently borrowing another player;
- the host can switch back to mixed partners between matches, never during an active match.

Singles should remain independent of pair setup.

## Why “Tournament” should not be a Play mode

USA Pickleball treats round robin, elimination, and pool-based competition as formats with advancement and ranking rules [2][4]. Swish similarly separates recreational set-partner play from pool play that feeds elimination brackets [1]. A tournament therefore introduces substantially more than court rotation:

- registration and entry rules;
- fixed teams and substitutions;
- seeding or random draws;
- pools, brackets, byes, and advancement;
- synchronized rounds and delayed courts;
- tie-break rules;
- correction behavior after the next round is generated;
- winners and final placement.

That conflicts with Relay’s explicit session-first, recreational scope. Calling a simple rotation “Tournament” would also set the wrong expectation.

### The acceptable tournament-shaped option

If demand appears, add **Team Round Robin**, described plainly as:

> Keep partners and play every other pair once.

This is bounded and understandable. It needs:

- an even number of paired teams, with byes when needed;
- deterministic round generation;
- court-capacity scheduling;
- progress such as `Round 2 of 5`;
- team results for the current session only;
- no seeding, elimination bracket, rating, prize, or official standing.

It should appear under an advanced “More ways to play” disclosure only after fixed pairs are proven.

## Architecture implications

Relay’s `session_queue` remains player-based, while `match_players` records teams inside one match. Persistent pair identity is stored explicitly in `session_pairs` and `session_pair_members`, rather than as an array hidden in rotation configuration.

The implemented model contains:

- a session pair/team record;
- exactly two active `session_players` per doubles pair;
- pair status: waiting, playing, resting, unavailable;
- queue position at the pair level;
- creation and retirement timestamps so completed matches retain historical truth.

The existing match model can continue snapshotting players onto Team A and Team B. Pair membership should guide future assignment, not rewrite past matches.

Do not implement fixed pairs as two adjacent individual queue entries. Reordering, late arrivals, and concurrent host changes would eventually separate them.

## Sequencing

1. **Implemented:** Keep pairs together in Paddle Stack.
2. **Implemented:** Team Round Robin with deterministic rounds and automatic team byes.
3. Validate pair queueing, winner-stays behavior, departures, and session history through real use.
4. Extend fixed pairs to Court Climb only if requested.
5. Keep elimination brackets and generic tournaments out of Relay.

## Decision in one sentence

**Relay needs a fixed-partner policy, not more mode tiles; Team Round Robin is the only sensible later addition, and tournament brackets remain out of scope.**

## Sources

1. Swish Sports App, “Recreational Play” — first-party product page listing rotating partner, set partner, mixed gender, winners-up/losers-down, team, pool-play, and elimination capabilities as distinct formats. https://swishsportsapp.com/recreational-play/
2. USA Pickleball, “Official Rulebook” — official definitions for doubles teams, round robin, tournament formats, and partner substitutions. https://usapickleball.org/docs/rules/USAP-Official-Rulebook.pdf
3. Lexington Pickleball Club, “Court Rotation Policy” — first-party club rules for four-off/four-on under a long queue and winners-stay-but-split under a short queue, including a two-game cap. https://www.lexingtonpickleballclub.org/court-rotation-policy
4. USA Pickleball, “Approved Tournament Formats” — official scoring and format guidance for round robin and elimination competition. https://usapickleball.org/sanctioning/formats/
