# archival-grunge failures

What goes wrong in this style, what it looks like, and the fix. Read before animating.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | feTurbulence colours drift | A purple and green rainbow on the paper | `colorInterpolationFilters="sRGB"` on every filter |
| 2 | feColorMatrix row with three numbers | The same rainbow, from a typo | One number per row: `0 0 0 0 r`, then `0 0 0 0 g`, then `0 0 0 0 b` |
| 3 | Grain too strong | Body text dissolves into speckle | Grain opacity 0.26 or less; ink on paper stays at 11:1 |
| 4 | Flat colour for the paper | It looks like a slide | Add the grain, the stains, the burnt edge and the fold |
| 5 | A straight torn edge | A cut, not a tear | A point every 18 px, moved up to 14 px, plus a lighter fibre layer |
| 6 | Paper pokes out of its fibre edge | A dark speck on the rim | Paper polygon sits 8 px inside, fibre amp stays 10 or less |
| 7 | `Math.random()` in a polygon | A still changes on each render | `Math.sin` noise from a seed |
| 8 | Shadow on each child | Many small shadows | One drop shadow on the parent, under the reveal |
| 9 | Tear that is a plain wipe | A cheap reveal | A ragged line, ease in out, tape slaps on after |
| 10 | Marker without multiply | The type is hidden under yellow | `mix-blend-mode: multiply` |
| 11 | Marker drawn before the type | A bar with no words | Type the line, then sweep it |
| 12 | Marker sized in px | Misses the words in another font | Wrap the words in a span and size the marker to it |
| 13 | Marker edge a straight line | A UI progress bar | A ragged polygon end, 7 px, with a 4 degree skew |
| 14 | Pen drawn with `non-scaling-stroke` | The circle is already there at frame 0 | Drop it; use `pathLength={1}` and a viewBox near the real size |
| 15 | A perfect circle | A vector shape, not a hand | Spiral out 12 percent, overshoot the start, wobble 3 percent |
| 16 | Arrow through a line of text | The pen crosses the body | Route it round the right edge of the longest line |
| 17 | Pen note in a pale red | Cannot be read on the grain | Pen is 4.5:1 or better on `surface`; no thin face under 48 px |
| 18 | Thin hand at a wide face size | Notes run past the column | Set the size per face: Reenie 68, Caveat 54, Permanent Marker 52 |
| 19 | Note clip cuts the last letters | "SAME WEE" | Let the right clip go to -30 percent at the end |
| 20 | Jitter on body text | Tiring, unreadable | Jitter the headline, the notes and the stamp only |
| 21 | Jitter at 30 fps | A shake, not stop motion | New pose at 12 fps: `floor(f * 12 / 30)` |
| 22 | Flicker above 8 percent | A strobe | Black overlay up to 7 percent |
| 23 | Film layer under the stamp | The stamp looks pasted on | The film gate is the last layer |
| 24 | A scratch on every pose | A dirty window | A scratch in 35 percent of poses |
| 25 | A photograph of the subject | The look breaks | Halftone dots with one spot of red |
| 26 | Text on the dark desk | Contrast fails | All text sits on `surface` |
| 27 | Text under the tape or the stamp | Words hidden | Tape on the corners only; stamp below the caption |
| 28 | A real masthead or a real quote | A false document | Make up the paper; mark facts `[CHECK]` |
| 29 | Palette hex in a component | `check-design.js` palette lock fails | Use the role name from `design-system.json` |
| 30 | Plate text beyond 85 percent or 80 percent | `check-safezones.js` fails | Keep text in x 9 to 85, y 7 to 80 |
| 31 | Weight the family does not have | The render stops: "does not have a weight" | Check the weights: Special Elite, Reenie Beanie and Abril Fatface have 400 only |
| 32 | Stamp more than once in 10 s | A rubber-stamp machine | One stamp, on the verdict |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems archival-grunge` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Render frames at the tear, the marker, the notes and the stamp. Read every word on the grain.
4. Is there any rainbow in the paper? Does the pen cross any text? Is the body still?
