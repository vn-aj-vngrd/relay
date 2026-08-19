# Cebu court directory expansion — August 2026

## Outcome

Relay expanded the public Cebu directory from 34 to 51 sourced, unverified listings. Every added listing has a source URL and coordinates. No inferred municipality-center pins, copied directory records, or search-result-only venues were published.

## Imported sources

### Cebu Pickleball Courts

The public WordPress API grew from the previously imported set to 51 posts. Its `robots.txt` permits public content outside `/wp-admin/`. One duplicate Paddle Alley record reduces the source to 50 unique venue-and-address pairs.

Sixteen newer posts use the WordPress post title instead of a `Court Name` field. The importer now falls back to the decoded post title while still requiring a source address and embedded coordinates. This added:

- CEH-ABC Gym
- CitiLoft Pickleball – Cebu
- DH Sports Hub
- Fervent Academy
- Game Changer Mandaue
- HillHouse Liloan
- Hoops and Racket
- HQ Pickleball Cebu
- Kitchenline Pickleball
- Magnum Sports Complex
- Match Point Consolacion
- Net and Paddle
- Pino Pickleball Court
- Qusina PIQLE QLUB Pickleball Court
- SweetSpot Pickleball
- The Smash Yard

Sources: [Cebu Pickleball Courts API](https://cebupickleballcourts.com/wp-json/wp/v2/posts?per_page=100) · [robots.txt](https://cebupickleballcourts.com/robots.txt)

### SM Seaside City Cebu

SM Supermalls' first-party announcement identifies one outdoor free-play court at the Upper Ground Level, Tower Garden, Cube Wing of SM Seaside City Cebu. Relay stores the official article as provenance and uses the Geoapify result for the mall coordinate. The listing remains unverified because the announcement dates to June 5, 2024 and current availability still needs confirmation.

Source: [SM Supermalls announcement](https://www.smsupermalls.com/whats-new/lifestyle/sm-seaside-city-opens-cebus-first-outdoor-free-play-pickle-ball-court-in-cebu-city)

## Province-wide crawl

A province-wide search found credible evidence that pickleball is played beyond Metro Cebu. SunStar quotes the Cebu Professional Pickleball Association president naming activity or venues in Moalboal, Santander, Toledo City, Asturias, Tuburan, Bogo, Barili, and the City of Naga. It also identifies Beyond Isle, Cabana Shore, Dalia's Dream Court, Tuburan Pickleball Club, Lima's Pickleball, and Barili Pickleball Club.

Source: [SunStar — Pickleball in Cebu](https://www.sunstar.com.ph/cebu/pages-pickleball-in-cebu)

These names were **not imported** because the crawl did not establish a sufficiently precise, independently traceable street address and coordinate for each venue. Geoapify searches often returned only municipality centers. Publishing those centers as court pins would be fabricated precision.

Searches also surfaced records from PickleMap, PlayPickle, PlayServe, Reclub, PickleBoard, and Google Maps-derived pages. Relay did not copy those catalogs because their licensing, freshness, and provenance are not established for ingestion. They remain discovery leads for direct venue verification or a future data partnership.

## Operational result

- 51 public `unverified` listings
- 1 archived duplicate
- 51 listings visible through anonymous RLS
- Imported listings continue to say that venue details must be confirmed
- Province-wide candidates without exact evidence remain out of the public map

## Next verification work

Prioritize direct confirmation in underserved areas: Moalboal, Toledo, Asturias, Tuburan, Bogo, Barili, Naga, Santander, Sogod, and Daanbantayan. A venue-owned page or direct submission should establish the exact pin, current access, court count, and contact method before publication.
