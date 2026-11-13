# Paper cutout: failure modes

Check these before sending stills to review. Each was seen in a proof render or follows directly from the kit.

1. **Figures render nearly black.** A lighting filter applied to fills. Removed from the kit; never add SVG lighting filters to this style, use grain only.
2. **Blob covers the kicker.** Fixed in the kit by sizing the blob to the numeral; if it recurs, shorten the label.
3. **Edges look vector-clean.** Shapes too small for the 1.4-unit wobble to show. Use `scale: mid` or `tight` on object panels.
4. **Jittery, nervous picture.** Boil faster than every 6 frames or pieces moving on ones. Keep hold 2, boil 6.
5. **Shadows disagree.** An effect added its own shadow. Do not stack shadow effects on this style.
6. **Too many paper colours.** Cast plus props plus set exceed five colours. Reuse cast colours for props.

## Quick self-check on a still
- None of: outlines or strokes round any shape
- None of: gradients, glows, gloss, 3d bevels
- None of: perfect circles and ruler-straight edges
- None of: hard shadows or shadows in different directions
- All five signature moves from `style.md` appear somewhere in the film.
