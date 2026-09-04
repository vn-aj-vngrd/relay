# Story activation plan — September 2026

## Decision

Launch Relay Story as one lifecycle-aware sharing system covering pre-game, live-game, and post-game stories in the same release.

Build the release sequentially behind a feature flag, but do not expose phase-specific implementations as separate products. The canonical Story destination remains sixth in session navigation on both `/games/[id]/story` and `/s/[slug]/story`.

## Objective

Turn every real Relay game into both:

1. a useful invitation or update for the current game; and
2. credible social proof that helps the same crew—or a new organizer—start the next game.

The product loop is:

> Publish → share invitation → RSVP → play → share the night → open the story → join or create the next game.

The launch is successful when Story improves successful-session creation and repeat play, not merely image exports. A successful session remains a published game with at least four Going players and one completed match.

## Audience and context

- **Pre-game host:** filling a real game from a phone while already coordinating in Messenger, WhatsApp, iMessage, Discord, or a local community group.
- **Live participant:** between games, with little attention available and no tolerance for an editor that competes with scoring or queue movement.
- **Post-game participant:** ready to celebrate the crew, personalize one defensible highlight, and share it into an existing social channel.
- **Story viewer:** arriving from an image, link, or QR and needing immediate context before deciding to RSVP, view the completed game, or plan another one.

Relay remains a shared home for a pickleball game, not a social network. Stories are portable artifacts that distribute through communities people already use.

## Product contract

### One destination, three phases

| Session phase | Story job | Default story | Primary action | External destination |
| --- | --- | --- | --- | --- |
| Published | Fill the game | Invitation | Share invitation | Shared Overview with plan and RSVP |
| Live | Show that the crew is playing | We’re playing | Share live update | Lifecycle-aware shared game or immutable live artifact |
| Completed | Celebrate and amplify the night | My game or Night recap | Share story | Immutable shared story with next action |
| Cancelled | State that the game was cancelled | None | Return to Overview | No new share artifact |
| Draft/private | Keep sharing bounded to authorized invitations | None | Invite players | No public link or QR |

Story phase comes from authoritative session status. Callers never submit or infer it.

## Mobile-first experience architecture

The current post-game composer is a long desktop-style form: preview, eleven story rows, four layout cards, background swatches, image sliders, text fields, and share actions all appear in one page. That is too much choice for a phone and will become worse when pre-game and live variants arrive.

Replace it with one media-first workspace that opens on a useful finished preview. Organize the destination with a compact underlined tab rail:

1. **Make** — compose the lifecycle-valid story;
2. **Photos** — view, add, and manage session media;
3. **Shared** — review durable published artifacts and revoke artifacts the viewer controls.

`Make` is the default for contributors. View-only visitors open the latest published story or a simple Story gallery instead of seeing disabled editing controls. `Photos` remains visible only where session-photo visibility permits it. `Shared` is hidden when there are no artifacts and the viewer cannot create one.

Do not make Pre, Live, and Post selectable tabs. The current lifecycle is factual, not a user preference. Show it as quiet context—**Before game**, **Live · as of [time]**, or **Final**—and derive all available controls from it.

### Make tab

The phone sequence is:

1. **Preview** — a near-finished 9:16 artifact generated from the game and strongest eligible photo.
2. **Focus rail** — horizontally scrollable chips containing only lifecycle-valid peer choices.
3. **Look rail** — horizontally scrollable visual chips for the bounded themes.
4. **Customize** — one button opens a focused bottom sheet for optional photo, crop, contrast, short headline, and personal line.
5. **Share** — a safe-area-aware action dock opens the completion sheet.

Focus and Look are the only always-visible chip rails. Crop, contrast, words, audience, links, QR, and download are not styles and must not be mixed into those rails. Unsupported focuses are omitted instead of disabled.

The default should already be shareable. Customization is optional, changes update the preview immediately, and leaving the bottom sheet returns focus to **Customize**. Layout is chosen automatically from focus and media. Keep the existing four layout implementations only as internal template strategies during migration; do not expose a separate layout rail at launch unless usability testing shows that players understand the distinction from theme.

### Completion sheet

Selecting **Share** first shows the exact final preview, the computed audience, and a concise statement of exposed facts. It then groups four distinct outcomes:

- **Share image** — native file share when the exact payload is supported;
- **Copy link** — copies the canonical RSVP or artifact URL;
- **Show QR** — opens a scannable second-screen/in-person handoff;
- **Download image** — reliable fallback.

Distribution is a separate step from creation. Native share cancellation is neutral and returns to the sheet. Relay does not claim that opening a share sheet means the story was posted.

A standard social-story export does not burn a QR into the image by default: a QR displayed on the same phone is not immediately scannable and weakens the visual claim. QR remains prominent in the completion sheet. Pre-game may additionally offer a dedicated **QR poster** export for venue desks, group meetups, or a second screen; that artifact uses the same game facts but a deliberately larger scan field.

### Photos tab

Keep media management out of the composer controls:

- session photos appear as a simple two-column phone grid and three-column larger-screen grid;
- selecting a photo opens a focused viewer with **Use in story** and permitted delete/report actions;
- upload explains who can see the photo before submission;
- device-only photos remain in the Make flow and are explicitly marked **Only on this device**;
- empty state offers one action: **Add the first photo** when permitted.

Do not add comments, reactions, video editing, or social engagement counts in this release.

### Shared tab

Published artifacts use compact rows with a small portrait thumbnail, phase, focus, creator, and publication time. Each row opens the immutable artifact. Owners may copy its link or revoke it; authorized session managers may moderate public artifacts. Revoked artifacts remain visible in authorized history with an explicit Revoked state but disappear from public access.

This is an artifact history, not a feed. It has no likes, ranking, autoplay, or infinite discovery.

### Responsive composition

- **Phone (primary, verified at 390px):** one column; preview first at a comfortable portrait size; Focus and Look use edge-to-edge horizontal rails with visible partial next choices; Customize uses a bottom sheet; the Share dock remains above Relay’s opaque bottom navigation and safe area.
- **Small phone/long content:** preserve a usable preview without forcing controls below multiple screens; names and venues wrap inside renderer safe areas; rails scroll horizontally without page overflow.
- **Tablet:** preview and controls may sit side by side when both retain comfortable touch widths; bottom sheets may become anchored dialogs.
- **Desktop (verified at 1440px):** sticky portrait preview on the left and a bounded control column on the right; the same Make, Photos, and Shared order and labels remain; desktop never receives extra creative capability.
- **Landscape courtside:** Story is not optimized over Play. Preserve access, but do not introduce sticky UI that reduces active scoring space elsewhere in the session shell.
- **Light/dark:** app chrome follows the selected theme; the exported artifact follows its selected Story theme and must not change when the app appearance changes.

### Interaction and accessibility

- The tab rail uses real tabs with arrow-key behavior and associated panels.
- Focus and Look choices use single-select radio semantics even when visually presented as chips.
- Chip rails expose visible focus, 44px touch targets, and scroll the selected option into view without forced page movement.
- Preview changes announce the selected focus/look without reading the entire artwork on every change.
- The preview has an accessible text equivalent listing the facts that will be exported.
- Bottom sheets trap focus, close with Escape, restore focus, and become near-instant under reduced motion.
- Swipe may move between valid focuses, but explicit Previous/Next controls and direct chip selection remain available.
- No control depends on color alone, and story text contrast is validated against the selected image treatment.

## Patterns adapted from leading apps

First-party research is recorded in [`mobile-social-story-patterns-2026-09.md`](./mobile-social-story-patterns-2026-09.md).

Relay should adapt, not imitate:

- **Instagram/Meta:** start with photo or authoritative content, then add customization; keep a 9:16 destination-ready asset and let the receiving app provide any final social decoration.
- **TikTok:** progressively disclose capture/content, editing, then publication instead of showing every tool at once.
- **Snapchat:** separate Preview from Send To; treat links and QR as explicit distribution mechanisms with clear audience behavior.
- **Strava:** begin from a durable activity/game source, allow only defensible stats, and suppress public sharing when source visibility forbids it.
- **Spotify:** preview the exact destination artifact and make image, precise deep link, and scannable code complementary rather than interchangeable.

Relay should not copy 24-hour deletion. The external social post may expire, but the game and explicitly published Relay artifact remain durable until revoked.

### Pre-game stories: “Come play”

The default invitation contains only authoritative session facts:

- game title;
- date and time;
- court;
- host identity;
- Free or current player price;
- spots remaining, approval requirement, or waitlist state;
- Relay attribution;
- a short outcome-specific call to action.

Initial template set:

1. **Invitation** — balanced date, court, price, and availability.
2. **Spots open** — emphasizes current capacity when players can join directly.
3. **Crew and court** — emphasizes the plan without exposing attendance details beyond the existing shared roster rules.

Initial bounded headlines:

- Pickle tonight?
- Join our game
- Two spots left
- Game night at `[court]`

Actions appear together:

- **Share invitation**
- **Copy join link**
- **Show QR**
- **Download story**

The link and QR point to the canonical shared game. The shared page presents the plan before guest RSVP. Private games never expose public Story artifacts or QR codes.

### Live stories: “We’re here”

Live Story is secondary to Play and must not interrupt scoring, court assignment, queue movement, or match completion.

Initial template set:

1. **We’re playing** — game, venue, crew count, active-court count.
2. **Game in progress** — active courts and completed-match count.
3. **Photo pulse** — one participant-selected photo with restrained aggregate context.

Every published live artifact is an immutable factual snapshot labeled **Live · as of [time]**. It may not expose payment facts, player availability, absent-player identities, device location, provisional standings, or automatic score updates. There is no automatic publishing or recurring prompt.

The action lives in Story and may appear as one quiet shortcut outside active scoreboard controls. It never appears as an interstitial in Play.

### Post-game stories: “This was our night”

Retain the current factual focuses:

- Night recap
- My game
- Winning team
- Top of the table
- Session Standings
- Closest finish
- Busiest court
- Points played
- Court time
- The crew
- Your story

A focus is available only when persisted session data supports it. With no completed scores, default to a crew or photo-first story rather than a zero-value result summary.

Recommended initial selection:

- identifiable participant with a standing: **My game**;
- host, co-host, or unidentified viewer: **Night recap**;
- completed session without scores: **The crew** or **Your story**.

Actions appear together:

- **Share story**
- **Download PNG**
- **Copy recap link**
- **Show recap QR**

The shared artifact ends with one contextual continuation:

- **Plan a game like this** for general viewers;
- **Join an upcoming game** only when a real eligible destination exists;
- **Play again** for the original host;
- **Save this crew** for eligible signed-in participants.

## Theme and template system

Keep **focus**, **layout strategy**, and **theme** separate in the Story module while exposing only the decisions players understand:

- **Focus** decides which factual claim the story makes and appears as the primary chip rail.
- **Layout strategy** decides how that claim is structured and is selected automatically from focus and media at launch.
- **Theme** supplies bounded visual tokens and appears as the Look chip rail.

Launch themes:

1. **Relay Court** — deep court field, crisp divisions, optic signal.
2. **Clean Score** — typography-led and restrained.
3. **Night Session** — dark, photo-friendly treatment.
4. **Crew Photo** — image-forward with explicit contrast controls.
5. **Game Color** — derived from the curated session accent.

Retain the four structural layouts as internal rendering strategies during migration. Do not expose a dedicated layout chooser at launch unless mobile usability testing proves it adds value beyond Focus and Look. Templates and themes are versioned code registries, not database-authored markup.

```ts
type StoryPhase = "pre_game" | "live_game" | "post_game";

type StoryTemplateDefinition = {
  id: string;
  version: number;
  phases: readonly StoryPhase[];
  available(snapshot: StoryFactSnapshot, actor: StoryActor): boolean;
  compose(
    snapshot: StoryFactSnapshot,
    options: StoryOptions
  ): StoryScene;
};

type StoryThemeDefinition = {
  id: string;
  version: number;
  tokens: StoryThemeTokens;
};
```

Do not allow arbitrary HTML, CSS, fonts, remote images, fabricated statistics, or edited session facts. Keep the existing bounded crop, contrast, short headline, and personal line.

## Module design

Replace the post-game-only lifecycle policy scattered across route and presentation files with one deep **Story module**.

Its interface should provide high leverage while keeping session state, authorization, snapshotting, rendering, publication, and sharing rules local:

```ts
type StoryModule = {
  read(input: StoryReadInput): Promise<StorySurface | null>;
  execute(command: StoryCommand, actor: StoryActor): Promise<StoryResult>;
  render(input: StoryRenderInput): Promise<RenderedStory>;
  resolveShare(
    shareKey: string,
    viewer: StoryViewer
  ): Promise<SharedStory | null>;
};
```

`StoryCommand` is a discriminated union with initial commands:

- `addSessionPhoto`
- `deleteSessionPhoto`
- `publishArtifact`
- `revokeArtifact`

Callers do not submit lifecycle phase, calculated scores, roster facts, availability, visibility, creator identity, or destination URLs. The module derives those from authoritative records and the resolved actor.

### Shared route DTO

Both authenticated and public adapters receive the same surface:

```ts
type StorySurface = {
  phase: StoryPhase;
  session: StorySessionSummary;
  viewer: StoryViewerSummary;
  facts: StoryFactSnapshot;
  photos: StoryPhotoSummary[];
  artifacts: PublishedStorySummary[];
  templates: AvailableStoryTemplate[];
  themes: AvailableStoryTheme[];
  capabilities: {
    create: boolean;
    contributeMedia: boolean;
    publishExternal: boolean;
    revokeOwn: boolean;
    moderateMedia: boolean;
  };
};
```

Route differences are limited to shell, navigation, account continuity, and role-appropriate management actions.

### Actor seam

Use `getSessionViewer()` as the actor seam so account members and token-bound guest players follow the same capability rules. Attribute contributions to `session_players`, not only `users`, so guest-created content survives account claiming.

Permission intent:

| Actor | Build/share valid story | Add photos | Revoke own artifact | Moderate session photos |
| --- | --- | --- | --- | --- |
| Host/co-host | Yes | Yes | Yes | Yes |
| Going account player | Yes | Yes | Yes | Own uploads only |
| Going guest player | Yes | Yes | Yes | Own uploads only |
| Maybe/waitlisted/invited | Pre-game invitation only when authorized to view | No | Own artifact only | No |
| Link viewer | Preview/download public artifacts | No | No | No |

Private sessions may support authorized account sharing through direct invites, but never publish an account-optional Story URL or QR.

## Rendering contract

The current DOM preview and Canvas export are separate implementations. Replace them with one intermediate `StoryScene`, rendered as SVG and rasterized to 1080 × 1920 PNG.

The same scene drives:

- browser preview;
- PNG export;
- persisted artifact rendering;
- social preview imagery.

Requirements:

- preview and export contain identical focus, layout, crop, contrast, text, theme, and QR treatment;
- long names, courts, dates, and personal lines wrap deterministically inside safe areas;
- supported fonts are loaded before render;
- a missing or expired selected photo fails clearly instead of silently exporting without it;
- local photos stay on-device unless separately uploaded;
- arbitrary cross-origin image URLs are rejected;
- native file sharing uses `navigator.canShare({ files })` without a touch-device heuristic;
- share cancellation is neutral;
- analytics failure never changes a successful share/download result.

## Artifact persistence

Keep `memories` as the one-per-session media aggregate. Add immutable published artifacts.

```text
story_artifacts
- id UUID primary key
- session_id UUID not null references sessions
- share_key TEXT unique not null
- phase TEXT not null
- template_id TEXT not null
- template_version INTEGER not null
- theme_id TEXT not null
- theme_version INTEGER not null
- source_snapshot JSONB not null
- configuration JSONB not null
- created_by_user_id UUID nullable
- created_by_session_player_id UUID nullable
- rendered_storage_path TEXT not null
- rendered_sha256 TEXT not null
- status TEXT not null                 // published | revoked
- published_at TIMESTAMPTZ not null
- revoked_at TIMESTAMPTZ nullable
- created_at TIMESTAMPTZ not null
- updated_at TIMESTAMPTZ not null
```

Add:

- an index on `(session_id, published_at)`;
- a unique index on `share_key`;
- `session_player_id` on `memory_media` while retaining `uploader_id` during migration;
- an index on `(memory_id, created_at)`;
- checks requiring a valid creator and rendered path;
- a private `story-artifacts` bucket with strict file, byte, actor, and session quotas;
- `story_artifacts` invalidation through the existing session Broadcast mechanism.

Snapshots and configuration are versioned Zod schemas. JSONB is not an untyped extension point.

Published artifacts remain historical snapshots after score correction. The current Story surface reflects corrected facts and offers **Create updated story**; it does not silently rewrite an already-shared artifact.

## Links, QR, and privacy

Canonical artifact URL:

```text
/s/[slug]/story/[shareKey]
```

Authenticated selection:

```text
/games/[id]/story?artifact=[artifactId]
```

QR codes contain only canonical absolute HTTPS URLs. Branding, game context, and calls to action sit outside the scan field.

QR behavior by phase:

- pre-game: `/s/[slug]`, labeled **Scan to view and RSVP**;
- live: immutable artifact URL, labeled **Scan to see the game**;
- post-game: immutable artifact URL, labeled **Scan to see the story** or **Scan to plan the next one**.

QR is a completion-sheet and in-person handoff by default, not a watermark burned into every social image. A separate pre-game QR poster may be downloaded for venue or second-screen use.

Artifact access rechecks artifact status and current session visibility. Revocation or a visibility change disables Relay’s route and image response immediately. Third-party social-preview caches cannot be recalled; the interface and privacy copy must state this where revocation is offered.

Never expose storage paths, signed storage URLs, user IDs, guest cookies, or authorization tokens in QR payloads or canonical artifact links.

## Analytics contract

Keep existing `invite_shared` and `recap_shared` milestones for funnel continuity, but add non-deduped, privacy-safe Story events or versioned metadata for:

- phase: pre-game, live-game, post-game;
- method: native share, download, copy link, QR download;
- template ID and version;
- artifact publish;
- referred artifact open;
- referred RSVP;
- referred game-draft start;
- referred game publication.

Do not record names, custom copy, photos, scores, venue addresses, payment details, messages, or the public share key in analytics.

Opening the native share sheet is a share attempt, not proof that content was posted. Report attempts, artifacts, referred opens, and downstream conversions separately.

## Ticket-level implementation roadmap

All tickets ship behind one lifecycle Story feature flag. The public launch occurs only after every P0 ticket passes its gate.

### STORY-01 — Correct actor and media authorization `[P0]`

**Depends on:** none

**Primary files:**

- `src/features/memories/actions.ts`
- `src/app/(app)/games/[id]/story/page.tsx`
- `src/app/s/[slug]/story/page.tsx`
- `src/features/sessions/viewer.ts`
- `src/features/auth/permissions.ts`

**Work:**

- Resolve one `StoryActor` through the account-or-guest viewer seam.
- Permit non-playing host/co-host contribution consistently.
- Permit token-bound Going guest contribution consistently.
- Reject incomplete-session photo uploads until phase-specific media rules explicitly allow them.
- Add uploader/host deletion with storage cleanup.
- Return visible success and failure feedback from photo actions.
- Align upload MIME, signature, size, daily count, per-session count, and storage-bucket limits.
- Make first-memory creation race-safe.

**Acceptance:**

- UI capabilities and server authorization agree for host, co-host, Going account player, Going guest, nonparticipant, waitlisted player, and anonymous viewer.
- Unauthorized writes fail without creating database or storage records.
- Deletion removes both the record and storage object or reports a recoverable cleanup failure.

### STORY-02 — Define lifecycle, snapshot, template, theme, and capability contracts `[P0]`

**Depends on:** STORY-01 actor decision

**Primary files:**

- new `src/features/stories/domain.ts`
- new `src/features/stories/registry.ts`
- existing `src/features/memories/recap.ts`
- existing `src/features/memories/recap-share.ts`

**Work:**

- Introduce `StoryPhase`, `StoryActor`, `StoryFactSnapshot`, `StoryScene`, `StoryOptions`, and `StorySurface`.
- Move post-game availability rules into versioned template definitions.
- Add pre-game and live snapshot builders.
- Define deterministic default-template selection.
- Keep persisted session facts separate from personal presentation copy.

**Acceptance:**

- Published, live, completed-with-results, completed-without-results, cancelled, private, full, approval-required, and waitlisted fixtures produce explicit surfaces.
- Unsupported templates are absent rather than disabled.
- Snapshot tests prove that no caller can inject calculated facts or phase.

### STORY-03 — Introduce the shared scene renderer `[P0]`

**Depends on:** STORY-02

**Primary files:**

- replace responsibilities in `src/features/memories/recap-story-card.tsx`
- replace export responsibilities in `src/features/memories/recap-share-card.tsx`
- new `src/features/stories/render/`

**Work:**

- Compose every template into one SVG-backed `StoryScene`.
- Use the scene for preview and 1080 × 1920 export.
- Add deterministic wrapping, safe areas, photo crop, overlay contrast, and font readiness.
- Remove silent photo fallback.
- Remove `navigator.maxTouchPoints` from native-sharing eligibility.
- Isolate analytics from export/share success.

**Acceptance:**

- Golden-image coverage exists for each layout, theme, phase, long-content fixture, light/dark app shell, local image, and persisted image.
- Export matches preview within the documented rasterization tolerance.
- Failed photo retrieval gives a corrective message and never produces a misleading artifact.

### STORY-04 — Add immutable artifact persistence and storage `[P0]`

**Depends on:** STORY-02, STORY-03

**Primary files:**

- `src/db/schema/index.ts`
- new Drizzle migration and generated metadata
- new `src/features/stories/artifacts.ts`
- `docs/integrations.md`

**Work:**

- Add `story_artifacts` and media attribution changes.
- Add private artifact storage.
- Render, hash, upload, and insert publication atomically with cleanup on failure.
- Add revocation.
- Add per-actor and per-session quotas.
- Include artifact changes in existing session Broadcast invalidations.

**Acceptance:**

- Retried publication is idempotent.
- Partial storage/database failures leave no orphaned public artifact.
- Score corrections do not mutate published snapshots.
- Revocation removes Relay access without deleting session history.

### STORY-05 — Add artifact links, resolvers, metadata, and lifecycle QR `[P0]`

**Depends on:** STORY-04

**Primary files:**

- new `src/app/s/[slug]/story/[shareKey]/page.tsx`
- new artifact image response route
- `src/features/sessions/game-qr-share.tsx`
- shared session metadata utilities

**Work:**

- Resolve high-entropy share keys through the Story module.
- Recheck session visibility and artifact status on every access.
- Provide phase-appropriate title, description, Open Graph image, canonical URL, and noindex policy.
- Generalize QR presentation without coupling it to RSVP copy.
- Add copy-link and QR-download controls.

**Acceptance:**

- Public and link-only artifacts open without an account when valid.
- Private, revoked, mismatched-slug, and invalid-key requests reveal no artifact.
- QR scans resolve to the intended canonical page.
- Social preview routes expose no private storage URL.

### STORY-06 — Ship the pre-game Story experience `[P0]`

**Depends on:** STORY-02, STORY-03, STORY-05

**Primary files:**

- `src/features/stories/story-surface.tsx`
- `src/features/stories/templates/pre-game.ts`
- authenticated and public Story route adapters
- post-publication activation handoff

**Work:**

- Replace the locked published state with invitation creation inside the shared Make/Photos/Shared information architecture.
- Add Invitation, Spots open, and Crew and court focus chips with lifecycle-aware defaults.
- Add Look chips and move optional photo/text controls into a focused Customize sheet.
- Derive price, capacity, approval, and waitlist language authoritatively.
- Add Share invitation, Copy join link, Show QR, and Download story.
- Preserve private-session invitation constraints.

**Acceptance:**

- Full, waitlisted, approval-required, free, paid, link-only, public, and private games show truthful actions and copy.
- Shared destinations present the plan before RSVP.
- No stale capacity promise is embedded at publication time without a visible snapshot timestamp or artifact semantics.

### STORY-07 — Ship the live Story experience `[P0]`

**Depends on:** STORY-02, STORY-03, STORY-04, STORY-05

**Primary files:**

- `src/features/stories/templates/live-game.ts`
- Story surface
- one non-blocking Play shortcut if usability testing supports it

**Work:**

- Add We’re playing, Game in progress, and Photo pulse focus chips.
- Reuse the same Make/Photos/Shared interaction model without introducing courtside-only editing controls.
- Snapshot active-court count, completed-match count, game context, and publication time consistently.
- Keep Story secondary to active Play.
- Exclude provisional competitive claims and sensitive attendance/payment facts.

**Acceptance:**

- Concurrent score or court changes cannot create a mixed-version artifact.
- Publishing does not delay score writes, rotation changes, or match completion.
- There is no automatic prompt, autoplay, or repeated courtside interruption.

### STORY-08 — Migrate and improve post-game Story `[P0]`

**Depends on:** STORY-03, STORY-04, STORY-05

**Primary files:**

- current files under `src/features/memories/`
- new `src/features/stories/templates/post-game.ts`
- Recap continuation section

**Work:**

- Migrate all current factual focuses to the shared registry and renderer.
- Replace the current long-form composer with preview-first Make, Photos, and Shared tabs; Focus and Look chip rails; a Customize sheet; and a separate completion sheet.
- Recommend My game, Night recap, or photo-first based on viewer and data.
- Add artifact publication, recap link, and recap QR.
- Add Create updated story after corrected results.
- Preserve local-photo privacy.

**Acceptance:**

- Every current valid template remains available.
- Zero-score sessions default to a meaningful crew/photo story.
- Existing Story URLs remain canonical and legacy Memories URLs continue redirecting.

### STORY-09 — Add lifecycle entry points and truthful copy `[P1]`

**Depends on:** STORY-06, STORY-07, STORY-08

**Primary surfaces:**

- post-publication handoff;
- Story tab labels/descriptions;
- completed Overview;
- Recap continuation;
- game history actions;
- loading and cancelled states;
- Help Center and marketing previews.

**Work:**

- Add one contextual action per lifecycle boundary.
- Keep Play free of blocking share prompts.
- Remove unsupported reactions/notes language.
- Add explicit cancelled-game language.
- Explain session-photo visibility before upload.
- Persist prompt dismissal where a prompt is introduced.

**Acceptance:**

- No screen has more than one solid primary action per decision area.
- Story is discoverable without turning the session into a promotional funnel.
- Copy describes the exact share outcome.

### STORY-10 — Add attributable, privacy-safe analytics `[P1]`

**Depends on:** STORY-04, STORY-05

**Primary files:**

- `src/features/analytics/events.ts`
- `src/features/analytics/actions.ts`
- analytics insights queries and admin presentation

**Work:**

- Preserve milestone continuity.
- Record phase, method, template/version, artifact publication, referred opens, and downstream conversion.
- Define attribution lifetime and first-touch/last-touch behavior before implementation.
- Keep analytics best-effort and non-blocking.

**Acceptance:**

- Native share attempts are not reported as confirmed posts.
- A referred open can connect to RSVP or game publication without storing personal story content.
- Analytics failures never alter user-visible sharing success.

### STORY-11 — Complete parity, accessibility, resilience, and E2E coverage `[P0]`

**Depends on:** STORY-01 through STORY-10

**Primary files:**

- memory/story Vitest suites;
- shared loading-state tests;
- `e2e/smoke.spec.ts` or a focused Story E2E suite.

**Work:**

- Compare `/games/[id]/story` and `/s/[slug]/story` for every phase and actor.
- Cover real tab semantics, Focus/Look radio-chip rails, selected-chip scrolling, keyboard carousel controls, swipe, bottom-sheet focus restoration, completion-sheet dismissal, reduced motion, long content, image failures, offline/reconnecting state, and responsive layouts.
- Cover native share, cancellation, download fallback, copy link, QR download, publication, resolution, revocation, and score correction.
- Add authorization integration tests for account and guest actors.

**Acceptance:**

- Same facts, template order, accent, and lifecycle language appear on both access paths.
- Capability differences match `docs/SESSION_SURFACE_PARITY.md`.
- No horizontal overflow at 390px or 1440px.
- WCAG 2.2 AA, labeled controls, visible focus, and 44px touch targets pass.

### STORY-12 — Controlled full-lifecycle release `[P0]`

**Depends on:** all prior P0 tickets

**Work:**

- Enable for internal test sessions, then the Metro Cebu organizer cohort.
- Verify Messenger, WhatsApp, iMessage, Discord, Instagram share sheet, Android download, iOS download/share, and desktop fallback.
- Observe at least five real sessions from invitation through completed Story.
- Review conversion and operational guardrails before broad announcement.

**Acceptance:**

- At least five real sessions complete the lifecycle without manual database repair.
- No P0/P1 issue remains from the UI and security pass.
- Preview/export mismatch and artifact-render failure rates are acceptably low and explicitly reviewed.
- Story does not measurably degrade Play completion, scoring responsiveness, or queue operation.

## Dependency order

```text
STORY-01 authorization
       ↓
STORY-02 domain contracts
       ↓
STORY-03 shared renderer
       ↓
STORY-04 artifact persistence
       ↓
STORY-05 links + QR
       ↓
 ┌─────┼────────┐
 ↓     ↓        ↓
06 pre 07 live  08 post
 └─────┼────────┘
       ↓
09 entry points + 10 analytics
       ↓
11 parity/E2E
       ↓
12 controlled release
```

Post-game migration can begin alongside artifact work once the shared renderer contract is stable. Public exposure remains disabled until pre, live, and post paths pass the same release gate.

## Validation strategy

Use the smallest falsifying check after each ticket:

1. `pnpm check:fast` for changed-file quality.
2. Direct Vitest files for domain, renderer, action, and component behavior.
3. `pnpm typecheck` for every shared contract or server/client seam change.
4. `pnpm test:related` where renderer or route changes have meaningful import fan-out.
5. `pnpm check:full` after schema, storage, cross-cutting module, or release-candidate changes.
6. `pnpm test:e2e` for authorization, artifact links, forms, sharing fallbacks, and responsive workflows.
7. Agent Browser verification at 390px and 1440px in light and dark mode for authenticated and shared routes.

Renderer goldens must use realistic longest-case names, court labels, dates, prices, personal lines, and photo crops. Tests must not rely only on ideal fixture content.

## Launch metrics

### North star

Completed qualifying games that lead to another published qualifying game within 30 days.

### Activation

- median publish-to-first-share time;
- percentage of published games with a pre-game share action;
- referred invite open → RSVP conversion;
- percentage reaching four Going players.

### Live utility

- live artifacts published;
- referred live opens;
- first-match and session completion;
- scoring latency, queue completion, and share-related failure rate.

### Post-game adoption

- completed participants opening Story;
- artifacts published and exports per completed game;
- native share, download, link-copy, and QR-download rates;
- referred recap opens.

### Acquisition and retention

- guest RSVPs and account claims from Story referrals;
- new drafts and published games attributed to Story;
- Play Again and Save this crew;
- second successful session within 14 and 30 days.

### Guardrails

- export failure and preview/export mismatch;
- privacy or moderation reports;
- score corrections after artifact publication;
- manual database or storage repair;
- Play abandonment or scoring regression.

## Explicit anti-goals

Do not add in this release:

- a Relay feed, follower graph, likes, popularity counts, or algorithmic discovery;
- automatic posting, autoplay, live streaming, or play-by-play score spam;
- fabricated highlights, editable scores, ratings, streak pressure, or professional-broadcast framing;
- freeform drag-and-drop editing;
- video capture/editing;
- comments, reactions, template marketplaces, or arbitrary community-authored themes;
- arbitrary remote images or remote code/markup;
- an account wall before viewing the plan or saving a guest RSVP;
- paid acquisition or claims about Gen Z adoption before measured evidence.

## Release gate

Do not activate lifecycle Story broadly until:

- actor capabilities match server authorization for host, co-host, account player, guest player, and viewer;
- one renderer proves preview/export parity;
- artifact links, visibility transitions, and revocation pass security tests;
- private games expose no public artifact or QR;
- pre-game stories lead to the correct RSVP state;
- live stories cannot disrupt Play or publish mixed-version facts;
- post-game stories remain truthful after score correction;
- analytics are non-blocking and distinguish attempts from referred outcomes;
- public and authenticated surfaces pass parity at 390px and 1440px;
- the production quality, E2E, accessibility, and real-session gates pass.

## Launch message

**Invite the crew. Share the moment. Run it back.**
