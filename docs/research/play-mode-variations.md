# Play mode variations for Relay

Historical research. Relay initially shipped the three recommended social setups. A later focused decision added **Keep pairs together** and **Team Round Robin**; see [`fixed-partners-and-tournament-play.md`](./fixed-partners-and-tournament-play.md).

## Question

What play setups beyond a basic paddle stack could make a friends-only pickleball session more fun without turning Relay into tournament software?

## Executive recommendation

Relay should not present a long catalog of sports formats. The useful choices collapse into **three understandable experiences**, with Manual available as an escape hatch:

1. **Paddle Stack** — “Keep courts moving.” Best default for drop-in play, uneven attendance, and players arriving or leaving.
2. **Mix It Up** — “Play with different people.” A rotating-partner social mixer with fair rests and minimal repeat pairings.
3. **Court Climb** — “Win and move up.” Relay’s friendly name for King of the Court: synchronized rounds, winners move toward Court 1, losers move down, and partners split.
4. **Manual** — the host assigns every court and queue position.

`Random` should be a matchup option inside Mix It Up, not a top-level mode. `Winner Stays` should be a Paddle Stack rule, not a separate destination. This keeps setup legible while retaining the variations people actually use.

The strongest new mode for Relay is **Mix It Up**. It is social rather than tournament-like, gives every player variety, and fits Relay’s “fun with friends” position better than ladders, ratings, or brackets.

## What exists in real play

### 1. Open play / paddle stack

Open play is casual, drop-in, requires no fixed partner, and rotates players through multiple short games. Playtomic describes it as lower-stakes play designed around rotating partners and opponents rather than a formal tournament [1].

The queue rule is not universal. Real clubs adapt it to how crowded the session is:

- Lexington Pickleball Club uses **four off / four on** when at least four people are waiting.
- With one to three waiting, it uses **two off / two on**: winners stay, split into opposing teams, and take the next two players.
- A player must leave after two consecutive games even if they keep winning [2].

That is a useful product pattern: fairness depends more on queue pressure than on a single permanent rule.

Gwinnett Pickleball Club runs a two-rack winners/losers system but deliberately alternates the racks, splits repeat partners, and describes the goal as social mixing rather than competitive sorting [3]. This shows that a “winner/loser rack” can still be socially oriented when it avoids cliques and repeat pairings.

### 2. Rotating-partner mixer / Americano

In a rotating-partner format, each person changes partners and opponents across rounds and earns an individual session result. Playtomic calls **Americano** the choice for social events where everyone should mix; schedules rotate partners and opponents while accumulating points [4].

Pickleheads offers several implementations of this idea:

- **Popcorn:** unique random matchups each round.
- **Scramble:** random mixing with less court switching.
- Other variants seed or re-sort players, but all currently rotate partners after a round [5].

The important product behavior is not the format name. It is:

- equal or near-equal games played;
- fair sit-outs;
- minimal repeated partners;
- minimal repeated opponents;
- a visible next round;
- resilience when someone arrives late or leaves early.

For Relay, the consumer-facing label should be **Mix It Up**. “Americano” can appear in help text for players who know the convention, but it should not be required vocabulary.

### 3. King of the Court / Court Climb

Playtomic defines King of the Court as players competing to climb courts, with the top court as “king”; matchups use court position, and the format suits groups that want a more competitive energy [4]. Pickleheads’ “Claim the Throne” implementation moves winners up and losers down after every game and splits partners each time [5].

This mode works best when:

- there are multiple courts;
- rounds end together;
- the active player count is close to four per court;
- the group enjoys visible competition.

Relay should call it **Court Climb** in primary UI and explain “King of the Court” underneath. That phrasing is inclusive and tells users what happens.

### 4. Performance-balanced rounds / Mexicano

Playtomic’s Mexicano adapts pairings after every round according to performance so later games become more balanced [4]. This can produce close matches, but it is a worse early fit for Relay:

- it centers the leaderboard;
- pairings cannot be generated until prior results are complete;
- corrections can invalidate the next round;
- it can feel like an implicit rating system;
- it is less tolerant of late arrivals and casual scorekeeping.

A future Relay version could offer **Close Games** using only the current session’s results, never a permanent rating. It should not be a V1 mode.

### 5. Fixed-team round robin

USA Pickleball defines a round robin as every singles player or doubles team playing the others, ranked primarily by matches won [6]. This is valid and familiar, but fixed-team scheduling is closer to a mini-tournament than a casual friends session. It is useful for a planned “couples night” or team challenge, but not a priority over Mix It Up.

## Scoring and cadence variations

The play mode and the scoring rule are separate choices.

### Finish the game

The familiar default is standard scoring to 11, win by two. USA Pickleball’s official rulebook governs standard recreational play as well as tournament play and also recognizes singles and doubles [7]. This should remain Relay’s default result entry.

### Quick games

Busy open plays often shorten games as a local rotation rule. Lexington uses games to 9, win by one, specifically in its open-play rotation policy [2]. Relay could offer **Quick: first to 9** as an explicit house rule. It must not be presented as the official default.

### Timed rounds

Timed rounds solve a multi-court coordination problem: every court changes at the same time. Pickleheads recommends capping rounds at roughly 10–12 minutes for smoother flow [5]. Timed play is especially valuable for Mix It Up and Court Climb because the next round depends on all current courts.

A good Relay setup would be:

- **Finish the game** — independent courts; best for Paddle Stack.
- **10-minute rounds** — synchronized courts; best for Mix It Up and Court Climb.
- Advanced: custom duration or score cap.

The host should always be able to end a round early or finish a late court manually.

## Recommended product model

Do not model ten named algorithms. Separate four concerns:

| Concern       | Examples                                              | Why it is separate                             |
| ------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Court flow    | continuous or synchronized rounds                     | Determines whether courts wait for one another |
| Seat rotation | four-off/four-on, winners stay and split, court climb | Determines who leaves or changes courts        |
| Matchmaking   | queue order, least-played, low-repeat mix, manual     | Determines the next four and their teams       |
| Result rule   | result only, live score, timed, first to 9/11         | Determines when a match finishes               |

A mode is a tested preset across these concerns:

| Relay mode   | Flow       | Rotation                                | Matchmaking                  | Best for                           |
| ------------ | ---------- | --------------------------------------- | ---------------------------- | ---------------------------------- |
| Paddle Stack | Continuous | Adaptive queue                          | Longest waiting first        | Drop-ins and uneven attendance     |
| Mix It Up    | Rounds     | Everyone rotates                        | Least-played + avoid repeats | Social variety and fair court time |
| Court Climb  | Rounds     | Winners up, losers down, partners split | Court position               | Energetic multi-court sessions     |
| Manual       | Either     | Host decides                            | Host decides                 | Any unusual group                  |

## “Smart” behavior without surprise

Relay can recommend a setup, but it should never silently change the rules after play starts.

### Before Play starts

Use player and court counts to recommend:

- **Paddle Stack** when attendance is uncertain or there are more players than court slots.
- **Mix It Up** when the roster is settled and the goal is social variety.
- **Court Climb** when there are at least two courts and close to four active players per court.

Show one sentence explaining the recommendation.

### During Paddle Stack

An explicit **Adaptive queue** preset may use the established club pattern [2]:

- 1–3 waiting: winners stay, split, and take the next two;
- 4+ waiting: all four rotate off;
- maximum two consecutive games;
- longest-waiting players always receive priority.

The Play screen must state the active rule: “2 players rotate · winners split” or “4 players rotate.” If queue pressure crosses the threshold, announce the change before the next match rather than applying it invisibly.

### During Mix It Up

Generate one round at a time, optimizing in this order:

1. fewest games played;
2. longest rest;
3. avoid the previous partner;
4. minimize total partner repeats;
5. minimize opponent repeats;
6. deterministic tie-break from a stored session seed.

The host can reshuffle before starting the round. Once any match starts, the round locks unless the host explicitly resets it.

## Fun that fits Relay

Good additions are social and operational:

- **Partner variety:** “You’ve played with 5 different partners tonight.”
- **Next-round reveal:** all court assignments appear together with a restrained state transition.
- **Optional team names for one match:** ephemeral, not profile identity.
- **Last-round call:** host marks the next round as the final round so everyone understands the ending.
- **Fair-rest indicator:** explain why someone is sitting rather than making the algorithm feel arbitrary.
- **No-pressure results:** hosts may record only winner/score at the end; live scoring remains optional.

Avoid achievement spam, permanent skill movement, random power-ups, punishments, public rankings, and casino-like celebration. Those would conflict with Relay’s recreational positioning.

## Edge cases a future implementation must define

- A late arrival enters after the active round; they do not invalidate it.
- The earlier recommendation for persisted host replacement is superseded: mid-round substitutions are informal and unrecorded. If the saved assignment can no longer remain truthful, the host cancels the match instead.
- Odd player counts distribute rests by games played, then rest time.
- Court count changes take effect after current matches finish.
- A corrected score may update standings but must not silently rewrite a round already started.
- A tie in Court Climb uses a declared rule: current court holders stay, one deciding point, or host decision.
- Winner-stays always has a consecutive-game cap.
- Manual overrides are auditably reflected in the session system events.
- Singles uses two seats per court and the same queue/round concepts; doubles remains the primary UX.

## Suggested sequencing

1. Refine the existing Paddle Stack into clear **Four rotate**, **Winners stay and split**, and **Adaptive** presets.
2. Add **Mix It Up** with synchronized rounds and deterministic low-repeat assignments.
3. Add **Court Climb** only after round synchronization is reliable.
4. Add fixed partners and Team Round Robin when requested; continue deferring Mexicano, performance balancing, and elimination brackets.

This sequence deepens Relay’s hero feature without introducing leagues, tournaments, or ratings.

## Sources

1. Playtomic, “What is Open Play in pickleball?” — casual drop-in play, no fixed partner, rotating partners/opponents, lower-stakes positioning. https://playerhelp.playtomic.com/hc/en-gb/articles/47365087737489-What-is-Open-Play-in-pickleball-Everything-you-need-to-know
2. Lexington Pickleball Club, “Court Rotation Policy” — queue-pressure-dependent four-on/four-off and two-on/two-off rules, winners splitting, two-game cap, local game-to-9 rule. https://www.lexingtonpickleballclub.org/court-rotation-policy
3. Gwinnett Pickleball Club, “Paddle Rack Instructions” — alternating winner/loser racks, partner splitting, and explicitly social open-play goals. https://www.gwinnettpickleball.org/resources/paddle-rack-instructions
4. Playtomic Manager, “New Tournament Tools: King of the Court, Americano, and Mexicano” — first-party definitions and fit guidance for the three formats. https://helpmanager.playtomic.com/hc/en-gb/articles/44129657203985-New-Tournament-Tools-King-of-the-Court-Americano-and-Mexicano
5. Pickleheads, “How To Run a Pickleball Round Robin” — first-party descriptions of rotating formats, low-repeat/random variants, court climbing, flexible attendance, and 10–12 minute round guidance. https://www.pickleheads.com/guides/pickleball-round-robin
6. USA Pickleball, “Approved Tournament Formats” — official round-robin format and scoring options. https://usapickleball.org/sanctioning/formats/
7. USA Pickleball, “Official Rulebook” — official standard-play rules, singles/doubles, and recognized scoring variations. https://usapickleball.org/docs/rules/USAP-Official-Rulebook.pdf
