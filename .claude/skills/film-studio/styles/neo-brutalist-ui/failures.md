# neo-brutalist-ui failures

What goes wrong in this style, what it looks like, and the fix. Read before animating.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Soft blurred drop shadow | A generic card, not brutalist | `boxShadow` with blur 0 and an `ink` colour, offset 5 design px |
| 2 | Border thinner than 3 design px | Hairlines that vanish on a phone | 3 design px = 9 px on the 1080 frame, always `ink` |
| 3 | Card with a border but no shadow | Flat and unfinished | Every card, button and chip carries the offset shadow |
| 4 | Glass over a flat ground | A plain pale card, no frost | Put a dot grid, a `primary` band and a `highlight` disc under it |
| 5 | Glass text lighter than ink | Numbers wash out over the band | Text on glass is `ink`; fill alpha 0.74 or more; check 4.5:1 |
| 6 | Glass stacked on glass | Mud, the blur doubles | One glass layer per panel region; at most 3 per panel |
| 7 | Text on a coloured fill in the wrong role | Light text on a pale fill, or the reverse | `onFill`: `ink` or `bg`, whichever has the higher contrast |
| 8 | Wide accent face in a button | "GENERATE" spills out of the button | Button label in the body face, 44 px, or widen the button |
| 9 | Cursor tip on the label it points at | The click hides the word | Aim at an empty corner of the target; the tag sits below right |
| 10 | Cursor teleports | Looks like a cut, not a hand | Bezier path with an arc, `snap` easing, slow on the target |
| 11 | Cursor with no name tag | Reads as a stock arrow | A `highlight` pill with a first name, 34 px mono |
| 12 | Click with no reaction | The viewer does not see cause | Press and result start on the same frame |
| 13 | Flip shows a seam at 90 degrees | A thin line or a gap | Both faces are full cards, `backfaceVisibility: hidden`, back pre-rotated 180 |
| 14 | Flip with no perspective | The card squashes flat | `perspective: 1400` on the parent, `transformStyle: preserve-3d` on the child |
| 15 | Content crowds the bottom of a card | A row touches the border | Count the rows in px first; make the card taller, not the type smaller |
| 16 | Everything rotated | Chaos, the eye has no anchor | Rotate stickers only; cards at most 2 degrees; windows 0 |
| 17 | Rainbow of fills | No hierarchy | One `primary`, one `highlight`, the rest `surface` and `bg` |
| 18 | Gravity drop with no landing | A card slides in and stops dead | Gravity spring, a 70 px rebound, a 6 percent squash on contact |
| 19 | A number counts and the card reflows | The unit jumps sideways | Keep the unit in its own span; format with `toLocaleString` |
| 20 | Prompt typed in the body face | Looks like a caption, not a tool | Prompts, file names and labels use the mono face |
| 21 | Font weight the family does not have | The render stops: "does not have a weight 500" | Use a weight listed for that family (Space Mono ships 400 and 700 only) |
| 22 | Invented numbers on a metric card | A fake "128K" with no source | Metrics come from the script or are marked `[VERIFY]` |
| 23 | Palette hex typed into a component | `check-design.js` palette lock fails | Use the role name from `design-system.json` |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems neo-brutalist-ui` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Look at three stills at phone size: the click, the flip, the finished frame.
4. Does every card show a border and a hard shadow? Is every glass number readable in 1 second?
