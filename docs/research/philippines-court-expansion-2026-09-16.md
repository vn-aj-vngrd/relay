# Philippine court directory expansion — September 16, 2026

## Delivered

Relay's live directory increased from **118 to 305 verified venue listings**. Imported **187 new distinct venues**. Individual playing courts are stored separately and were not used to inflate this target. Existing venue identities were preserved.

The public [Court Finder](https://relay.vanajvanguardia.tech/courts) was checked after invalidating its `court-directory` cache tag: all 187 new venue URLs appear in the public response, alongside the existing 118. The database contains 305 verified, 205 unverified and one archived record. Nineteen additional research candidates remain in the new snapshot files only, unpublished.

## Added sources

| Source | Published additions | Held in research |
| --- | ---: | ---: |
| PickleHub operator booking listings | 136 | 4 |
| PlayServe operator booking sites | 14 | 0 |
| Manila-area operator sites and profiles | 5 | 0 |
| Sparrk Metro Manila booking venues | 6 | 0 |
| Cebu venue websites | 7 | 5 |
| SKEDNA booking venues | 19 | 10 |
| **Total** | **187** | **19** |

New addresses include 66 Davao City venues, 13 Metro Manila venues, and 10 across Cebu (including Carcar). Other additions cover Tagum, General Santos, Koronadal, Cagayan de Oro, Kidapawan, Dumaguete, Bacolod, Cavite, Laguna and other cities. These regional tallies are address-based, not a claim that all regions have equal coverage.

## Verification and exclusions

- Confirmed pickleball activity through current operator websites, operator-hosted booking pages or public bookable court inventory.
- Retained per-venue source URLs, location evidence, review date and verification notes. Snapshot `publishedAt` is the research snapshot date, not an asserted opening date.
- Resolved named map markers where provided. Corrected viewport-center coordinates; rejected city/road-only locations, contradictory pins and unclear co-located facilities.
- Removed known existing duplicates (including MTS Pavilion and SPS Pickleball), a test venue and coming-soon listings. Separated pickleball inventory from badminton, padel, table tennis and other sports. Ambiguous court counts remain unknown.
- Preserved unknown prices, hours and amenities instead of fabricating completeness. Source-derived map verification is remote documentary evidence, not a physical survey or a guarantee that operating details never change.

Evidence:

- [PickleHub and Sparrk](metro-courts-verification-2026-09-16.md)
- [PlayServe and Manila operator venues](manila-booking-verification-2026-09-16.md)
- [Cebu venues](cebu-booking-verification-2026-09-16.md)
- [SKEDNA](skedna-courts-verification-2026-09-16.md)

## Implementation and verification

Reused `scripts/import-ph-courts.ts`, its existing structured venue schema, source identities, duplicate screening, and the existing Court Finder. No new UI pattern was introduced. The importer now accepts per-record verification evidence and actual review dates, and additive snapshots opt out of source-wide archival. New data-regression coverage lives in `src/features/venues/import-data.test.ts`; `import-ph-courts.test.ts` exercises missing-evidence rejection, additive imports and legacy archival behavior with a mocked database.

The six new snapshots passed the importer's Zod schema and publication-evidence checks. Verified additions were applied through the connected Supabase SQL interface with the existing `(source, source_external_id)` identity and conflict protection; no schema or access-policy changes were made. Inserted 187 venue rows and 133 operating periods. A post-import comparison confirmed **187/187** source identities, pins (within database numeric precision), booking links, source links, review timestamps and evidence notes match the reviewed snapshot.

Direct anonymous table reads are intentionally unavailable in the current database; that diagnostic returned permission denied. Public visibility was verified through the application's server-rendered Court Finder instead. Vercel tag invalidation refreshed the cached listing successfully; no application deployment was needed for these data additions.

Pre-commit validation: formatting/lint, strict TypeScript and the production build passed. The full unit run exercised 2,515 tests: 2,514 passed and one existing photo-export case timed out at five seconds. All 57 tests in that file passed unchanged on a focused retry; its three export-placement cases also passed in isolation. All nine new court tests passed. No assertions, test timeouts or unrelated product code were changed. CI remains the independent merge gate. The live data and public HTTP checks above are separate from code validation; browser interaction/E2E was not run.

Help Center: no article change is needed because this expands catalog contents without changing Court Finder controls, permissions or user steps. Existing discovery guidance still applies. The data-only publication already occurred before the PR; merging the repository snapshots does not require a second production import.

## Remaining accuracy work

This expansion does not re-certify all 118 pre-existing venues. Research found conflicting old/new pins for J-Cob's and Side-out in Cebu, approximately 1.7 km and 7.4 km apart. They were excluded from additions and left for relocation/source reconciliation rather than silently moved. See the Cebu evidence note. Resolve these and the 19 held new candidates with stronger location evidence before claiming every directory record is exact.
