# minimalist-doodle failures

What goes wrong in this style, what it looks like, and the fix. Read before building a doodle scene.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Stick figure or circle-head figure | Cheap, generic, no character | Layered host: hair, head, ear, face, sweater, bent arm |
| 2 | No hair silhouette | Every host looks the same in a thumbnail | A bun, flyaways and a swept fringe filled in `hair` |
| 3 | Dot eyes, no brows | Blank face, no emotion | Oval eyes with catch-lights, thick brows, one raised |
| 4 | Straight arm pointing | Rigid, like a signpost | Upper arm and forearm groups, bent at the elbow |
| 5 | Tiny hand | The point does not read | Hand drawn 1.4 times the arm scale, index and thumb |
| 6 | Long thin neck | Reads as a stick under a head | Neck 72 px wide, 104 px long |
| 7 | Pointing finger over text | The tip lands on the list | Point angles (-54, -22); keep the tip left of x 51 percent |
| 8 | `non-scaling-stroke` on a draw-on path | Stroke fully drawn at t 0 | Real-pixel viewBox, no vector-effect |
| 9 | Dash props left on at t 1 | Hairline seam on closed shapes | Remove dasharray when the stroke is done |
| 10 | Round cap at t 0 | A dot before the stroke starts | Render nothing at t 0 |
| 11 | All strokes appear at once | Looks like a fade, not drawing | Pen order, 45 px a frame, 2 frame overlap |
| 12 | Fill before outline | Colour blobs then lines, backwards | Fill starts as its outline ends |
| 13 | Flat vector fill in the spot colour | Clip-art look | Scribble fill with streaks, offset 7, 5 px |
| 14 | Boil on text | Words shimmer and blur | Text is DOM above the ink layer |
| 15 | Boil on the board | The whole frame crawls | Board svg has fixed seeds and no displacement |
| 16 | Boil scale above 5 | Lines tear and double | Scale 3.5, frequency 0.018 |
| 17 | Seed changing every frame | Nervous jitter | Hold each seed 2 frames, cycle 3 seeds |
| 18 | Shared filter ids in a sheet | All beats boil with one seed | Ids from `useId()` |
| 19 | Filters without sRGB | Palette hexes shift | `colorInterpolationFilters="sRGB"` |
| 20 | Pure white board | Sterile, not warm | `bg` with grain, fibres and vignette |
| 21 | Three or more spot colours | The eye has nowhere to go | `primary` and `highlight` only, both selective |
| 22 | Spot colour on every card | Nothing is marked | One highlighter swipe, one markup ellipse |
| 23 | Ellipse closes exactly | Looks traced by a machine | Turn 1.15 with a 6 percent spiral |
| 24 | Wobble re-seeded each frame | Shapes melt | Wobble depends on the angle only; boil adds the life |
| 25 | Arrowheads as filled triangles | Vector UI, not a pen | Two 26 px strokes at 28 degrees |
| 26 | Card text in the boil layer | Labels warp with the card | Labels are DOM over the card |
| 27 | Host in the middle | Fights the diagram | Lower left, cropped at the waist |
| 28 | Host face below y 80 | Hidden by platform UI | Face box ends at y 78.9 |
| 29 | Dark palette with ink hair on ink outlines | Hair vanishes | Focused dark palettes derive `hair` from `ink` (light) |
| 30 | Copying a known cartoon or a real person | Rights problem | Original host built from palette roles |

## Self-check
- [CHECK] The host reads as a person with a mood at thumbnail size, in both palettes.
- [CHECK] At frame 60 some lines are half drawn; nothing pops in fully formed except fills and eyes.
- [CHECK] Two consecutive frames differ in the ink lines only; text and board pixels match.
- [CHECK] `check-design.js` and `check-safezones.js` pass.
