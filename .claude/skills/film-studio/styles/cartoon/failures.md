# Cartoon: failure modes

Check these before sending stills to review. Each was seen in a proof render or follows directly from the kit.

1. **Characters float.** A layout override or tiny duration hid the ground band. Keep figure panels at 1.5 s or more and never set `scale: tight` on two-character panels.
2. **Sunburst fights the cast.** Palette `highlight` close to a cast colour. Choose a palette where the cast roles differ from highlight, or drop `energy: peak`.
3. **Outline looks thin on wide formats.** Outline is in figure units, so a small figure means a thin line. Use `figure` or `object` layouts rather than squeezing a character into `versus`.
4. **Every panel bounces and nothing lands.** All panels marked `peak`. One peak per scene; the rest `calm` or `build`.
5. **Three or more character colours.** Cast defs use primary, secondary and highlight. Limit a panel to two character colours.
6. **Wall of text beside a character.** Headline over 6 words in a figure panel. Move the sentence to the voiceover and keep 2-4 words on screen.

## Quick self-check on a still
- None of: gradients, glows, blurred or soft shadows
- None of: thin or coloured outlines; outline width changing inside a film
- None of: realistic proportions: heads are at least a third of body height
- None of: linear easing: every entrance overshoots
- All five signature moves from `style.md` appear somewhere in the film.
