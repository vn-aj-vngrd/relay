# PlayServe operator court verification — 2026-09-16

## Scope and method

14 venues confirmed from their own live booking websites, including three in Metro Manila (Quezon City, Mandaluyong, Caloocan), plus urban/provincial coverage. Venue entries represent facilities, not separately inflated rows for every playing surface.

The [PlayServe operator platform](https://playserve.co/) links to each tenant. Actual venue booking sites show named court inventory and booking links. For every included venue, the operator's own Google Maps embed was loaded and its **named place marker** and address were checked against the venue. Several sites publish incorrect `GeoCoordinates` copied from the map viewport, often hundreds of metres west of the actual venue. Those viewport values were discarded. The dataset uses marker coordinates returned for the named place in the embed response; `locationSourceUrl` preserves the exact operator-linked map URL.

This verifies online evidence and mapped venue identity on the stated date, not a physical survey or court-door GPS measurement. The resort entry explicitly uses its hosting property pin. No city centroids or inferred street geocoding were used. No directory photographs, descriptions or reviews are copied.

## Verified venue evidence

| Venue / primary booking source | Address | Actual place marker | Pickleball courts | Map marker identity/address |
| --- | --- | --- | --- | --- |
| [Ace's Sports Center](https://acessports.playserve.app) | Purok 14, Poblacion, Bayugan, Agusan del Sur | 8.7092946, 125.7483229 | 4 | Purok 14, Ace's Sports Center, Poblacion, City of Bayugan, 8502 Agusan del Sur |
| [Court Haus PH](https://courthausph.playserve.app) | Block 63, Lot 18 Commonwealth Avenue, Quezon City, Metro Manila | 14.7104457, 121.0608085 | 4 | block 63, CourtHaus PH (Pickleball Center), lot 18 Commonwealth Ave, Quezon City, Metro Manila |
| [Dink Kulture Pickleball Centre](https://dinkkulture.playserve.app) | 152 Primo Cruz, Brgy. New Zaniga, Mandaluyong, Metro Manila | 14.5845923, 121.0311946 | 2 | Dink Kulture Pickleball Centre, 152 Primo Cruz, Brgy. New Zaniga, Mandaluyong City, 1550 Metro Manila |
| [Double T](https://doubletcourts.playserve.app) | Balayag Manok, Bacong–Valencia Road, Valencia, Negros Oriental | 9.269690499999999, 123.261821 | 3 | Double T Sports Center, Balayag Manok, Bacong - Valencia Rd, Valencia, 6200 Negros Oriental |
| [Inside-Out Courtyard](https://insideout.playserve.app) | Cora's Manor & Garden Resort, Pico Ave., Mapandan, Pangasinan | 16.0322038, 120.450968 | Withheld (4/6 conflict) | Cora's Manor and Garden Resort, Mapandan, Pangasinan |
| [Lowcal Grounds](https://lowcalgrounds.playserve.app) | Lower Calin-ay, Poblacion, Samboan, Cebu | 9.5232911, 123.3106729 | 2 | G8F6+GVR LowCal Grounds, Poblacion, Samboan, Cebu |
| [Pickleball Elites Sports Center](https://pickleballelites.playserve.app) | 248 San Gregorio Street, Indang, Cavite | 14.1890931, 120.8810648 | 9 | PICKLEBALL ELITES SPORTS CENTER, 248 San Gregorio St, Indang, 4122 Cavite |
| [Pickleville Bacolod](https://picklevillebcd.playserve.app) | B3 L23 Purok Sawmill Rd, Bacolod, Negros Occidental | 10.7018337, 122.9710372 | 3 | PickleVille BCD, B3 L23 Purok Sawmill Rd, Bacolod, 6100 Negros Occidental |
| [Spinners Pickle Yard](https://spinnerspickleyard.playserve.app) | Purok 15 NIA Road, Bagontaas, Valencia City, Bukidnon | 7.9355933, 125.0962855 | 3 | Spinners Pickle Yard, Purok 15 NIA Road, Bagontaas, Valencia City, 8709 Bukidnon |
| [The Court Davao](https://thecourtdavao.playserve.app) | 14 Libby Road, Puan, Davao City, Davao Del Sur | 7.0548173, 125.5091731 | 3 | TheCourt Pickleball Club, 14 Libby Road, Puan, Davao City, 8000 Davao del Sur, Philippinen |
| [The Court Party](https://thecourtparty.playserve.app) | North Poblacion, Mabinay, Negros Oriental | 9.756515799999999, 122.9209515 | 2 | The Court Party - Tournament-grade Pickleball Court Rentals, Mabinay, 6207 Negros Oriental, Philippines |
| [The White Grounds Pickleball](https://thewhitegrounds.playserve.app) | Llamas St, Chipeco Ave, Barangay 3, Calamba, Laguna | 14.2079296, 121.1597745 | 5 | The White Grounds Pickleball, Llamas St, Chipeco Ave, Barangay 3, Calamba, 4027 Laguna |
| [VANTA Pickleball Lounge • Camarin](https://vantapicklelounge.playserve.app) | Java Center, Lot 671-D-1 Camarin Rd., Caloocan City, Metro Manila | 14.7547876, 121.0400058 | 3 | VANTA • Pickleball Lounge, Java Center, Lot 671 D-1 Camarin Rd, Barangay 175, Caloocan, 1422 Metro Manila |
| [Zur Pickle Club](https://zurpickleball.playserve.app) | Purok mahayahay, Banale, Pagadian City, Zamboanga del sur | 7.8336694, 123.4168094 | 3 | RCM8+QXJ Zur Pickle Club, Pagadian City, Zamboanga del Sur |

## Field decisions

- Court counts use actual pickleball inventory. Ace's six total courts include two badminton courts, so four pickleball courts are recorded.
- Inside-Out Courtyard advertises six courts but presents four bookable courts; its count is null pending operator confirmation. Its own location says Cora's Manor and Garden Resort, matching the map property.
- Double T's map URL contains the old TAT label, but the actual marker resolves to Double T Sports Center and the same Balayag Manok address.
- Rates use visible individual court cards rather than potentially stale summary/schema ranges. The Court Davao summary says PHP350/hour while its individual court cards say PHP250–300/hour; the latter is retained with an explicit note.
- Hours and optional amenities are intentionally not inferred. Empty hours/amenities and false `paddleRental` represent no confirmed claim in this importer schema, not evidence of absence.
- Archived/missing records must not be removed when reimporting this bounded source sample (`archiveMissing: false`).

## Exclusions and remaining leads

- DMS Pickleball Court, FRNDS MAIN, FRNDS 2.0 and Pickle Pals have no published exact map marker in the inspected pages.
- Rallyard Sports Center's map points to Sagrex Panabo without sufficient identity confirmation.
- Pickleball Hub na Cabatangan describes courts adjacent to the food hub; its map identifies the food hub rather than the courts, so precise site confirmation remains pending.
- R4LLY PH and Pickle Triangle were not included because present booking availability could not be confirmed in this pass.
- [Khourt](https://www.khourt.com/) lists 74 booking profiles, but the inspected directions links are textual address search queries, not precise place pins. Some records are unofficial/demo-like. None were bulk promoted to verified.
- [Courtogo](https://www.courtogo.com/venues) was a discovery lead only. No records were copied into this dataset.
- Reclub venue profiles confirm additional Manila courts exist but mostly omit precise map locations; they remain research leads.

Validation: source/map evidence inspected; application validation deferred to pre-commit per repository instructions. No code, tests, imports or database writes performed by this research task.

## Supplemental Manila-area operator verification

Five additional distinct venues are in `manila-operators-2026-09-16.json` under the separate `venue-operator-sites` source. Official operator sites and operator-run Reclub profiles establish pickleball activity, with addresses cross-checked against actual named Google Maps place markers. No unconfirmed optional counts, rates or court environments are inferred.

| Venue | Primary source | Named marker coordinates | Notes |
| --- | --- | --- | --- |
| Astra Pickleball Center | https://reclub.co/clubs/@astrapickleballcenter | 14.5915043, 121.1150259 | Verified on 2026-09-16 against the venue operator website or its official Reclub club profile and a matching named Google Maps point-of-interest marker. Operator address and marker identity agree. Coordinates are extracted from the actual named marker, not the map viewport. Marker: Astra Pickleball Center, 9009 B Felix Ave, Sto. Domingo, Cainta, 1900 Rizal. Official club profile states eight courts and provides its own Google Maps link. |
| Goldentop Sports Center | https://reclub.co/clubs/@goldentop-sports-center | 14.590729, 121.00502 | Verified on 2026-09-16 against the venue operator website or its official Reclub club profile and a matching named Google Maps point-of-interest marker. Operator address and marker identity agree. Coordinates are extracted from the actual named marker, not the map viewport. Marker: Golden Top Sports Center, 2325 Beata, Pandacan, Manila, 1007 Metro Manila. Official club profile states four courts and limited parking. |
| The Pickle Spot Makati | https://reclub.co/clubs/@the-pickle-spot-makati | 14.5689148, 121.0121026 | Verified on 2026-09-16 against the venue operator website or its official Reclub club profile and a matching named Google Maps point-of-interest marker. Operator address and marker identity agree. Coordinates are extracted from the actual named marker, not the map viewport. Marker: The Pickle Spot Makati, 2492 Pasong Tirad, Makati City, 1204 Metro Manila. |
| TAGS Pickleball | https://www.tagspickleball.com/ | 14.7118288, 121.0210203 | Verified on 2026-09-16 against the venue operator website or its official Reclub club profile and a matching named Google Maps point-of-interest marker. Operator address and marker identity agree. Coordinates are extracted from the actual named marker, not the map viewport. Marker: Lot 8, TAGS Pickleball, Blk 3, California Village, Katipunan Ave, Novaliches, Quezon City, 1123 Metro Manila. Venue website links directly to https://reclub.co/clubs/@tags-pickleball, whose operator description confirms four indoor courts and the California Village address. |
| Seascape Picklebay | https://www.seascapevillage.com.ph/seascape-picklebay/ | 14.5511265, 120.9805458 | Verified on 2026-09-16 against the venue operator website or its official Reclub club profile and a matching named Google Maps point-of-interest marker. Operator address and marker identity agree. Coordinates are extracted from the actual named marker, not the map viewport. Marker: HX2J+F7J Pickle Bay Bayside Pickleball Court (Outdoor), Seascape Village, Pasay City, Metro Manila. Owner describes outdoor play on the lawn and indoor play on the third floor. The marker identifies its outdoor Pickle Bay court inside Seascape Village; one venue entry covers both surfaces. Total count and mixed environment are left unspecified. |
