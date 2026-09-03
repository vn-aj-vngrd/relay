# Court Finder core-feature audit and plan

Research date: 2026-09-03

## Executive decision

Relay should make Court Finder the most trustworthy bridge from **“we want to play”** to **“the game is planned”** in the Philippines. It should not compete on an unverifiable court count, copy third-party directories, or imply that Relay controls live availability.

The recommended product promise is:

> **Find a court you can actually use, understand the practical details, then plan the game there without re-entering anything.**

This release should cover both meanings of public/private:

1. public `/courts` and signed-in `/court` remain behaviorally equivalent; and
2. every listing explains whether the facility is public, commercial, members-only, residents/school/community-restricted, or invitation-only.

The strongest defensible moat is not the map. It is a continuously reviewed Philippine court dataset connected directly to Relay game creation.

## What exists today

Relay already has a substantial foundation:

- public `/courts` and authenticated `/court` finder routes using one `CourtFinder`;
- searchable map/list results, setting, parking, price, operating-hours, and location sorting;
- structured price and weekly operating-period data;
- public and authenticated court details;
- a signed-in **Suggest a court** form and private admin review;
- source URLs, `verified_at`, `last_seen_at`, listing lifecycle states, and audit logs;
- a Philippines-bounded MapLibre/Geoapify map;
- venue IDs and immutable venue snapshots on sessions; and
- a reviewed national import process.

The production database inspected on 2026-09-03 contains:

| Status                       | Count |
| ---------------------------- | ----: |
| Verified and public          |   118 |
| Unverified review candidates |   205 |
| Archived                     |     1 |

Among the 118 public records:

| Field                                            |  Complete |
| ------------------------------------------------ | --------: |
| Coordinates                                      | 118 / 118 |
| Court count                                      | 118 / 118 |
| Setting                                          | 113 / 118 |
| Known price status                               |  85 / 118 |
| Parking                                          |  78 / 118 |
| At least one contact/website/social/booking path |  78 / 118 |
| Verification and last-seen timestamps            | 118 / 118 |

Current access cannot be audited reliably: 80 records are `paid`, 33 `unknown`, four `free`, and one `contact`. There are no verified records classified as members-only or invitation-only even though the source set includes restricted clubs. This is partly because access restrictions are currently encoded in `price_status`, which conflates two different facts.

Implementation references:

- `src/features/venues/court-finder.tsx`
- `src/features/venues/court-map.tsx`
- `src/features/venues/directory.ts`
- `src/features/venues/venue-submission-form.tsx`
- `src/features/venues/actions.ts`
- `src/features/venues/details.ts`
- `src/db/schema/index.ts`
- `scripts/import-ph-courts.ts`
- `docs/research/philippines-court-expansion-2026-09.md`

## Product and UX audit

### P1 — trust and correctness

1. **The selected-court handoff loses the venue relationship.** Finder and detail CTAs send only `venue` and `address` query parameters. The Create domain supports `venueId`, but the Court Finder does not pass it. A game created from Court Finder can therefore become manual text instead of a durable relationship to the reviewed court.
2. **“Verified by Relay” overstates field-level confidence.** The entire listing receives one blanket badge even when price, parking, contact, or hours are unknown. The UI does not show `verified_at` or `last_seen_at`, even though both exist.
3. **Facility access and price are conflated.** `members` and `invitation` are price states. Relay cannot cleanly express “paid commercial court,” “free public court,” “paid members-only club,” or “residents only.”
4. **There is no correction workflow.** A duplicate submission is rejected with “search the map,” but the player is not routed into updating the existing record. Detail pages have no **Suggest an update** action.
5. **Operational state is missing.** Opening soon, temporarily closed, seasonal, moved, and permanently closed cannot be represented separately from moderation status.
6. **Create and update cannot preserve source-by-fact evidence.** One `source_url` and one verification date cannot explain that hours came from an official page while parking came from a recent player correction.

### P1 — discovery and scale

1. **The mobile default is map-first.** At national zoom, clustered city areas are hard to interpret and no venue name is visible until a marker is selected. The list requires an extra view-menu interaction.
2. **Markers already collide at 118 records.** A browser audit could not activate one named marker because another marker covered its click point. The map has no clustering even though Metro Manila and Cebu are visibly dense.
3. **All records ship at once.** The `/courts` development SSR response was about 304 KB and contained all 118 listings. The client receives and filters the full directory; every map marker also enters the accessibility tree. This will not scale to the existing 205-candidate queue plus new sources.
4. **Search is literal client-side substring matching.** It has no typo tolerance, weighted exact/prefix ranking, city/province facets, map-bounds query, URL-persisted state, or meaningful national default order beyond alphabetic names.
5. **“Use my location” only reorders the entire national set.** It does not provide a clear radius, nearby/area mode, or fallback city suggestion.
6. **Every map marker is keyboard-exposed.** At 118 records the accessibility snapshot includes 118 marker buttons before map controls. The result list should be the canonical accessible collection; map keyboard interaction should expose clusters, selected items, or visible markers without creating an enormous tab sequence.

### P1 — contribution and moderation

1. **Suggest Court is creation-only and signed-in-only.** Public detail pages do not expose even a sign-in-preserving correction path.
2. **The form is too demanding for the common case.** A player who only knows a missing address must pass a long form containing seven days of hours, pricing, facilities, and booking fields.
3. **The UI cannot express split daily hours** even though `venue_operating_periods` supports multiple periods per day. Both contribution and admin forms expose one open/close pair and the admin reads only the first period.
4. **Admin review is an edit form, not a moderation workspace.** There is no proposed-vs-current diff, per-field acceptance, duplicate merge, evidence checklist, map pin review, or submitter notification.

### P2 — detail quality and parity

1. Public and authenticated detail pages duplicate almost the same implementation and can drift. Public has JSON-LD and stronger metadata; authenticated does not share that presenter.
2. Details omit last checked, access rules, reservation policy, dedicated/shared lines, net availability, court surface, accessibility, and update reporting.
3. Photos have a schema table but no visible, licensed court-photo workflow. Third-party photos must not be copied. Venue-owned or contributor-owned photos need explicit permission and moderation.
4. Search and filters are not represented in the URL, so results cannot be shared or restored.
5. Public users can plan a game but cannot help improve the directory without discovering the signed-in-only route elsewhere.

### What is already strong

- Unknown information is usually shown as unknown rather than guessed.
- Public results contain practical facts instead of ratings or popularity theater.
- Location stays on-device.
- Map attribution is visible and provider keys remain server-side.
- Unverified candidates are excluded from public discovery.
- External booking is described as external; Relay does not claim live availability.
- Session venue snapshots protect historical games from later directory edits.

## Competitive benchmark

### Pickleheads

Pickleheads combines a large map/list directory with court characteristics, games/groups, and community additions and edits. Its official tutorial collection includes adding a new court, and current court pages expose correction actions. USA Pickleball now points players to Pickleheads as its official court and game finder.

Relay should adopt the **add + suggest edit** expectation and strong court-attribute model, but not imitate raw scale claims, public ratings, or a general social network.

Sources:

- [Pickleheads court search](https://www.pickleheads.com/search)
- [Pickleheads tutorials](https://www.pickleheads.com/tutorials)
- [Pickleheads — adding a new court](https://www.pickleheads.com/tutorials/watch/adding-a-new-court)
- [USA Pickleball — Places to Play](https://usapickleball.org/places-to-play/)

### Playtomic

Playtomic’s advantage is live inventory and booking across partner clubs, alongside public/private matches and player features. That is a different operational business. Relay should link to venue-owned booking and measure the court-to-game handoff rather than presenting stale schedules as availability.

Source: [Playtomic pickleball courts](https://playtomic.com/pickleball-courts)

### PickleMap.ph

PickleMap.ph demonstrates Philippine demand for city, venue-type, price, availability, photo, review, and booking information, plus venue-owner submissions and claimed listings. Paid listing priority also demonstrates a trust trap Relay should avoid: paid placement must never silently affect nearby/relevance ranking.

Sources:

- [PickleMap.ph](https://picklemap.ph/)
- [PickleMap.ph court submission](https://picklemap.ph/submit-court/)

### Relay’s differentiated position

Relay should win on this shorter lifecycle:

**Discover a trustworthy place → understand access and expected cost → open official booking → create the complete friend game with that court attached.**

No benchmark connects Philippine court discovery to Relay’s roster, invite, queue, scoring, repayment, chat, and recap workflow.

## Google Maps and Places decision

Google Maps is useful as a **verification surface and outbound destination**, not as Relay’s persistent court database.

Google’s current Places policy says Places content must not be prefetched, cached, or stored beyond allowed exceptions; Place IDs are exempt and may be stored indefinitely. Places results displayed on a map must be shown on a Google Map. When Places content is shown without a map, Google attribution is required. The service-specific terms also state that Places API content must not be used with a non-Google map and latitude/longitude from Places may only be cached for 30 days. Relay currently uses MapLibre/Geoapify, so it must not merge stored Google Places content into that map.

Sources:

- [Google Places API policies and attribution](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Maps Platform service-specific terms, Places API §14](https://cloud.google.com/maps-platform/terms/maps-service-terms)

Google Places can return useful live fields—business status, regular/current hours, website, phone, Google Maps URI, parking, accessibility, and rating count—but availability varies and higher-value fields use higher billing tiers. Those fields are useful for an isolated, attributed reviewer lookup, not as facts Relay silently persists or republishes.

Source: [Google Places REST Place resource](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places)

### Recommended Google usage

- Accept Google Maps links as evidence leads in create/update requests.
- Keep **Directions** as a Google Maps URL based on Relay-owned/reviewed coordinates.
- Give admins an explicit **Open in Google Maps** verification action.
- If a future Places integration is added, keep it live, isolated, clearly Google-attributed, field-masked, quota-limited, and legally reviewed. Store at most the Place ID where permitted.
- Do not scrape Google Maps, copy reviews/photos, continuously crawl search results, persist Places content into Relay’s directory, or display Places content on the existing MapLibre map.
- Persist court facts only from sources Relay may reuse: venue-owned pages, official mall/LGU/federation pages, documented booking feeds with permission, direct venue confirmation, and contributor submissions Relay is licensed to publish.

## Nationwide data expansion

### Existing queue

The 205 unverified Philippine Pickleball Federation candidates are the highest-leverage backlog because Relay already has names, areas, and source context. They should not be bulk-published. Work region-by-region and require an exact facility-level coordinate plus current evidence.

Source: [PPF Places to Play directory, September 1, 2025](https://www.pickleball.ph/uploads/1/2/5/9/125919777/places_to_play_09.01.25.pdf)

### New high-confidence source lead: Robinsons Malls

A first-party Robinsons Malls page identifies pickleball at:

- Robinsons Galleria;
- Robinsons Las Piñas;
- Robinsons Butuan;
- Robinsons Dasmariñas;
- Robinsons GenSan;
- Robinsons Jaro;
- Robinsons Naga;
- Robinsons North Tacloban;
- Robinsons Palawan;
- Robinsons Roxas;
- Robinsons Starmills;
- Robinsons Sta. Rosa; and
- Robinsons Tagum.

It states that participating courts can be reserved through RMalls+. None of these names matched the two committed Relay source snapshots during this audit. They are **13 source-backed candidates**, not 13 publish-ready records: each still needs an exact facility pin, canonical mall address, current operating status, and duplication review.

Source: [Robinsons Malls — pickleball locations](https://robinsonsmalls.com/RobinsonsMalls_Pickleball)

### Venue-owned candidates and enrichment leads

- **PicklePoint Iloilo**: the venue-owned sites now identify two branches with machine-readable addresses and exact coordinates: Diversion has six indoor courts at 88 Sen. Benigno S. Aquino Jr. Ave., and Atria has nine indoor courts at Atria Park District. Both publish hours, open-play/private-rental access, and current price guidance. These two reviewed records are captured in `data/courts/picklepoint-iloilo-2026.json`; the importer dry run validates them without silently publishing them. [Diversion](https://www.picklepointiloilo.com/) · [Atria](https://atria.picklepointiloilo.com/)
- **Pickleville Davao**: the official site establishes an operating pickleball facility in Davao but the fetched public page did not provide enough structured location/rate detail. Keep it as an enrichment lead until an exact source-backed location is established. [Official site](https://pickleville.ph/)
- **The Supreme Courts**: the official site says “opening soon,” describes four pickleball courts and membership benefits. It must not appear as open. It is a useful test for the proposed `opening_soon` operational state. [Official site](https://thesupremecourtsph.com/)
- **PickleClub Davao**: a venue-owned booking site exists and exposes booking behavior and price guidance in current search results. It needs a direct structured review because the page resisted extraction. [Official site](https://www.pickleclubdavao.com/)

These are leads only. No court should be imported from this note without a reviewer checking the live first-party page, exact pin, duplication, access, and current operating status.

### Source ladder

1. **Publishable after review:** venue-owned site/booking page, official mall/LGU/facility page, federation source plus precise independent location, or direct venue confirmation.
2. **Candidate only:** public official social page, player submission with source link, or permitted booking-platform listing.
3. **Discovery lead only:** Google Maps, search snippets, or another court directory. Use them to locate an owner source or request confirmation; do not copy their content.
4. **Reject:** municipality-center coordinates, uncited social reposts, personal phone numbers, copied reviews/photos, conflicting identity, or unverifiable “opening soon” claims presented as open.

### Operational cadence

- Dynamic facts—hours, price, booking method, operational status: review every 90 days.
- Structural facts—location, court count, setting, access model: review every 180 days or after a correction.
- New/update requests: acknowledge immediately, triage duplicates/closures within 72 hours, and target a reviewed decision within seven days.
- Prioritize the existing 205-candidate queue and new first-party chain sources by underserved region, not by whichever metro already has the most pins.

## Proposed product model

### Separate the facts

Add independent fields rather than overloading price:

- `access_type`: `public`, `commercial`, `members`, `residents`, `school_or_community`, `invitation`, `unknown`;
- `reservation_policy`: `walk_in`, `reservation_required`, `walk_in_or_reserve`, `contact`, `unknown`;
- `operational_status`: `operating`, `temporarily_closed`, `seasonal`, `opening_soon`, `permanently_closed`, `unknown`;
- `court_line_type`: `dedicated`, `shared_or_temporary`, `mixed`, `unknown`;
- `net_type`: `permanent`, `portable_provided`, `bring_your_own`, `mixed`, `unknown`;
- optional `surface_type` and wheelchair-access facts;
- price returns to `unknown`, `free`, `paid`, `contact`, or `donation` only.

Unknown remains an explicit state. “Public” must never be inferred from “Free,” and “commercial” must never be inferred from “Paid.”

### One moderated change-request system

Create a durable `venue_change_requests` module for both intents:

- `request_type`: `create` or `update`;
- nullable target `venue_id` for update;
- proposed field patch rather than a directly mutated court row;
- one or more evidence URLs and contributor notes;
- submitter identity and abuse metadata;
- lifecycle: `submitted`, `needs_info`, `in_review`, `approved`, `partially_approved`, `rejected`, `duplicate`, `withdrawn`;
- reviewer, resolution note, and timestamps;
- immutable before/after snapshot for approved changes.

Approval applies only accepted fields in one transaction, updates freshness, writes the audit log, and expires directory caches. Completed session venue snapshots remain unchanged.

For deeper provenance, record `venue_fact_evidence` by field group (identity/location, access, hours, price, facilities, booking/contact). This allows Relay to say “hours checked 12 days ago” without implying every field was checked at the same time.

## Proposed experience

### Finder

#### Mobile

1. Open on a **list**, not a national map.
2. Search court, city, province, or amenity with immediate ranked suggestions.
3. Offer **Near me** only after a gesture; otherwise show useful region-based discovery and recently viewed courts on-device.
4. Keep compact filters visible: Access, Setting, Price, Availability, plus an overflow for parking, court type, net, and reservation.
5. Each row answers: where, access, setting/court count, expected price, reservation rule, current-hours interpretation, and last checked.
6. Map is a clear secondary view preserving the same query, filters, and selection.

#### Desktop

Keep the split locator: 360–400px independently scrolling result rail and dominant map. Add clustered markers, result count, **Search this area**, and URL-persisted query/filter/map state.

#### Ranking

1. exact court name;
2. name prefix;
3. city/barangay/address exact or prefix;
4. typo-tolerant text relevance;
5. distance when the user explicitly enabled location;
6. completeness/freshness only as a tie-breaker.

Never rank by payment, rating, or hidden promotion.

### Result row

Primary scan line:

- name;
- area/distance;
- access label;
- indoor/covered/outdoor and court count;
- price expectation;
- reservation requirement;
- `Open now`, `Closed · opens …`, or `Hours not listed`, always based on reviewed hours rather than live inventory;
- **Reviewed [date]** or **Some details need review**.

Primary action after selection: **Plan a game here**. Secondary: details, directions, official booking/contact.

### Court detail

1. Name, operational state, access, address, reviewed date.
2. Compact map/location and directions.
3. Decision facts: access, reservation, setting, court count, dedicated/shared lines, net, surface, price, hours.
4. Booking/contact actions with explicit external language.
5. Amenities, parking, accessibility, and only licensed photos.
6. Source/freshness explanation.
7. Primary **Plan a game here** and visible **Suggest an update**.

Public and signed-in routes should render one shared detail presenter. Public receives canonical metadata and structured data; authenticated gets the same facts inside the app shell.

### Suggest a court / Suggest an update

Use one entry surface with two clear choices:

- **Add a missing court**
- **Update an existing court**

For a detail-page entry, skip the choice and preselect the court.

#### Add flow

1. Identity and exact location: name, address, pin, source.
2. Access and playability: access type, reservation, court count, setting, line/net type.
3. Optional practical details: hours, price, booking/contact, amenities, licensed photo.
4. Review and submit.

Only step 1 is required. Relay asks for less rather than encouraging guesses.

#### Update flow

1. Search/select the existing court if not preselected.
2. Choose what changed: name/location, status, access, hours, price, courts/facilities, parking/amenities, booking/contact, duplicate.
3. Reveal only those fields, prefilled with current values beside proposed values.
4. Require a source link or direct-observation explanation; allow “I’m not sure—please verify.”
5. Review the exact proposed changes and submit.

Confirmation states that public information does not change until review. Signed-in users can see request status; a future email flow may support non-account contributors after abuse controls exist. Public detail pages should still expose the action and preserve the intended return path through sign-in.

### Admin moderation

Replace the generic edit-first experience for requests with:

- request type/status/source and submitter context;
- current vs proposed field diff;
- first-party source, Google Maps, and map-pin review shortcuts;
- duplicate candidates;
- approve all, approve selected fields, ask for information, reject, mark duplicate;
- operational-state controls for closed/moved/opening-soon venues;
- audit history and submitter notification.

Keep the existing canonical court editor for direct admin repair, but route change requests through the diff workflow.

## Technical direction

1. **Pass `venueId` from every Finder/detail CTA.** On Create, resolve the current verified court server-side and prefill name/address from the canonical record. Do not trust query-string copies.
2. **Move directory querying server-side.** Add bounded search/filter endpoints or server functions with cursor pagination and map-bounds queries. Return a lightweight list projection; fetch complete details on selection.
3. **Persist finder state in the URL.** Query, filters, result cursor, and optional map bounds become shareable and restorable.
4. **Cluster the map now.** Use a GeoJSON source/layer for clusters and unclustered points. Keep the list as the canonical accessible collection and announce selection/count changes.
5. **Do not mount MapLibre for the initial mobile list.** Load it on explicit Map intent; retain the already-good provider proxy and attribution.
6. **Extract shared route presenters.** One finder core and one court-detail presenter serve public/authenticated shells without duplicating facts.
7. **Model change requests as a deep module.** The feature owns validation, duplicate detection, evidence, approval transactions, history, revalidation, and notifications behind a small interface.
8. **Preserve source snapshots.** Importers continue to be deterministic, idempotent, reviewed artifacts—not continuous scrapers.
9. **Add SEO discovery pages carefully.** Public court details remain indexable. Add city/province landing pages only when they contain enough reviewed listings and unique factual content; never generate thin pages for every municipality.

## Delivery plan

### Phase 0 — trust-model migration

- Separate access, reservation, operational state, and price.
- Add field-group freshness/evidence and `venue_change_requests`.
- Backfill without inventing access facts; ambiguous records become `unknown`.
- Fix the Finder/detail → Create `venueId` handoff.
- Extract shared detail presenter.

**Gate:** no existing verified court disappears; old sessions remain unchanged; every unknown remains explicit; Finder-created games retain `venue_id`.

### Phase 1 — correction loop

- Add **Suggest an update** to every detail and selected-court overlay.
- Replace creation-only suggestion with Add/Update intents and progressive forms.
- Add admin diff review, partial approval, duplicate handling, and audit history.
- Show reviewed dates and truthful field confidence.

**Gate:** no request directly changes public data; admins can approve selected fields atomically; submitters receive a clear outcome; closure and duplicate reports are actionable.

### Phase 2 — discovery redesign and scale

- Make mobile list-first.
- Add server-ranked search, cursor pagination, URL state, access/reservation filters, and nearby/area discovery.
- Add map clustering, bounds search, and lightweight selection fetches.
- Keep public/authenticated finder behavior identical except shell and auth-aware CTA destination.

**Gate:** 1,000 test courts remain responsive; initial HTML does not contain the whole directory; keyboard users do not tab through every national marker; 390px and 1440px workflows pass in both themes.

### Phase 3 — nationwide source expansion

- Process the 205 existing candidates by underserved region.
- Add a reviewed Robinsons source snapshot with 13 candidates.
- Review venue-owned leads beginning with PicklePoint Iloilo, Pickleville Davao, PickleClub Davao, and opening-soon handling for The Supreme Courts.
- Add coverage and freshness reporting to admin.

**Gate:** every published record has an exact facility pin, reusable source evidence, current operational state, access classification or explicit unknown, and a review date.

### Phase 4 — richer decision information

- Add dedicated/shared line, net, surface, accessibility, and licensed contributor/venue photos.
- Add optional saved/recent courts only if usage supports them.
- Explore direct booking/data partnerships after Relay can show qualified outbound booking traffic and completed games.

**Gate:** richer fields improve court selection or game creation; no copied photos/reviews; no implied live inventory.

## Test and quality plan

### Domain/integration

- create vs update request validation;
- sparse proposed patches and per-field approval;
- access/price independence;
- operational lifecycle;
- duplicate detection and merge behavior;
- multi-period daily hours;
- approval transaction, audit trail, cache invalidation, and immutable session snapshots;
- venue ID handoff authorization and fallback when a court is archived mid-flow.

### Browser workflows

- public search → court detail → sign up → prefilled Create with venue ID;
- authenticated list/map search → Plan a game here;
- detail → Suggest an update → select changed fields → submit;
- missing result → Add a court;
- admin partial approval and duplicate resolution;
- location allowed, denied, unavailable, and removed;
- empty, loading, network failure, stale, closed, opening soon, and archived states;
- keyboard, screen reader, reduced motion, light/dark, 390px/1440px, and no horizontal overflow.

### Scale budgets

- initial public response must not serialize all national court records;
- only the visible result page enters the accessible result collection;
- map clusters replace overlapping DOM markers at national/city zoom;
- map code loads after explicit mobile intent;
- tile/search/provider quotas are measured per successful court selection, not page view.

## Success measures

Primary product funnel:

- Finder opened → court selected;
- court selected → official booking/contact opened;
- court selected → game creation started;
- game creation started → game published with `venue_id`;
- repeat host reuses or changes a reviewed court.

Trust and coverage:

- no-result rate by region;
- verified courts by province/city, without presenting count as quality;
- percentage with access, price, hours, reservation, and contact path;
- median fact age by field group;
- correction requests per 100 court views;
- correction decision time and approval rate;
- closure/duplicate rate;
- percentage of candidates rejected for ambiguous coordinates.

Do not optimize for map views, raw listing count, reviews, or paid prominence.

## Explicit anti-goals

- Scraping or mirroring Google Maps or competitor directories.
- Claiming exhaustive Philippine coverage.
- Showing Google Places content on the existing MapLibre map.
- Internal court reservations, payments, refunds, or live slot inventory.
- Ratings, popularity ranks, promoted nearby results, or copied reviews.
- Publishing municipality-center pins or uncertain coordinates.
- Treating unknown parking/access/hours as “No.”
- Letting a community update bypass moderation.
- Rewriting historical session venue snapshots after a court changes.

## Decisions requested before implementation

1. Confirm mobile **list-first** even though the current design document specifies map-before-list on mobile.
2. Confirm that public visitors see **Suggest an update**, with sign-in preserving the selected court and return path for submission.
3. Confirm the proposed access taxonomy; in particular whether private residential and school/community facilities should remain discoverable when access instructions are known.
4. Confirm that Google remains a verification/click-out aid rather than a persistent data provider, unless counsel approves a separately attributed live Places experience.
