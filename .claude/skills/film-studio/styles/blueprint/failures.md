# Blueprint: failure modes

Check these before sending stills to review. Each was seen in a proof render or follows directly from the kit.

1. **Title block overlaps content.** Very tall content on 16:9. Shorten the sub or change anchor; the block is fixed bottom-right.
2. **Hatching turns to moire in small stills.** Hatch gap is 3.2 figure units. Proof at scale 0.4 or higher.
3. **Looks like a blue slide.** Text-only panels. Include object or figure panels so hatch and dimension lines appear.
4. **Two accent colours fight.** Primary on numerals and secondary on dimension lines is the limit. Do not also colour the cast.
5. **Counts up to a wrong-looking number.** Non-numeric `stat.value` (for example "1 in 3") cannot count. Use a numeric value or a title layout.
6. **Light-paper palettes look empty.** Grid at 12% is faint on vellum or graphite. That is intended; do not add fills to compensate.

## Quick self-check on a still
- None of: solid filled shapes: mass is hatched
- None of: perspective, 3d rotation or camera zoom
- None of: rounded corners, round line caps and soft shadows
- None of: bounces and overshoots: plotters do not bounce
- All five signature moves from `style.md` appear somewhere in the film.
