# SKEDNA venue verification — September 16, 2026

## Result

Reviewed 29 public venue booking pages discovered through the [SKEDNA booking directory](https://skedna.com/courts). The final snapshot contains 19 verified additions and 10 held candidates. Only the verified additions qualify for publication. These are distinct venues, not individual playing courts.

Each record retains its booking URL, review date, street address and location evidence. This is remote documentary verification, not an on-site survey. Unknown prices, physical court counts and indoor/outdoor classifications remain unset. Published daily opening hours are retained where the source supplies an unambiguous daily schedule.

## Exact pin review

The booking pages expose SportsActivityLocation JSON-LD, a public booking schedule, and a map or directions link. Structured coordinates alone were insufficient: several were map viewing centers or conflicted with the directions destination.

Resolved the operator-linked named Google property and used its actual marker for Court A Pickleball, Picklebase Mati, Prekayball Dumaguete, The Glass House, Teacool Bulls, The Compound, The Yard, Quantum Courts, PicklePop, Zoe Picklehub and The Pickledome. The per-record locationSourceUrl retains the evidence. For example, Court A's structured coordinate was approximately 1.4 km from its named property; The Glass House and The Compound had approximately 280 m viewport offsets. These were corrected before publication.

Other accepted records use their venue-published destination pin with a matching specific address, without a conflicting location signal. No municipality-center geocoder or invented coordinates were used. A source pin is not a guarantee of survey-level accuracy.

## Held records

| Venue | Reason |
| --- | --- |
| PickleShots Hideout / The FitScape | Two differently named Mati venues publish the same coordinates |
| RD Pickle Zone / The Grounds Co. Pickle Park | Missing complete coordinate pair |
| Bea's Pickleball Court / Tropical Pickle / The Family Court | Directions and structured coordinates disagree by over 800 m |
| CLUB RUFINO / 5J Dink and Drink | Directions identify a broad area or road, not the named facility |
| Thetopfloorpicklrs | Directions identify a residential property without a proven facility connection |

The directory also advertised a demo venue. It was excluded outright, not imported as a candidate. Pagination produced varying orders; this snapshot is the reviewed set, not a claim of exhaustive platform coverage.

## Reproduction

Use the public booking URL in each row of [the snapshot](../../data/courts/skedna-2026-09-16.json), inspect its published address and directions link, and compare the actual named property marker with the stored pin. Do not use the `@latitude,longitude` viewport or the first `!2d`/`!3d` embed coordinates as a place marker.

No booking, payment, user account or private booking data was accessed. Photographs, reviews and editorial descriptions are not reproduced.
