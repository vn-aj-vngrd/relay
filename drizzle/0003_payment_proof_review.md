# Payment proof review

## Intent

Adds one private image proof to each player payment and an optional host review note. Relay continues to coordinate external payments only; confirmation records the host’s review and never moves money.

## Data changes

- `player_payments.proof_storage_path`: private Supabase Storage object path for the player’s current proof.
- `player_payments.review_note`: latest host explanation when requesting replacement proof.
- `payment-proofs`: private 5 MB bucket accepting JPG, PNG, and WebP.

Proof objects use `<session-id>/<payment-id>`. Uploads use `upsert`, so each payment has at most one current proof object. Server Actions validate ownership before upload; host review mutations validate session ownership. Signed URLs expire after one hour.

## State flow

```text
unpaid → proof uploaded → sent → host confirms → confirmed
                         ↘ host requests new proof → unpaid
```

A request retains the existing image for context until the player replaces it. Uploading replacement proof clears the review note.

## Apply

```bash
corepack pnpm db:migrate
```

## Verify

1. Submit a supported image under 5 MB as the payment owner.
2. Confirm a second upload replaces the first object rather than adding another.
3. Confirm non-owners cannot mutate the payment.
4. Confirm the host can approve or request replacement proof.
5. Confirm private proof URLs require a server-generated signed URL.
