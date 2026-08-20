# Social story composer research — August 2026

## Product question

How should Relay turn a completed pickleball session into a social-ready story while keeping the experience useful on mobile, private by default, and grounded in real session data?

## Primary-source findings

- Instagram’s first-party help describes Stories as a full-screen vertical format; Relay should retain a 9:16 export and 1080 × 1920 output rather than offering arbitrary canvas sizes. [Instagram Help Center — Stories format](https://www.facebook.com/help/instagram/411192286082878/)
- The Web Share API can share image files, but support must be checked for the exact payload with `navigator.canShare({ files })`. Sharing requires HTTPS and a user gesture; cancellation is expected and should not be shown as an error. [MDN — `Navigator.canShare()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare) and [MDN — `Navigator.share()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- Strava’s first-party sharing flow sends activity details to installed social apps from mobile, while its current public support documentation limits which activity statistics are shared. Relay can differentiate by letting players choose among only stats supported by the session record, then customize presentation rather than inventing metrics. [Strava Support — Sharing Your Activities](https://support.strava.com/en-us/articles/15401840-sharing-your-strava-activities)
- Strava lets people add media after an activity and select a highlight image. This supports keeping factual **Recap** as the completed state of Play while giving the more expressive **Story** destination and making photos first-class story backgrounds. [Strava Support — Adding Videos and Photos](https://support.strava.com/en-us/articles/15401859-adding-videos-and-photos-to-your-activity)
- Drawing a cross-origin image without CORS permission taints a canvas and blocks `toBlob()`. Relay should fetch approved Supabase media or use a local object URL, keep an export fallback when a signed image expires, and never accept arbitrary remote image URLs in the composer. [MDN — Use cross-origin images in a canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)

## Product decisions

1. Keep **Play** as one lifecycle surface: before play, live courts, then factual **Recap** after completion. Redirect legacy Recap URLs to Play.
2. Add **Story** as the expressive authenticated and public destination for story creation, photos, reactions, and notes.
3. Export 1080 × 1920 PNG stories.
4. Offer many combinations through two independent choices:
   - a truthful story focus derived from persisted match data;
   - a visual layout, palette/photo background, crop position, overlay strength, and optional personal line.
5. Allow a local background photo without uploading it. Persisted session photos remain available separately and may be selected as backgrounds.
6. Use native file sharing only when the exact PNG payload is supported; always retain explicit download.
7. Keep customization bounded. Relay does not need a freeform drag-and-drop editor that can obscure controls, break export parity, or imply unsupported results.

## Landing sample-photo credits

The Story customization preview uses two Unsplash samples solely to demonstrate user-selected backgrounds:

- “Pickleball paddle and ball rest on the court” by eedgar ivann: https://unsplash.com/photos/zpy9Lh5aRgg
- “Two pickleball paddles leaning against a fence” by Jon Matthews: https://unsplash.com/photos/fh6MoHaX8e0
