# Pixel: failure modes

Check these before sending stills to review. Each was seen in a proof render or follows directly from the kit.

1. **Headline renders in a serif fallback.** The font module registers a different CSS family name. Fixed by the alias map in the engine; if it returns, run `gen-fonts.js` and re-render.
2. **Text overflows or is tiny.** More than 16 characters per line in a bitmap face. Shorten the headline; do not reduce size.
3. **Sprites look blurry.** Still rendered at a scale that is not a pixel multiple. Proof at scale 0.5 or 1.
4. **Smooth motion sneaks in.** A VFX effect with easing was merged. Use only stepped effects (see `fits_styles` in the effect JSON).
5. **Chart is unreadable.** Line charts alias at pixel size. Prefer bar charts with 5 bars or fewer.
6. **Looks like a specific game.** Never copy a real sprite, UI or palette layout from an existing game.

## Quick self-check on a still
- None of: anti-aliasing, blur, glow, gradients, opacity fades on sprites
- None of: rotation or non-integer scaling of anything
- None of: smooth easing: motion is stepped on fours
- None of: more than four colours in one sprite
- All five signature moves from `style.md` appear somewhere in the film.
