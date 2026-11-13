# Risograph: failure modes

Check these before sending stills to review. Each was seen in a proof render or follows directly from the kit.

1. **Ghost offset makes small text fuzzy.** Misregistration is applied to display sizes only. Do not use h1 styling for long lines; keep headlines to 5 words.
2. **Text unreadable on a plate.** All shipped palettes hold ink at 4.5:1 on highlight and shadow. A custom palette must pass the same pairs.
3. **Looks like flat corporate vector.** Grain or plates missing because of a tight crop. Keep `scale` at mid or wide on title panels.
4. **Too many colours.** Cast uses both accents and the plates add two more. Stay within paper plus four inks per frame.
5. **Ink outlines appear.** A stroke was added by an effect. Use only effects marked for outline-free styles.
6. **Chart lines too thin.** Use bar charts; the kit draws lines at 1 u which is light for this look.

## Quick self-check on a still
- None of: ink outlines around filled shapes
- None of: more than four ink colours on paper in one frame
- None of: smooth gradients, blurs, glows and soft shadows
- None of: dark backgrounds: multiply needs light stock
- All five signature moves from `style.md` appear somewhere in the film.
