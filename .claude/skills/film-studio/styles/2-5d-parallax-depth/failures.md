# 2-5d-parallax-depth failures

What goes wrong in this style, what it looks like, and the fix. Read before animating.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Plane edge shows | A rectangle or bare strip on a pan | Author every plane 1900 x 2200 and fill Z0, Z1, Z2 to the edge |
| 2 | Same parallax on every plane | A flat poster that slides | Let perspective set it: 0.50, 0.67, 1.00, 1.56 |
| 3 | Parallax typed as a number | Planes drift apart during the push | Use real `perspective` and `translate3d`, not hand made multipliers |
| 4 | No scale compensation | Planes are the wrong size at rest | `scale((P - z) / P)` on every plane |
| 5 | Translate inside scale | The pan is shorter than planned | Put `translate3d` outside `scale()` |
| 6 | `translateZ` reaches P | A plane vanishes or explodes | Keep `z + push` under 1400; use 500 for Z3 at most |
| 7 | Hero blurred at rest | The eye has nowhere to land | Z2 is 0 px; the other planes take 2 to 7 px |
| 8 | Everything blurred alike | A soft photo, no depth | Blur by distance from the focus plane |
| 9 | Blur on a plate | A blurry caption | Plates are siblings of the 3D parent and never filtered |
| 10 | Blur on the 3D div | The filter flattens or clips | Put the filter on the inner `svg` |
| 11 | Text on a plane | A label that moves and softens | Every label sits on an opaque `surface` plate |
| 12 | Z3 covers the face | The actor is hidden by a post | Keep Z3 in the outer 15 percent of the frame |
| 13 | Z3 too bright | The frame fights the actor | Z3 is the darkest plane, `bg` darkened 60 percent |
| 14 | Z0 darker than Z1 | The world looks upside down | Far is lighter and hazier, near is darker |
| 15 | Actor floats | A sticker on the scene | A ground shadow, a pier, a rim light in the light colour |
| 16 | Actor redrawn per scene | The face drifts | Build once with a seed; ask for a state |
| 17 | Line limbs | A noodle arm | Tapered polygons on two joints |
| 18 | No state change | A cut-out that never moves | Idle, react and act, each a 0 to 1 weight |
| 19 | Rack focus with a cut | The focus jumps | 24 frames on the `rack` bezier |
| 20 | Rack focus without a reason | The viewer does not know why | Light the tower lamp and turn the actor toward it |
| 21 | Whip pan with no blur | A teleport | An x only blur that follows the speed |
| 22 | Blur on a still camera | A smeared still | `blur = min(18, speed * 0.4)`, 0 at rest |
| 23 | Whip and push both fast | Motion sickness | Push is slow; the whip lasts 10 frames only |
| 24 | Push with linear ease | A mechanical creep | The `push` bezier, never `linear` |
| 25 | Two light colours | A muddy glow | One `highlight` for lantern, lamp and scarf |
| 26 | Glow that touches nothing | A sticker halo | Add a pool of light on the pier and a rim on the coat |
| 27 | Palette hex in a component | `check-design.js` palette lock fails | Use the role name from `design-system.json` |
| 28 | Weight the family does not have | The render stops: "does not have a weight" | Anton, Bebas Neue, DM Serif Display and Instrument Serif have 400 only |
| 29 | A photo or video as a plane | The flat vector look breaks | Draw every plane in SVG |
| 30 | A foreground plane in a still frame | A dark block with no job | Show Z3 at the edges and let it leave on the pan |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems 2-5d-parallax-depth` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Render frames at the push start, the whip pan peak and the last beat. Look at all four edges at the peak.
4. Is the hero the sharpest plane at rest? Do the four parallax numbers rise? Is there any text off a plate?
