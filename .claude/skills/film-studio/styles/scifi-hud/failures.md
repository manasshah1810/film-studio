# scifi-hud failures

What goes wrong in this style, what it looks like, and the fix. Read before animating.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Text on a ring or grid | A readout that fights the lines | Every label sits on an opaque `surface` plate |
| 2 | Scanlines over text | Text looks dirty and shimmers | Draw scanlines after the reticle and before the plates |
| 3 | Proportional font for a number | A value that jitters as it ticks | Mono plus `font-variant-numeric: tabular-nums` |
| 4 | Value length changes | The plate reflows mid decode | Fixed length strings; `ALT` ticks 12,000 to 13,152, never 999 to 1,000 |
| 5 | Scramble that never resolves | Noise at the end of the film | Lock from the left, 18 frames, then show the live value |
| 6 | Scramble from the right | Digits snap in a strange order | Characters lock left to right |
| 7 | Scramble in a proportional font | The text breathes in width | Scramble only in the mono |
| 8 | Dashes that do not fit the ring | A short stub where the dashes meet | `seg = 2 * PI * r / N`, `dash = seg * (1 - gap)` |
| 9 | Ring moved instead of rotated | The ring drifts off centre | `rotate(deg cx cy)` on the circle |
| 10 | All rings spin one way | A flat wheel | Neighbours oppose: +0.5, -0.9, +1.6 deg per frame |
| 11 | All rings spin at one speed | A rigid clock face | Three different speeds |
| 12 | Rings pop in at full size | A cheap reveal | Fade and scale 1.1 to 1 over 14 frames, 6 frames apart |
| 13 | Brackets drawn as four rectangles | Fat boxes in the corners | An L path with `strokeDasharray` and `strokeDashoffset` |
| 14 | Brackets inside the safe margin | Corners cut by the app UI | Inset 36 px, arms 110 px |
| 15 | Glow on text | A smudged label | One soft disc behind the reticle only |
| 16 | Several glows | Muddy light | One glow, role `glow` |
| 17 | Glitch repeats | A broken video, not a lock | Once, 8 frames, on the lock |
| 18 | Glitch moves plates | Unreadable readouts mid film | Glitch the reticle only; plates stay |
| 19 | Glitch ghosts in one colour | A grey blur | Two roles: `alert` left, `primary` right, blend `screen` |
| 20 | Lock with a linear ease | A mechanical shrink | Spring 13/150/1 |
| 21 | Lock box that does not follow | A box pinned to a moving target | Follow the target with a 5 frame lag |
| 22 | Two signal colours | A rainbow HUD | `primary` for rings, `highlight` for lock, peak and orbit only |
| 23 | Palette hex in a component | `check-design.js` palette lock fails | Use the role name from `design-system.json` |
| 24 | Label under 34 px | Unreadable on a phone | 34 px is the floor, 44 px for values |
| 25 | `dim` under 4.5:1 | A faded label | Palettes ship `dim` at 6.9:1 or better; derive it by blending ink 66 percent into bg |
| 26 | Plate text beyond 85 percent or 80 percent | `check-safezones.js` fails | Keep text in x 8 to 85, y 8 to 80 |
| 27 | Weight the family does not have | The render stops: "does not have a weight" | Share Tech Mono has 400 only; check the weights of the family |
| 28 | A person, photo or video | The HUD look breaks | Draw the subject as a wire shape in SVG |
| 29 | Waveform from `Math.random()` | A flicker that changes per render | Two summed sines of the frame number |
| 30 | HUD that never rests | Constant motion tires the eye | Hold the locked frame at least 30 frames |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems scifi-hud` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Render frames at the rings drawing, the tracking beat, the glitch and the locked hold. Read every plate.
4. Do neighbouring rings turn opposite ways? Is any text off a plate? Is the glitch used once?
