# Story color and branding decisions

September 14, 2026. Implemented in the working tree; formatting, strict types, the full unit suite (2,197 tests) and production build passed at pre-commit. Browser and real-device checks remain unrun.

Use nine options: the six existing game colors, then Baby Pink, Cream and Ink. Nine is a product choice for a compact curated selection, not a research-established optimum. The game hue is first and selected initially. Show the selected name and a Game color annotation when applicable. Changing a story palette does not change the game or application controls.

Minimal uses solid colors; the four paper themes use their corresponding lighter shade. Light neutrals use dark text. Share the palette resolver between swatches, theme thumbnails, full preview and export. Avoid freeform color input until arbitrary combinations have dependable contrast handling.

The approach follows role-based foreground/background color pairing described in [Android's Material color guidance](https://developer.android.com/design/ui/wear/guides/styles/color/roles-tokens). [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) specifies 4.5:1 for normal text, including images of text. These references support paired colors and contrast checks; they do not prescribe Relay's palette count or aesthetic.

Computed using WCAG sRGB relative luminance: lowest solid primary-text pairing is Orange/white at 4.65:1; paper secondary text #5b5963 has a minimum 5.60:1; existing handwriting colors on the paper choices have a minimum 5.55:1. These are color calculations, not browser verification or proof of every possible photograph's readability. Photo backgrounds retain contrast controls and still need visual checking with the actual image.

The story header uses the Relay mark and RELAY only. Game facts remain in the composition, separate from branding.

Regression coverage: story-color.test.ts, story-theme.test.ts, story-theme-picker.test.tsx and story-collage-editor.test.tsx. Authored but not executed in this pass.
