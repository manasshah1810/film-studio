# hormozi-kinetic failures

What goes wrong in this style, what it looks like, and the fix. Read before animating.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Centred fade-in title | A calm poster, no hook | Left aligned, word-by-word `pop` spring, first word on frame 4 or earlier |
| 2 | Highlight on every word | Colour everywhere, no emphasis | One active block at a time; `highlight` only on power words |
| 3 | Block without knockout | Light text on a light block, unreadable | Active word text is `bg` on `primary` or `highlight` |
| 4 | Line reflow when a block appears | The text jumps sideways | Keep the padding on every word, only the background changes |
| 5 | Caption in the bottom 20% | Hidden under the platform caption bar | Box ends at y 78 or less, x 83 or less |
| 6 | Punch-in pushes text out of the safe zone | Edge letters clipped by the frame | Punch is 4% at most; boxes start at x 8, y 10 |
| 7 | Pull-back zoom on the text | Words start outside the frame | Pull-back goes on the background layer only |
| 8 | Lowercase or mixed case | Reads as a normal subtitle | `case: upper` from the pairing; never override it |
| 9 | Stick figure or one-circle head | Looks like a placeholder | Layered Narrator bust: shaded head, hair, glasses, torso, shadow |
| 10 | Bust never moves | A still image in the corner | Brows and arm react on each power word, blink every 2.5 to 4.5 s, sway |
| 11 | Mouth is one shape | Lips do not match the voice | 5 visemes from the spoken word |
| 12 | Same palette role for text and block | Invisible active word | Block colour differs from the text colour; run `check-design.js` |
| 13 | Five or more lines at 150 px | Headline runs into the bust | At most 5 lines, 12 characters a line, or drop the size one step |
| 14 | Caption frozen for 3 seconds | Nothing moves, viewers leave | Breathing scale 1.00 to 1.02, drifting background, next word within 45 frames |
| 15 | Glow, gradient or soft shadow on captions | Looks like a template | Flat fills and hard offset shadows only |
| 16 | Two impact frames | The payoff loses weight | One impact frame, on the payoff word |
| 17 | Invented numbers in a widget | A fake "4.2K" with no source | Counts shown in a widget come from the script or are marked `[VERIFY]` |
| 18 | Random jitter with `Math.random()` | Every render differs | `random(seed)` from Remotion |
| 19 | Two typefaces too alike | Display and accent blur together | One pairing; accent only for labels |
| 20 | Palette hex typed into a component | `check-design.js` palette lock fails | Use the role name from `design-system.json` |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems hormozi-kinetic` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Look at three stills at phone size: the first power word, the impact frame, the last frame.
4. Can you read every word in 1 second? If not, cut words or raise contrast.
