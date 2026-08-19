# Court discovery product audit

Research date: 2026-08-19

## Decision

Relay should add court discovery, but it should **not** become a court-directory or booking marketplace.

The feature should be framed as:

> **Find a court, then start the game there.**

Court discovery belongs inside Relay because it closes a real gap at the beginning of the session lifecycle. Today Relay is excellent once a host already knows the venue. A host who only knows “we want to play Saturday” still has to leave Relay, search elsewhere, compare incomplete information, then retype the chosen place into Create.

The right product is a **venue decision step that hands directly into session creation**:

**Find → compare → book externally → create with this venue → share → play**

The hard part is trusted venue data, not drawing a map. Relay should prove the data and handoff with a small Metro Cebu catalog before attempting nationwide coverage. Metro Cebu is the right beachhead because the founder can verify venues and observe real sessions locally.

## Refined product concept

### User job

> “Help me choose a suitable place for this friend game, then carry that choice into the session without making me enter everything again.”

### Promise

A host can search near a location, compare the few facts that affect a friend game, open the venue’s official booking channel, and start a Relay session with the venue already filled in.

### Boundary

Relay remains responsible for the session around the reservation. The venue or its booking provider remains responsible for inventory, prices, policies, payment, confirmation, cancellation, and refunds.

Do not call an external link “available” or “book now” unless Relay has a real availability integration. Use **Open booking page**, **Call venue**, or **Message venue**.

## Competitive benchmark

### Pickleheads

Pickleheads combines discovery and organization. Its current App Store listing says it has more than 16,000 court locations, a community-driven directory, nearby games, groups, session scheduling, waitlists, and payments. USA Pickleball identifies Pickleheads as its official court and game finder and says ambassadors and members help maintain locations, schedules, and open-play times.

Sources:

- [Pickleheads App Store listing](https://apps.apple.com/us/app/pickleheads-play-pickleball/id6448714446)
- [USA Pickleball Places to Play](https://usapickleball.org/places-to-play/)

**Relay implication:** a large directory only becomes defensible through years of submissions, moderation, and partnerships. Relay should not imitate the scale claim. Its advantage can be the shortest path from a trusted venue to a private friend session.

### USA Pickleball Places2Play

Places2Play supports map and destination search, indoor/outdoor/free/court-type filters, photos, weather, ratings, check-ins, and submitted edits.

Source: [USA Pickleball Places2Play App Store listing](https://apps.apple.com/us/app/usa-pickleball-places2play/id1235144261)

**Relay implication:** setting, access, price, court type, and data corrections are useful. Background GPS, ratings, weather, and check-ins at a public place are not necessary for Relay V1.

### Playtomic

Playtomic connects venue discovery to live booking, matches, and player progression. Its pickleball page presents court listings as part of a broader racquet-sports booking network.

Source: [Playtomic pickleball](https://playtomic.com/pickleball-courts)

**Relay implication:** live inventory is a separate business and integration surface. Relay should deep-link to the venue’s chosen booking provider rather than creating an incomplete reservation experience.

### Philippine products

PickleMap.ph markets a Philippine directory with city, setting, price, availability, photos, reviews, booking inquiries, claimed listings, and paid venue placement. Its public product currently claims 358+ courts across 86 cities. Courtogo presents 177 Philippine sports venues with court count, setting, and hourly price and is explicitly a booking product. Sparrk similarly markets venue discovery and booking to players and court hosts.

Sources:

- [PickleMap.ph](https://picklemap.ph/)
- [Courtogo](https://www.courtogo.com/)
- [Sparrk pickleball courts](https://www.sparrk.ph/pickleball-court/)

**Relay implication:** Philippine court discovery already exists. Copying or scraping those catalogs would create licensing, freshness, and trust problems. Relay should either form a data partnership later or maintain a smaller, independently verified catalog optimized for session creation. Paid placement must never silently distort “nearby” ranking.

## Existing Relay audit

Relay already has useful pieces but not a working court finder.

### What exists

- An explicit `venues` table with address, coordinates, setting, court count, hours, price range, parking, amenities, paddle rental, contact, website, social link, and external booking link.
- A `/venues/[slug]` detail route with basic facts, external booking, and Create a game here.
- A venue type in global search.
- A Geoapify-backed venue/address autocomplete inside Create and Edit.
- Philippine country filtering and a server-only Geoapify key.
- Session-level venue name and address snapshots, so sessions can preserve historical plan text.

### What is missing or broken as a product flow

1. The production `venues` catalog currently has **zero records**. Global venue search and venue detail pages therefore have nothing to expose.
2. There is no `/venues` browse destination, nearby view, map, filters, recent venues, saved venues, or no-result contribution flow.
3. Current Geoapify autocomplete finds addresses and some named amenities, but it does not establish that a result is a playable pickleball venue.
4. Selecting a Geoapify result stores only venue name and address in the session form. It does not persist provider ID, coordinates, or a `venue_id` relationship.
5. **Create a game here** links to `/games/new` without identifying the venue, so the form is not actually prefilled.
6. Venue details do not show provenance, verification date, official contact, operating hours, source confidence, or correction controls.
7. A host cannot report a missing or incorrect court.
8. The product cannot distinguish verified venue facts from best-effort map data.

### Current Geoapify findings

Geoapify is useful infrastructure but not a complete pickleball catalog:

- Address Autocomplete supports amenity searches, Philippine filtering, and location bias.
- The Places API supports broad categories such as `sport.pitch`, `sport.sports_centre`, `sport.sports_hall`, and `activity.sport_club`; it does **not** expose a first-class pickleball category.
- Place Details may expose raw OpenStreetMap tags such as `sport=pickleball`, `indoor`, `covered`, `access`, `fee`, and `charge` when contributors supplied them.
- A live autocomplete query for “pickleball” returned several Philippine pickleball amenities, but named venues such as Pickleball Hub and Playline were absent.
- A nationwide OpenStreetMap query returned only 38 objects tagged `sport=pickleball`, 28 with names. Several were unnamed or duplicated, while Philippine directories claim hundreds of courts.

This makes OpenStreetMap/Geoapify a useful fallback and enrichment source, not a sufficient primary catalog.

Sources:

- [Geoapify Address Autocomplete](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/)
- [Geoapify Places API and categories](https://apidocs.geoapify.com/docs/places/)
- [Geoapify Place Details](https://apidocs.geoapify.com/docs/place-details/)
- [OpenStreetMap `sport=pickleball`](https://wiki.openstreetmap.org/wiki/Tag:sport%3Dpickleball)

The public OpenStreetMap Nominatim service must not power Relay autocomplete: its usage policy forbids client autocomplete, limits total traffic, and requires caching and attribution. Relay’s current Geoapify integration avoids that constraint.

Source: [OpenStreetMap Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)

## Recommended V1

### 1. Add a list-first court finder

Route: `/venues`

Entry points:

- **Need a court? Find one** beside the Venue field in Create.
- Venue results in global Search.
- A quiet **Find a court** action on the empty/upcoming Home state.
- No new permanent mobile-navigation item; sessions remain primary.

Default mobile layout:

1. Search location or venue name.
2. Optional **Use my location**, only after a user gesture and never in the background.
3. A compact results list.
4. List/Map switch; map code loads only when selected.
5. Filters in a sheet.

Do not lead with a large map. Hosts compare names and facts more efficiently in a list, and a list is faster and cheaper on mobile.

### 2. Show only decision-making facts

Each result should show:

- venue name;
- city/area and distance when location permission is available;
- indoor, covered, or outdoor;
- number of playable courts when verified;
- indicative price range with a **last checked** date;
- paddle rental and parking when known;
- official booking/contact method;
- verification label: **Verified by venue**, **Checked by Relay**, or **Map listing—confirm details**.

Primary result action: **Use this venue**.

Secondary action: **View details**.

Avoid ratings, popularity scores, “best court” labels, public reviews, promoted ranking, and fake availability.

### 3. Make venue selection complete the Create handoff

`/games/new?venue=<venue-id>` should prefill:

- venue ID;
- name;
- address;
- coordinates;
- usual court count as a suggestion, not a forced value;
- official booking URL;
- recent price guidance as non-authoritative helper text.

The Create form should retain a clear **Open booking page** action. After external booking, the host returns and records booked status, court numbers, reference, total, screenshot, and notes through the existing flow.

Sessions should keep both:

- nullable `venue_id` for current venue relationships;
- immutable session snapshots of venue name and address for history.

A later venue correction must not rewrite completed sessions.

### 4. Build a trusted catalog, not an unreviewed feed

Use three data tiers:

#### Tier A — Relay verified

Start with 15–30 Metro Cebu venues across Cebu City, Mandaue, Lapu-Lapu, and nearby municipalities, checked against venue-owned websites, booking pages, official social accounts, or direct venue confirmation. Store source URL and last verification date internally.

#### Tier B — Provider fallback

Geoapify results allow a host to use an unlisted place immediately. Label them **Map listing—confirm details**. Do not automatically publish every selected address into the browse catalog.

#### Tier C — Community suggestion

When no result fits, offer **Suggest a missing court** with name, location, official link/contact, and optional note. Send it to an admin review queue. Approved suggestions become normal venues; rejected or duplicate submissions never pollute search.

Do not scrape PickleMap, Courtogo, Google Maps, booking platforms, or venue photos. Use a partnership or documented API before importing third-party catalogs.

### 5. Keep map infrastructure restrained

Geoapify can provide tiles and currently offers 3,000 free credits per day. Its pricing documentation estimates roughly 14 tiles per map view and 50 tiles per interactive map session; each tile costs 0.25 credits. This is adequate for an early, lazy-loaded map but not for an always-mounted map on every Create screen.

Source: [Geoapify pricing details](https://www.geoapify.com/pricing-details/)

If Geoapify tiles are used in the browser:

- create a separate browser map key;
- restrict it by production/preview origins;
- never expose the current unrestricted server key;
- keep required Geoapify and OpenStreetMap attribution visible;
- monitor daily credits;
- unload the map when list view is active.

Leaflet is the smaller implementation choice for a simple marker map. MapLibre is justified only if Relay needs vector styling, clustering at scale, or richer map interactions.

## Information architecture

```text
Home
└── Find a court (contextual secondary action)

Create
├── Venue field
│   ├── existing autocomplete
│   └── Need a court? Find one
└── selected venue summary
    ├── venue facts
    ├── Open booking page
    └── Change venue

/venues
├── Search location or venue
├── Use my location
├── List / Map
├── Filters
├── Results
└── Suggest a missing court

/venues/[slug]
├── identity, verification, last checked
├── map and directions
├── court facts
├── hours, pricing, parking, rental, amenities
├── official contact and external booking
├── Report incorrect details
└── Use this venue
```

Global navigation does not need a Courts item in V1. Court discovery is a contextual branch of Create and Search, not a new center of gravity.

## Filters for V1

Include only filters backed by reliable fields:

- distance;
- indoor / covered / outdoor;
- court count;
- free / paid / unknown;
- paddle rental;
- parking;
- external booking link available.

Defer:

- available today;
- exact live time slots;
- ratings and reviews;
- skill-level suitability;
- crowd level;
- open-play schedules;
- weather;
- personalized recommendations.

“Open now” is acceptable only when verified structured hours exist and the UI shows when those hours were checked.

## Domain and schema changes

The existing `venues` and `venue_photos` entities are a good foundation. Add only what the trust model needs:

- `source_type`: Relay, venue, Geoapify/OSM, community;
- `source_id` and internal `source_url`;
- `verification_status`;
- `verified_at` and `last_checked_at`;
- `submitted_by_id`;
- normalized `setting`: indoor, covered, outdoor, mixed;
- optional structured price minimum/maximum and unit;
- optional booking method type;
- timestamps for archival or closure.

Add a small `venue_suggestions` moderation entity instead of allowing direct public edits. Preserve the explicit session snapshot fields already in place.

## Key workflows

### Host knows the venue

Create → type venue → select known Relay venue or Geoapify fallback → continue normally.

The finder does not slow down the existing fast path.

### Host needs a venue

Create → Need a court? → search area / near me → filter → choose venue → inspect details → open official booking → Use this venue → Create returns prefilled → publish or save draft → mark booked after confirmation.

### No venue found

No results → Suggest a missing court or use the typed place for this session only → Relay never blocks session creation.

### Repeat group

Play Again or Create from Group reuses the last verified venue as a suggestion. The host can keep it or open Find a court.

## What not to build

- Internal reservations or availability inventory.
- Venue payments, refunds, or cancellation handling.
- A court-owner dashboard or subscription business.
- Paid placement in nearby results.
- Public reviews before moderation and abuse operations exist.
- Nationwide launch before Metro Cebu data quality is proven.
- Background location tracking.
- A second social/discovery feed around venues.
- Automated ingestion from competitor websites.

## Rollout plan

### Milestone 0 — data proof

Curate 15–30 Metro Cebu venues from official sources. Track source and verification date. Interview five local hosts using a clickable list prototype.

**Gate:** at least 80% of test searches return a suitable trusted venue, and hosts identify the displayed facts as enough to decide where to inquire.

### Milestone 1 — finder and Create handoff

Build `/venues` list search, filters, details, **Use this venue**, prefilled Create, recent venues, external booking, directions, and all loading/empty/error states.

**Gate:** a host can go from unknown venue to a published session without retyping venue data or believing Relay completed the booking.

### Milestone 2 — map and nearby

Add user-initiated location, lazy list/map switch, marker selection, and distance sorting. Keep list state and map selection synchronized.

**Gate:** 390px use has no horizontal overflow, location denial has a complete manual-search fallback, and map usage stays inside the configured credit budget.

### Milestone 3 — missing and incorrect venues

Add court suggestions, corrections, duplicate detection, and an admin moderation queue.

**Gate:** no unreviewed submission becomes publicly searchable and every displayed fact has provenance.

### Milestone 4 — partnerships

Explore an API/data partnership with Philippine directories or booking providers only after Relay can demonstrate booking-link traffic and completed sessions. A partnership should enrich the venue-to-session handoff, not turn Relay into a marketplace.

## Success metrics

Primary:

- finder opened → venue selected;
- venue selected → session published;
- median time from finder open to published game;
- percentage of published games linked to a structured venue;
- percentage of hosts who reuse a venue through Play Again.

Quality:

- no-result rate by city;
- correction rate per venue;
- stale venue rate;
- external booking/contact click-through;
- Geoapify fallback versus verified-catalog selection;
- location permission denial and recovery;
- API credits per successful venue selection.

Do not optimize for map views, venue page views, or raw catalog size.

## Final recommendation

Build this feature, but call it **Find a court** and make **Use this venue** the defining action. The market does not need another broad directory from Relay. It needs the cleanest bridge from choosing a place to running a complete friend session.

The first investment should be trusted Metro Cebu venue data and the Create handoff. The map is a supporting view. Booking remains external. If the 15–30 venue pilot does not materially improve session creation, stop before building a nationwide catalog or owner platform.
