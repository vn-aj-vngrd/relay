# Session accent

## Intent

Adds one restrained, host-selected color to a game. The accent scopes the game workspace and public invite without changing global Relay branding or semantic status colors.

## Data changes

- Adds required `sessions.accent_color` text with `violet` as the default for existing and newly created games.
- Application validation limits new values to Relay’s six accessible game colors.

## Rollout safety

The non-null default backfills existing sessions in the same statement, so public links and authenticated game pages can render immediately after migration. Unknown legacy values still fall back to violet in the presentation helper.

## Verify

1. Create a game with a non-default color and confirm it persists.
2. Change the color in Game settings and confirm the public link updates.
3. Open the invite in light and dark themes and verify text and controls remain readable.
4. Confirm existing sessions use violet without manual backfill.
