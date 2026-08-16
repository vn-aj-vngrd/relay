# Profile onboarding

## Intent

Adds a short, optional account setup and product tour for people creating new Relay profiles. The flow collects only information that improves recreational play and friend recognition: display name, username, city, playing experience, dominant hand, and an optional discovery source.

## Data changes

- `profiles.discovery_source`: optional product-discovery answer.
- `profiles.onboarding_completed_at`: marks setup as completed or skipped.
- `profiles.product_tour_completed_at`: prevents the introductory tour from repeating.

The migration marks existing profiles complete for both steps. Profiles created afterward retain `NULL` timestamps and enter onboarding after authentication. This avoids interrupting existing users.

## Flow

```text
new account → profile setup → three-step product tour → create first game or open Home
```

Both setup and tour provide a clear skip action. The tour can be replayed from Help Center without resetting completion state.

## Apply

```bash
corepack pnpm db:migrate
```

## Verify

1. Confirm an existing profile opens Home without onboarding.
2. Create a new account and confirm setup opens before the app shell.
3. Complete or skip setup and confirm the tour appears once.
4. Complete or skip the tour and confirm future sign-ins open Home.
5. Replay the tour from Help Center and confirm completion remains recorded.
