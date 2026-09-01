# Search discovery and SEO audit — September 2026

## Goal and constraint

Relay should be technically easy to crawl, useful for Philippine pickleball searches, and competitive for product searches such as a free pickleball scorekeeper. No implementation can guarantee a number-one ranking: Google states that following its guidance does not automatically rank a site first. The practical goal is durable discovery built on useful pages, accurate court data, and measurable search performance—not keyword stuffing or search-first generated content.

## Search intents to serve

1. **Court discovery:** “pickleball courts Philippines,” then court-, city-, and province-specific searches.
2. **Game utility:** “free pickleball scorekeeper,” “pickleball rotation manager,” and related play-format searches.
3. **Branded navigation:** Relay and individual verified court names.

City and province landing pages should wait until location fields are normalized. Parsing free-form addresses into thin location pages would create unreliable taxonomy and low-value pages.

## Implemented foundation

- Added descriptive, canonical metadata for the home, court directory, court detail, and Quick Play routes.
- Added site-wide Organization and WebSite structured data.
- Added factual `SportsActivityLocation` structured data to verified court pages.
- Added generated site and court-specific Open Graph images.
- Added every verified court detail URL to the XML sitemap.
- Excluded authenticated, administrative, and user-session surfaces from indexing.
- Made court result rows real links so crawlers and modified-click users can reach detail pages while preserving the map interaction.
- Added tests for sitemap coverage, robots policy, and crawlable court links.

## Content and trust principles

- Keep court details factual, source-backed, and updated. “Verified” must mean Relay has checked a legitimate source, not that an entry was generated or inferred.
- Write for players completing a task. Avoid repetitive city templates, hidden text, keyword lists, doorway pages, and mass-produced AI copy.
- Use structured data only when the same facts are visible on the page.
- Keep canonical URLs self-referential on public pages and avoid publishing duplicate route variants.
- Treat Core Web Vitals, mobile usability, and accessibility as product quality signals, not shortcuts to ranking.

## Operational checklist

- [ ] Add `vanajvanguardia.tech` as a **Domain property** in Google Search Console using DNS verification.
- [ ] Submit `https://relay.vanajvanguardia.tech/sitemap.xml` after the custom-domain deployment.
- [ ] Inspect `/`, `/courts`, `/play`, and representative court URLs in Search Console.
- [ ] Configure Bing Webmaster Tools and submit the same sitemap.
- [ ] Monitor indexed-page counts, crawl errors, queries, click-through rate, and Core Web Vitals monthly.
- [ ] Ask legitimate courts, clubs, tournaments, and Philippine pickleball organizations to link to their accurate Relay listing where useful.
- [ ] Establish an owner and cadence for court-data re-verification.
- [ ] Add normalized city/province fields before creating regional discovery pages.
- [ ] Expand visible, genuinely useful Quick Play documentation based on actual player questions and search-query evidence.

## Primary references

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google guidance for helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google structured data introduction: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google canonicalization guidance: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Core Web Vitals guidance: https://developers.google.com/search/docs/appearance/core-web-vitals
- Next.js metadata and Open Graph images: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Next.js JSON-LD guide: https://nextjs.org/docs/app/guides/json-ld
