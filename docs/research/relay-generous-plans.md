# Generous game allowances and clear photo storage

Research date: 2026-09-14. The user subsequently approved implementation of the allowances with a 50-photo game cap. Local implementation status is recorded below; measurements and cost scenarios remain dated research. Suggested allowances below are hypotheses to evaluate, not proven conversion-optimal limits.

## What comparable products show

Heja includes scheduling, RSVPs, messaging and document sharing in its ad-supported Free plan. Team Pro adds attendance statistics, payment tracking, advanced RSVP controls, reminders and unlimited admins; Pro Max extends the ad-free experience to all team members. Its paid proposition emphasizes organizer convenience and control. This supports preserving a useful free game loop and selling organizational value, but does not prove any particular Relay limit will convert. [Heja pricing](https://app.heja.io/pricing), [Heja Free vs. Team Pro or Max](https://help.heja.io/en/articles/3727834-heja-free-vs-team-pro-or-max)

Spond describes its platform as free and earns revenue through payments processed by groups and clubs. Fees vary by currency; groups can absorb them or pass them to members. This is an alternative business model, not evidence that Relay can offer unlimited service without a separate revenue source. Do not adopt payment fees merely to imitate it. [Spond payment costs](https://help.spond.com/app/en/articles/118091-payments-costs-in-the-spond-app)

## What photo delivery actually costs

Supabase bills file storage by aggregate asset size over time. Pro includes 100 GB; excess storage is listed at $0.0213 per GB-month. Image transformations can add separate charges. These are infrastructure allowances for the application, not allowances automatically allocated to each Relay customer. [Supabase Storage pricing](https://supabase.com/docs/guides/storage/pricing)

Downloading and displaying stored photos also generates egress. Supabase lists separate cached and uncached allowances: 250 GB each on Pro, then $0.03/GB cached or $0.09/GB uncached. Egress resets each billing cycle, while retained files continue consuming storage. [Supabase egress documentation](https://supabase.com/docs/guides/platform/manage-your-usage/egress)

An illustrative 10 GB retained for a full month above the included storage allowance costs $0.213 in storage alone. Serving those bytes ten times is 100 GB of egress, potentially $3 cached or $9 uncached when above the corresponding allowance. These calculations exclude compute, database, transformations, payment processing, support and other costs; they are not a margin forecast. A photo count alone cannot bound delivery cost. Use optimized images, thumbnails and caching, and measure actual delivery per active host.

## Recommended starting policy

Historical baseline, before the approved v2 implementation: the local billing review found 5/12/30 game creations and 100 MiB/500 MiB/2 GiB storage for Free/Plus/Pro. Current standard offers are 12/40/100 and 250 MiB/2 GiB/10 GiB. Catalog overrides may differ. The existing upload allowance belongs to the game host account and covers chat attachments and memory photos. Group membership is not currently a separate storage subscription. Verify the active catalog before rollout.

Proposed starting allowances:

| Allowance | Free | Plus | Pro |
| --- | ---: | ---: | ---: |
| Game creations per existing allowance period | 12 | 40 | 100 |
| Retained shared photo/attachment storage | 250 MiB | 2 GiB | 10 GiB |
| Photos per game, across all contributors | 50 | 50 | 50 |

Use storage as the primary paid capacity boundary. The 50-photo game ceiling is a generous, visible gallery safeguard shared by all plans, not another upgrade tier. Do not add a per-player photo quota or a second account-wide photo-count quota. A player who took the group's photos should be able to contribute them without being penalized for taking most of the pictures. Preserve security and abuse controls internally, but distinguish them from plan entitlements.

The host's allowance should cover uploads to all games they own, including group games; a co-host or uploader should not silently become the billing owner. Explain this at upload time. Consider group-owned storage only with explicit club billing, payer responsibility and ownership-transfer behavior. Do not multiply an account allowance by the number of groups.

The proposed numbers intentionally offer room for repeated play. They remain assumptions pending utilization, cost and conversion data. Retain the current code-default Plus/Pro price points for a limited pilot, subject to the cost validation below; do not treat them as proven sustainable prices. Sell paid plans through existing or deliberately planned organizer value as well as larger allowances; do not imply unbuilt premium features already exist.

## Upload and upgrade experience

- Accept ordinary phone photos without asking users to manually resize them. A proposed 20 MB source limit with automatic resizing/re-encoding to at most 2 MiB needs implementation and server verification before advertising support. Account for the actual stored bytes, including retained derivatives.
- Keep device-only story photos separate: if no cloud upload is made, they do not consume hosted storage or the game gallery count.
- Show `18 / 50 game photos` near the gallery and `180 MiB / 250 MiB used · Host's storage` near uploading. Clarify that the shared storage also includes chat attachments. Use consistent units with the implementation.
- Storage is retained capacity, not a monthly upload credit; deleting hosted files releases capacity after successful deletion/accounting. Game allowances reset according to their documented period. Explain each independently.
- Warn before the limit, then offer storage management or upgrade when full. Keep existing memories viewable and downloadable; pause new uploads instead of removing old memories. Do not make joining a game or finishing an already-created game depend on spare photo storage.
- A larger plan is a natural next step for frequent hosts. Trigger relevant upgrade prompts when planning more games or approaching storage capacity, rather than interrupting every participant.

## Evaluate after rollout

Track completed games per active host, the proportion of genuine hosts reaching the game allowance, stored bytes and egress per active host, gallery sizes, upload failures, quota blocks, deletion behavior, and upgrades following meaningful limit encounters. Review whether Free supports sustained use and whether paid users gain enough additional value. Do not claim these limits improve conversion until observed data supports that conclusion.


## Consolidated recommendation after live Supabase review

Reviewed 2026-09-14. This section consolidates the proposal above. No subscriptions, spend caps, catalog values, credentials, or application enforcement were changed.

### Measured dashboard baseline

Read the authenticated Supabase organization Usage dashboard, then selected **relay-pickleball**. Billing period displayed: **30 Aug–30 Sep 2026**, still in progress. The organization is on **Free** and the all-project summary reports no quota exceeded. Values are rounded dashboard readings; reporting can lag by an hour (MAU longer).

| Metric | Relay project reading | Interpretation |
| --- | ---: | --- |
| Uncached egress | 0.570 GB | Period to date, all service traffic, not just photos |
| Cached egress | 0.008 GB | Period to date |
| Storage usage summary | 0.004 GB | Reported period-average storage, not an exact current inventory |
| Database size summary | 0.035 GB | Detailed current panel separately shows 33.33 MB; retain dashboard labels rather than equating the units |
| Monthly active users | 24 | Authentication activity, not active hosts or paying customers |
| Realtime messages | 5,094 | Period to date |
| Peak realtime connections | 10 | Observed period peak |
| Edge function invocations | 0 | Displayed usage |

The **organization-wide** totals differ: 0.572 GB uncached egress and 30 MAU. Another project is present. Supabase bills and pools applicable quotas across the organization; do not allocate its full included quota independently to every project. No raw files, user identities, payment details or credentials were extracted.

This is a small baseline. There is no measured photo-specific cache ratio, average stored photo size, cost per hosted game, paid conversion rate, or host-level delivery distribution. Do not extrapolate these 24 MAU into a mature photo-sharing workload.

### Supabase cost model

Official Pro pricing starts at **$25/month** with $10 compute credit sufficient for one Micro project, **100 GB file storage**, **250 GB uncached egress**, and **250 GB cached egress**. Overage rates: **$0.0213/GB-month storage**, **$0.09/GB uncached**, **$0.03/GB cached**. Included egress pools are separate; spare cached allowance does not cover uncached overage. Additional active projects, larger compute and other services add costs. [Supabase pricing](https://supabase.com/pricing), [Storage pricing](https://supabase.com/docs/guides/storage/pricing), [Egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress)

Model in USD, full-month average storage and monthly traffic:

```text
cost = 25
     + max(storage_GB - 100, 0) * 0.0213
     + max(cached_egress_GB - 250, 0) * 0.03
     + max(uncached_egress_GB - 250, 0) * 0.09
```

Assume one Micro project, no competing organization usage, an illustrative host mix of 80% Free / 15% Plus / 5% Pro, and the proposed 250 MiB / 2 GiB / 10 GiB storage allowances. Convert binary product allowances to decimal GB (1e9 bytes) for this planning model; invoice metering remains authoritative. Delivery multiple means bytes delivered during the month divided by average retained bytes, not a measured per-photo view count. Optimized variants and caching change it.

| Scenario | Hosts | Storage utilization | Delivery multiple/month | Cached share | Average storage | Modeled monthly cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Small pilot | 100 | 25% | 3× | 80% | 26.718 GB | $25.00 |
| Moderate scale | 1,000 | 25% | 3× | 80% | 267.177 GB | $40.30 |
| Heavy photo use | 1,000 | 100% | 10× | 80% | 1,068.709 GB | $464.49 |
| Heavy uncached stress | 1,000 | 100% | 10× | 0% | 1,068.709 GB | $984.97 |

These are calculations, not forecasts or measured bills. The 80% cache share is hypothetical, not derived from Relay's aggregate traffic. The zero-cache scenario is a stress case, not a maximum possible bill. Excludes other-service egress, extra compute/projects, database overages, authentication/realtime overages, image transformations, Vercel hosting/image delivery, email, taxes, payment fees and support. It is not a complete operating-cost or profit estimate. Existing Next/Image usage can shift some delivery costs to the hosting provider; do not count that as free delivery.

Reproducible intermediate values: [scenario CSV](./relay-supabase-cost-scenarios.csv). At the assumed mix, 1,000 hosts contain 150 Plus and 50 Pro accounts; at code-default prices that is PHP 37,300 gross/month before costs. Currency conversion and payment realization were not measured, so this does not establish margin. The plan mix itself is not validated.

### Final policy for the pilot

1. **Free 12 / Plus 40 / Pro 100 hosted game creations per existing monthly allowance period.** Joining, scoring and basic Story remain included. Failed creation does not count. Preserve and clearly disclose current reset dates; do not silently change paid terms.
2. **250 MiB / 2 GiB / 10 GiB retained storage**, owned by the host and shared by chat images and game photos across their games. No separate group or player storage quota. Use the current PHP 149 / PHP 299 price points as pilot assumptions, not a demonstrated profitable price.
3. **50 retained gallery photos per game**, shared by all contributors and identical across plans. No per-player/game cap and no account-wide photo-count cap. Removing a gallery photo frees its count slot after successful deletion. Storage remains the primary capacity boundary.
4. **Phone-friendly processing before expanding photo usage.** Accept a bounded source image (proposed 20 MB), safely decode/resize/re-encode, strip unnecessary metadata, store an optimized image with a 2 MiB ceiling and small gallery thumbnail. Target typical combined stored bytes substantially below the ceiling (for example 300–500 KiB), but measure image quality and actual size before advertising an approximate photo count. Account for all retained derivatives. Do not retain originals by default; communicate optimization.
5. **Replace the current 20-memory-uploads-per-uploader/day product restriction** with a generous, transparent abuse-control policy that allows an ordinary 50-photo album contribution. Keep authorization, byte reservations and concurrency-safe counting. Rate-limit failures should say when retry is possible; upgrading should not be offered as an abuse-limit bypass.
6. **Usage at the relevant action:** games used and reset date at creation; album count and host storage at upload. Optional early notice at 80%, clear management/upgrade options at full capacity. No quota nags during play. Existing photos remain viewable/downloadable on capacity exhaustion or downgrade; only new storage use is blocked until space or entitlement is available. Deletion must be available and release accounted space reliably.
7. **Supabase Free is suitable for today's small trial, not a durable budget for selling multi-GiB allowances.** Its organization has only 1 GB included file storage: four hosts each using 250 MiB already exceed that under decimal-GB accounting, before other buckets. Budget Pro before general paid photo-plan rollout. This recommendation does not authorize purchasing or changing the Supabase plan or spend cap.
8. **Prove economics before broad rollout:** measure stored bytes per host, actual photo delivery/cache behavior, other-service egress, thumbnails, upload success, genuine game-limit encounters and conversion over a full representative cycle. Check total Supabase and hosting costs together. If delivery dominates, optimize it before adding more visible quotas or increasing allowances. Keep Pro's 10 GiB as a monitored pilot entitlement, not unlimited delivery.

### Implementation sequence

- Establish telemetry and storage management/deletion; inventory current host usage and catalog overrides.
- Add bounded photo processing, thumbnail delivery and clear upload feedback.
- Add atomic 50-photo/game enforcement and revise the daily upload restriction together.
- Publish new immutable plan versions and update catalog, billing comparison, usage messages and affected tests. Apply upgrades to existing terms explicitly rather than overwriting historical commercial terms.
- Pilot the new allowances; review one full cycle of costs and host behavior before broad availability. Paid plans currently default to coming soon in code; verify actual purchase availability before displaying an actionable upgrade offer.

This is the final recommended policy, with rollout conditional on image delivery and economic validation. It is not a claim that the feature or pricing changes have been implemented.


## Approved implementation update

The user settled on 50 photos per game alongside the shared storage allowance, whichever fills first. Local code now supplies v2 defaults of 12/40/100 games and 250 MiB/2 GiB/10 GiB; checks album reservations under the existing host lock; raises memory-upload daily protection to 100; and explains the limits in Story, pricing/help and account usage. Existing snapshots and custom catalog offers remain intact. Source images still must meet 2 MiB: compression/thumbnails are proposed follow-up work, not part of the limit implementation. Cost scenarios are unchanged because they model total retained bytes and delivery, not album count. No production/provider settings changed. Validation deferred to pre-commit.
