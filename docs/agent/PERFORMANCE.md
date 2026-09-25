# Agent performance assessment — 2026-09-25

Compared the uncommitted optimized worktree against baseline `75e825c` on
2026-09-25. The measurements below use the exact lockfile dependencies (AI SDK
7.0.105, React SDK 4.0.108, Next.js 16.3.5). These are local browser benchmarks
and real-provider synthetic Help requests, not deployed production latency.

## Findings and changes

| Finding | Effect | Change |
| --- | --- | --- |
| Saved chats uploaded up to 24 messages even though `beginAgentTurn` rebuilds history from owned storage | Redundant upload, serialization and request parsing, especially on mobile | Send only the latest user prompt for saved chats, including retries. Unsaved clients retain bounded text history. Server context remains unchanged. |
| Every stream chunk triggered a chat render; unchanged answers parsed Markdown again | Browser work grows with transcript length, potentially making streaming and typing feel sluggish | Use the installed SDK's 50 ms UI throttle and memoize `AgentAnswer` by text. Streaming content and final updates remain in the existing SDK state. |
| Help search returned only summaries, requiring another model step to read the guide | A simple procedural answer can take search → model → read → model | Prioritize matching guide slugs, then titles, and include one existing safe article projection for a clear match or sole result. Broad/empty searches keep summaries; other guides remain accessible through `readHelp`. Instructions allow using the included guide directly. |
| No phase-level request timing | A long wait could not readily be attributed to setup, model/tool work, charging or persistence | Add `Server-Timing: setup` and optional aggregate server timing logs. |

The Help fast path saves a model turn only when the returned guide answers the
question and the provider follows the instructions. It does not guarantee a fixed
speedup. Adding one relevant guide trades some input tokens for a possible model
round trip; ambiguous searches avoid adding arbitrary guide content.

## Remaining latency boundaries

- Authentication, account/settings reads, rate limiting, quota reservation and
  owned-history transactions precede generation. Reservation and conversation
  locks preserve concurrency and billing guarantees.
- `src/db/client.ts` deliberately allows one PostgreSQL connection per production
  instance. Parallel promises cannot make queries on that connection run together.
  Raising the pool limit needs database capacity and workload evidence first.
- Each dependent tool step is another provider generation. Creation continuation
  deliberately reads saved status before preparing the merged draft; explicit
  approval remains separate. The six-step/twelve-tool limits remain unchanged.
- The first visible text waits for successful charging. Completion waits for saved
  history. Moving these writes into the background risks free output or lost
  replies and was not done.
- Model selection, provider routing, output length, database region and cold starts
  can dominate latency. Their current production contribution is unmeasured.
  Privacy routing, model choice, retries and timeout were not changed.
- Conversation storage still rewrites the saved message array inside a locked
  transaction. Measure long-chat save/setup time before changing that schema.

## Timing diagnostics

Every successful streaming HTTP response includes `Server-Timing: setup;dur=…`
for server setup before generation. This excludes browser upload and network time.

Set `AGENT_PERFORMANCE_LOGGING=true` in the server environment to emit one
`[agent-performance]` record for a stream that completes or is interrupted:

- `setupMs`: request entry to generation setup.
- `firstTextMs`: generation setup to the first non-whitespace text delta, before
  charging; null when none arrives. This can include preceding tool work.
- `chargeMs`: successful initial usage write.
- `generationMs`: generation/stream handling duration, including tool and charge
  waits, before successful persistence. Failure handling can also include a
  failed persistence attempt.
- `saveMs`: accumulated successful history-save duration.
- `modelSteps`, `toolCalls`: observed SDK step and tool-call counts.
- `toolMs`: sum of observed completed/error tool-call spans. Concurrent spans can
  overlap; unfinished tools are not counted. This is not a database query timer.
- `totalMs`, `interrupted`: elapsed stream lifecycle and interruption status.

These fields contain no user/conversation identifiers, prompts, answers, provider
bodies, tool arguments/results or credentials. Logging defaults off. Rejections
before stream creation are not included. Timing fields overlap and must not be
summed as independent phases. `setupMs + firstTextMs + chargeMs` approximates the
server wait to initial visible text; browser network/render time is additional.

## Regression coverage and next measurement

A01/A04/A06: transport tests cover saved prompts, retries, unsaved history bounds
and removal of non-text parts; Help tests cover safe, bounded source projection;
answer tests cover streamed updates and link sanitization. Route tests cover timing
privacy/default-off logging alongside existing auth, history, quota, cancellation
and stream behavior regressions. A03 charging semantics are unchanged.

Executed evidence follows below. Existing controls and approval paths are unchanged.
The Help Center article “What Agent can help you do” now describes sourced Help
questions; it does not promise a fixed response speed.

## Measured results

| Measurement | Baseline | Optimized | Scope |
| --- | ---: | ---: | --- |
| Serialized message payload | 22,860 bytes / 24 messages | 53 bytes / 1 message | Synthetic saved history: 23 messages of 960 characters plus “Next game?”; message field only, excluding request IDs and HTTP framing |
| Markdown render calls | 3,273 | 39 | Every trial in five alternating Chromium pairs |
| Synthetic stream completion, median | 1,947.3 ms | 765.3 ms | 24 prior messages, 120 five-character deltas at a scheduled 5 ms interval; real SDK transport, hook and answer renderer |
| Live Help model steps | 3 in every run | 2 in every run | Three alternating pairs, same configured model, privacy settings, output limit and prompt |
| Live Help completion, median | 17,165.7 ms | 14,199.8 ms | About 17.3% lower in this small sample |
| Live Help first text, median | 8,030.0 ms | 8,049.6 ms | Essentially unchanged; no demonstrated first-text improvement |

Chromium completion ranged from 1,908.6–2,030.4 ms before and
760.8–772.2 ms after. Every run retained all 26 messages and the exact final
600-character answer. A counting wrapper around the real Markdown component
measured render invocations. Both variants used production React bundles; only
the baseline answer implementation and throttle setting differed. This isolates
client rendering work, not application/database/provider end-to-end latency.

Live requests used `deepseek/deepseek-v4.1-flash` under the existing strict
privacy routing. The prompt was “How do I create a game in Relay? Give me the
steps and a link to the guide.” Only Help tools were enabled in both variants;
no private account records, account quota reservations or saved conversations
were used. The benchmark used the real provider, instructions, tool registry
and Help catalog. It alternated baseline/optimized, optimized/baseline,
baseline/optimized to reduce ordering bias. Raw totals in milliseconds:

| Pair | Baseline total | Optimized total | Baseline first text | Optimized first text |
| --- | ---: | ---: | ---: | ---: |
| 1 | 17,165.7 | 15,853.5 | 2,921.1 | 8,049.6 |
| 2 | 15,529.9 | 10,551.2 | 8,030.0 | 5,700.4 |
| 3 | 17,734.3 | 14,199.8 | 9,159.1 | 8,982.4 |

All six completed with visible text and a Help link. Output lengths varied
(1,601–2,075 characters), so total-time differences are not attributable solely
to the removed model step. First text can be pre-tool narration, not a complete
answer. Three pairs do not establish statistical significance or tail latency.
The largest observed optimized total was 15,853.5 ms versus 17,734.3 ms for the
baseline; these are sample maxima, not p95 estimates.

The initial candidate did **not** improve the live sample: every run still used
three model steps. A diagnostic synthetic query showed “create a game” returned
the broader Agent creation guide before the direct game guide. Matching guide
slug words before title matches fixed that ranking, and the final sample above
then consistently removed a model step. Earlier runs using reused, older
dependencies were discarded and are not included in any reported result.

Local reproducibility artifacts are ignored under
`dogfood-output/agent-performance/`: `build-live.mjs`, `run-live.mjs`,
`live-results.jsonl`, `browser-measure.mjs`, `browser-entry.source.txt`,
`browser-results.json` and `payload-results.json`. Live benchmarking requires the
existing server environment and incurs provider usage. It must not print secrets
or upstream errors. The browser benchmark uses synthetic content only.

## Verification and limits

- Full repository lint and strict TypeScript passed before measurement refinements.
- Full unit suite: **2,670 tests across 369 files passed**.
- After the guide-ranking refinement and additional regression cases, focused
  Agent/API suite: **297 tests across 50 files passed**; changed-file quality checks
  also passed.
- Agent browser suite: **6/6 passed**, covering 390 px and 1440 px under mobile and
  desktop Chromium, creation review/approval, navigation, history restoration,
  source links, error/Retry and unauthenticated API rejection. Added assertions
  enforce single-prompt saved requests and Retry without a duplicate user turn.
- Two initial mobile failures came from the fixture copying Next development
  tools' shadow-root reset CSS into the page. Its unlayered semantic-element
  `display: block` rule overrode the real header's flex utility. The fixture now
  excludes only `style[data-nextjs-dev-tool-style]`; layout assertions remain.
- Production build: **passed** with Next.js 16.3.5, including its TypeScript
  validation, page-data collection and static generation. The initial sandboxed
  build stalled; the final build used the existing environment and network access.
  Temporary benchmark source files were removed from application compilation.
- Authenticated live smoke: **passed after explicit user approval** using the
  existing guarded non-admin test-account fixture. The real API completed a game
  read, initial group setup and saved-answer continuation, each with HTTP 200,
  streamed text, completed activity and no stream error. The authoritative
  proposal remained `pending`; its approval button and saved conversation
  restored on the real Agent page at both 390 px and 1440 px. No approval request
  was sent and no group was created. Deletion of the exact temporary conversation
  returned HTTP 200. No quotas or account permissions were changed.
- No deployment, merge, schema change, pool-size increase, quota reset, model
  replacement or privacy relaxation was performed.

For a broader latency claim, collect more repeated production-like samples across
game reads, long saved chats and creation continuation, with approval for the
specific account-data flow. Compare medians and tail latency on the same model and
regions, and keep setup, provider/tool, rendering and persistence time separate.

## Authenticated smoke timings

Single observations on the optimized local app against the configured hosted
backend and live model, measured on 2026-09-25. These establish functioning live
paths and latency attribution, not a before/after speedup for account flows.

| Live turn | Client total | Server setup | Model steps | Observed tool spans | History save |
| --- | ---: | ---: | ---: | ---: | ---: |
| Upcoming joined-game read | 7.56 s | 1.64 s | 2 | 0.13 s | 0.29 s |
| Initial group setup | 11.48 s | 1.71 s | 2 | 2.01 s | 0.27 s |
| Group-name continuation to approval | 16.95 s | 1.53 s | 3 | 0.79 s | 0.32 s |

The initial charge took approximately 0.10 s in each turn. Most elapsed time in
these observations remained within model generation and dependent tool steps,
with 1.5–1.7 s of required setup. This supports prioritizing measured model-round
trip reductions rather than weakening charging, authorization or approval.
Raw safe timing results remain in ignored `auth-results.json` and local server
aggregate logs; no account records or answer content are included in this report.
Actual final group creation was intentionally not executed; its approval boundary
is additionally covered by the synthetic browser and server unit suites.
