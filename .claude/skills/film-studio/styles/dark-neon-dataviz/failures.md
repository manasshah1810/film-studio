# dark-neon-dataviz failures

What goes wrong in this style, what it looks like, and the fix. Read before animating.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Dark red label on a dark ground | The label cannot be read on a phone | Labels are `ink` on an opaque `surface` plate; red is only a border and a numeral at 5.5:1 or better |
| 2 | Muted purple caption | A grey-violet smudge | Captions use `muted`, which is 4.5:1 or better on `surface`; purple is never a text colour |
| 3 | Text on the ground stripes | Stripes cut through letters | Stripes are tier 2 at 4 percent, and every label sits on a plate or a card |
| 4 | Pure black ground | Glow looks flat and the frame looks cheap | Use `bg` #070B14 and `surface` #0F172A |
| 5 | Glow on text | Fuzzy, hard to read numbers | Glow only on the line, the head dot and the nodes |
| 6 | Glow bleeds off the card | A halo over the title or a plate | Filter region is the card, `userSpaceOnUse`; plates are drawn above the svg |
| 7 | Glow too wide | A smear over the grid | Inner 5, outer 14 at 0.7 alpha; never past 28 px |
| 8 | Proportional digits in a counter | The number wobbles sideways | `tabular-nums` and fixed 0.62 em digit columns |
| 9 | Counter and line disagree | The number says 20 while the line is at 30 | Drive the odometer from `valueAtX(head.x)`, not a separate timer |
| 10 | Leading zero shifts the layout | The unit jumps when 10 becomes 9 | Keep the column, fade it out |
| 11 | Stray dot before a leader draws | A pixel on the chart at the start | Render the leader only when its progress is above 0; same for the line at `p` 0 |
| 12 | Line head and area fill out of step | The fill runs ahead of the line | Clip the area at the line head x; build the line from the same function |
| 13 | Line cap shows at frame 0 | A dot at the chart origin | Hide the path while `p` is 0 |
| 14 | Plate sits on the curve | The line runs through a label | Plan plates in px first; keep 25 px between a plate and the curve |
| 15 | Plate over another plate | Two labels overlap | Stack plates 20 px apart on the empty side of the curve |
| 16 | Rack focus fades label text | Dimmed callouts become grey-red mush | Dim lines, nodes and borders only; text stays at full opacity |
| 17 | Duplicate svg ids on a sheet | Wrong clip or gradient in the second copy | Prefix every id with `React.useId()` |
| 18 | Camera drift stops | The frame goes dead on the final beat | Drift runs from frame 0 to the last frame |
| 19 | Drift too strong | Edges crop, text leaves the safe zone | Scale up to 1.03, pan up to 14 px; keep boxes 1.5 percent inside the limits |
| 20 | A person in the frame | A stick figure or avatar next to a number | Zero people. Use a banknote, a coin stack, a ring or a number |
| 21 | Neon rainbow | Four colours fight for the eye | One `primary` line, one `alert` callout colour |
| 22 | Invented numbers shown as real | A convincing chart of made up data | Source from the script, or mark `[VERIFY]` or print "illustrative data" |
| 23 | Palette hex typed into a component | `check-design.js` palette lock fails | Use the role name from `design-system.json` |
| 24 | Font weight the family does not have | The render stops: "does not have a weight" | Use a weight listed for that family (DM Mono has 300, 400, 500) |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems dark-neon-dataviz` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Look at three stills at phone size: the draw, the mid collapse, the finished chart.
4. Is every label on a plate or a card? Does any glow touch text? Is there a person anywhere?
