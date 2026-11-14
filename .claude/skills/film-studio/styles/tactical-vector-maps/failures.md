# tactical-vector-maps failures

What goes wrong in this style, what it looks like, and the fix. Read before animating.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Text on land | Letters sink into the terrain | Every label sits on an opaque `surface` plate, tag or ruler strip |
| 2 | Land and sea look the same | A flat dark blue frame | Use the bands, the shadow and a coast line; land is only about 1.2:1 against the sea |
| 3 | Zig-zag coast | A wavy ribbon, not a continent | Vary the coast points by 10 to 40 units, never in a regular pattern |
| 4 | Group scale instead of projection | Fat strokes and stretched dashes at high zoom | Project each point with `proj`, keep stroke widths in pixels |
| 5 | Map edge visible after a zoom out | A seam or empty sea at the corner | Bleed every landmass to x -400 to 1400 and y -400 to 1200 |
| 6 | Route crosses land | A supply line over a coast | Check 40 px of clearance from every coast, in authoring units |
| 7 | Route draws with no real length | The reveal stops before the end | Use the projected length this frame for the mask dash |
| 8 | Head dot at 0 or 1 | A stray dot at the start or after the arrival | Draw the head only while `p` is between 0.002 and 0.999 |
| 9 | Camera cuts | The map jumps to the next place | Pan with a bezier; follow the head, then dwell, then pull back |
| 10 | Camera leaves the head behind | The route draws off screen | Move the centre with the same easing as the trace |
| 11 | Zoom with default ease | A dull, mechanical pull | Name a bezier or a spring; the pull-back uses the elastic spring |
| 12 | Elastic spring shows a seam | The overshoot reveals the edge | Overshoot to 0.75 only if the land bleeds to the limits in failure 5 |
| 13 | Stamp covers the route | The cut route is hidden | Place the stamp above the strait, 150 px right and 190 px up, on a leader |
| 14 | Stamp floats alone | A word with no place | A 4 px leader runs from the stamp base to the pin badge |
| 15 | X hidden under a beacon dot | A star shape, not a cut | A cut beacon has no dot; the X is the marker |
| 16 | Pins stack or overlap | Badges hide each other | Keep 120 px between pins at the end zoom; pull back to 0.85, not 0.5 |
| 17 | Pin tip off the beacon | The pin points beside the place | The stem tip is the beacon point; the badge is 72 px above it |
| 18 | Numbers on plates do not match pins | The viewer cannot tell which is which | Number every pin and every plate with the same digit |
| 19 | Radar rings over a plate | Rings cross text | Draw rings in the map layer, under all HTML |
| 20 | Ruler label crosses the corner | A label sticks out of the card | Show labels only 60 px inside the view |
| 21 | Day counter caught mid roll | Two half digits in a still | Roll in the last 40 percent of a day; stop the counter before the last still |
| 22 | Odometer digits bleed | A bar above or below a digit | Fixed 0.62 em columns, a cell as tall as the font size, `lineHeight: 1` |
| 23 | A person or a flag | A soldier, a flag bearer, a hand | Zero people and zero flags; use a beacon or a number |
| 24 | Real borders from memory | A confident but wrong map | Fictional geography, labelled "FICTIONAL MAP", or a cited source |
| 25 | More than 2 accent colours | A rainbow of routes | `primary` for what moves, `alert` for what breaks |
| 26 | Faction colour as text | Low contrast labels | Faction colours tint land only; text is `ink` or `muted` |
| 27 | Palette hex typed into a component | `check-design.js` palette lock fails | Use the role name from `design-system.json` |
| 28 | Font weight the family does not have | The render stops: "does not have a weight" | League Gothic and Share Tech Mono only have 400; Space Mono has 400 and 700 |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems tactical-vector-maps` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Look at three stills at phone size: the trace, the cut with its stamp, the settled pull-back.
4. Is every label on a plate or a strip? Does every pin match a plate? Is there a person or a flag anywhere?
