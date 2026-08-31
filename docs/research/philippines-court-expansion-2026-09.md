# Philippines court directory expansion — September 2026

## Outcome

Relay now has a reviewable nationwide import rather than an unbounded scraper:

- **29 current SM Active Hub facility records** from SM Supermalls’ first-party directory, all eligible for publication after coordinate review.
- **244 unique domestic venue records** normalized from the Philippine Pickleball Federation’s September 1, 2025 Places to Play directory.
- **39 federation records** have separately reviewed coordinates and are eligible for publication.
- **205 federation records** remain unverified candidates because the source does not supply coordinates and available geocoders returned only a municipality, street, or ambiguous place. They are deliberately excluded from the public Court Finder until a precise location is established.
- After the reviewed import, the database contains **118 verified public courts**, **205 unverified review candidates**, and one previously archived duplicate.

The import does not claim exhaustive **Court directory coverage**. Public and private courts open, close, and change access continuously; “all courts in the Philippines” is not a defensible static claim. The durable target is all currently supportable records from reviewed sources, with uncertain candidates retained for follow-up instead of being published with fabricated pins.

## Primary sources

### Philippine Pickleball Federation

The Philippine Pickleball Federation’s public Places to Play PDF lists venue name, address or area, court count, setting, schedule, cost, and contact details across NCR, Luzon, Visayas, and Mindanao. Relay uses only the venue facts; it does not republish personal phone numbers or email addresses.

The PDF contains club sessions as well as physical venues, duplicate entries for some facilities, typographical errors, and no coordinates. Relay normalized 244 unique domestic records after removing international entries, clear duplicate rows, one malformed merged row, and records superseded by fresher first-party SM data.

Source: [PPF Places to Play directory, September 1, 2025](https://www.pickleball.ph/uploads/1/2/5/9/125919777/places_to_play_09.01.25.pdf)

The PPF `robots.txt` disallows automated crawling of `/courts.html` but does not disallow the directly linked `/uploads/…` PDF used for this one-off reviewed snapshot. The importer reads the committed normalized snapshot; it does not continuously crawl PPF.

Source: [PPF robots policy](https://www.pickleball.ph/robots.txt)

### SM Active Hub

SM Supermalls’ current first-party Active Hub page lists each facility, its mall location, court count, and operating hours. The table contains 29 facility rows, including separate facilities within SM Southmall, SM City Novaliches, and SM Seaside City Cebu. Relay preserves those as distinct records rather than collapsing their different locations and hours.

SM’s headline says “86 courts across 29 malls,” while the published table’s row counts total 87 court spaces and include repeated malls. Relay does not repeat the aggregate claim; it stores each row’s stated count.

Sources:

- [SM Active Hub pickleball courts](https://www.smsupermalls.com/sm-active-hub-pickleball-courts)
- [SM Supermalls robots policy](https://www.smsupermalls.com/robots.txt)

Two mall coordinates needed supplemental location evidence because Geoapify did not return the named property:

- Four E-Com Center remains an SM Prime property in the Mall of Asia Complex; Relay uses the reviewed complex coordinate rather than Geoapify’s unrelated Kapasaya result. Source: [SM Investments announcement](https://www.sminvestments.com/press_release/sm-prime-launches-threee-com-center-and-tops-off-foure-com-center-in-mall-of-asia-complex/)
- SM City CDO Uptown is on Fr. Masterson Avenue at Gran Via Street. The coordinate remains tied to the named mall rather than a generic city center. Primary venue source remains the SM Active Hub directory.

## Verification policy

A record is marked `verified` only when all of these are true:

1. A reviewed federation or venue-owned source identifies a pickleball facility.
2. The record has a complete coordinate pair inside Philippine **Court directory coverage**.
3. The coordinate resolves to the named property or exact street address rather than a municipality center.
4. The stored source URL and last-seen date remain attached to the record.

A federation listing without a precise reviewed coordinate is imported as `unverified`. This is intentional: showing fewer trustworthy pins is better than presenting false precision. The nationwide importer also skips likely duplicates against existing reviewed records and never copies third-party photos, reviews, or editorial descriptions.

## Operating procedure

```bash
# Validate data and inspect duplicate decisions without writing
pnpm venues:import-ph

# Apply the reviewed snapshot
pnpm venues:import-ph -- --apply
```

The command is idempotent by `(source, source_external_id)`. It archives records removed from a managed source, keeps a verification note, and prints every likely duplicate it skips. The committed JSON files are the audit surface; source changes require a new reviewed snapshot rather than silent continuous scraping.

## Follow-up queue

The 205 unverified federation candidates are the next verification queue. Prioritize underserved regions and verify each against a venue-owned page, LGU facility page, current booking page, or direct submission. Add an exact pin only when the evidence identifies the physical facility; municipality-center geocodes must remain rejected.
