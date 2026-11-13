# Noir: failure modes

Check these before sending stills to review. Each was seen in a proof render or follows directly from the kit.

1. **Blind stripes cover the whole frame.** Shaft too wide on portrait. The kit sizes it to 48% of the short side; do not raise `shaft_opacity` above 0.2.
2. **Figures vanish into the background.** Palette shadow too close to bg. All shipped palettes hold 2:1; a custom palette must too.
3. **Two accents on screen.** Emphasis word plus accent accessory plus accent bar. Remove `emphasis` on panels with an accented figure.
4. **Symbol on a highlight prop disappears.** Light ink on a highlight fill. Prefer the clock, bulb or box props; avoid the coin on noir.
5. **Reads as generic dark mode.** Only text panels. Use silhouettes and the light pool at least every third panel.
6. **Typewriter face too light at small sizes.** Body in Courier-style faces thins out under 4 u. Keep labels to one line of 5 words.

## Quick self-check on a still
- None of: light or mid-tone backgrounds
- None of: more than one accent-coloured element per scene
- None of: faces, outlines or interior detail on figures
- None of: bounces, pops, overshoots, shakes and whip pans
- All five signature moves from `style.md` appear somewhere in the film.
