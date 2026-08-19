# Session recaps, balanced play, and realtime

Research date: 2026-08-19

## Product recap patterns

Spotify describes Wrapped as a personalized recap and celebration rather than a raw analytics report. Its data stories spotlight a few memorable superlatives and changes over time, then make results directly shareable to messaging and social channels. Spotify also notes that some people want a short experience while others intentionally go deeper, which supports a layered recap: immediate highlights first, detailed standings and memories afterward.

- [Spotify: 2024 Wrapped user experience](https://newsroom.spotify.com/2024-12-04/wrapped-user-experience-2024/)
- [Spotify: design and engagement behind 2023 Wrapped](https://newsroom.spotify.com/2023-11-29/wrapped-design-marketing-brand-creative-inside-spotify/)

Strava’s Year in Sport reporting emphasizes social connection, group activity, sustainable participation, and rest—not only peak performance. That framing matches Relay’s recreational positioning: celebrate the crew, close games, repeat partners, and shared time before highlighting wins.

- [Strava: 2024 Year in Sport](https://press.strava.com/articles/strava-releases-annual-year-in-sport-trend)

### Relay decision

Create a **Session recap**, not a clone of another company’s annual campaign. It appears only after a session ends and remains attached to that session. The first screen tells a compact story with session scale, a standout player or fixed pair, closest match, and busiest court. Detailed standings and the photo memory follow. A vertical 9:16 summary can use one session photo and be downloaded or shared through the native Web Share API.

The recap must avoid invented insights. Every statement comes from persisted matches, assignments, scores, timestamps, and memory media. With no completed matches, it becomes a photo-and-crew memory rather than manufacturing a winner.

## Shareable recap scenes

Spotify’s 2024 Wrapped does not force every fact into one poster. It presents separate personalized data stories—such as total listening, a top artist, a longest streak, and music phases—and lets people share the results to messaging and social channels. Spotify describes the value as reflecting the individual listener rather than merely summarizing global data.

- [Spotify: 2024 Wrapped user experience](https://newsroom.spotify.com/2024-12-04/wrapped-user-experience-2024/)
- [Spotify: the art and science behind Wrapped](https://newsroom.spotify.com/2024-12-04/the-art-and-science-behind-spotify-wrapped/)

Strava similarly calls Year in Sport a personalized highlight reel of unique insights, social engagement, and standout moments. Each scene can be shared individually, and the final summary image can be customized. Strava also states that scenes vary with the data available instead of showing every person the same report. Its ordinary activity sharing limits the exported stats to a small relevant set, reinforcing that a social image should make one claim clearly rather than reproduce an analytics screen.

- [Strava Help: Your Year in Sport](https://support.strava.com/en-us/articles/15401959-your-year-in-sport)
- [Strava Help: Sharing activities](https://support.strava.com/en-us/articles/15401840-sharing-your-strava-activities)

The WAI-ARIA Authoring Practices carousel pattern calls for explicit previous and next controls, optional direct slide controls, and a labeled carousel region. Relay should not auto-advance: people are choosing what represents their game and need time to inspect the numbers and background.

- [WAI-ARIA APG: Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)

### Relay decision

Treat sharing as a short, manual portrait story reel—not one overloaded card. Only defensible scenes appear:

1. **Night recap** — matches, points, and recorded court time.
2. **My game** — the signed-in participant’s wins, losses, session rank, point differential, and win percentage.
3. **Winning team** — the strongest pair by wins, then point differential and games played.
4. **Top of the table** — the session leader’s record and point differential.
5. **Session Standings** — the leading rows from this recreational session only.
6. **Closest finish** — teams, score, court, and margin from the tightest completed match.
7. **Busiest court** — the court that hosted the most completed matches.

The reel is ordered from broad to personal to specific, but omits My game when Relay cannot identify the viewer and omits result scenes when no result supports them. A user moves it manually by swipe, Previous/Next controls, keyboard arrows, or a direct scene selector. There is no autoplay and no fake superlative.

Every scene uses the same 9:16 safe area and exports independently. The user chooses a quiet Relay background or a photo already attached to the session memory; a photo is a background treatment, not a second content layer. The selected scene and background are reflected exactly in the generated PNG. This keeps the interaction closer to choosing a Strava stat card than editing a generic social post.

## Playing experience and balanced teams

USA Pickleball distinguishes a player skill level from result-based ratings and rankings. Its guidance presents skill level as a self-assessment of knowledge and proficiencies. Relay should remain even lighter: four understandable experience descriptions with no numeric value shown to players.

- [USA Pickleball: determining player skill levels](https://usapickleball.org/tournaments/tournament-player-ratings/player-skill-rating-definitions/)

### Relay decision

Use the existing recreational labels: **Just starting**, **Casual**, **Regular**, and **Experienced**. Accounts store a default during onboarding and may edit it from Profile. Session participation stores a snapshot so guests can opt in and account changes do not rewrite historical sessions.

**Balanced Mix** uses those values only as deterministic weights when forming a four-player court. For each group it chooses the team split with the smallest difference in combined experience, then uses prior partnership count as a tie-breaker. Fair rest order is still the first player-selection rule. Missing experience uses the middle of the scale and never blocks play.

## Supabase Realtime

Supabase offers Broadcast, Presence, and Postgres Changes. Its documentation describes Broadcast as low-latency and suitable for game events, while the Realtime overview recommends Broadcast for scalable database-change delivery. Postgres Changes is simpler and supports server-side row filters, but every subscribed change still passes through database authorization and logical replication.

Broadcast can originate from the database. Supabase documents `realtime.send()` and `realtime.broadcast_changes()` and explains that database Broadcast is delivered over WebSockets. Private Broadcast authorization is evaluated through RLS on `realtime.messages` when a client joins a topic.

- [Supabase Realtime overview](https://supabase.com/docs/guides/realtime)
- [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)

### Relay decision

Use one database Broadcast topic per session and send only an invalidation envelope—table name and operation, never row data. A database trigger resolves the affected session for direct and nested records and calls `realtime.send()`. The client coalesces bursts into one authoritative Server Component refresh. This covers roster, courts, matches, scores, queue, chat, payments, and memories without one subscription per table.

The shared game link must work without an account, so its session topic is public. The topic contains the opaque session UUID and broadcasts no business data; all actual reads continue through existing server queries and authorization. Authenticated-only notifications retain their user-filtered Postgres Changes subscription. Presence is not added because “who is online” does not yet improve a core Relay decision enough to justify another state system.

Score controls remain a special case: the local scoreboard updates immediately, debounces a single authoritative score write, and reconciles by match version. Broadcast then updates every other viewer. This avoids waiting on each point while preserving conflict detection and durable final scores.
