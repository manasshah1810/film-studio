# low-poly-isometric failures

What goes wrong in this style, what it looks like, and the fix. Read before building a diorama.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Perspective camera | Edges converge, the back row shrinks, it looks like a photo of a toy | `orthographic` on `ThreeCanvas`, camera at (20, 20, 20) |
| 2 | Camera not on the (1, 1, 1) diagonal | A dimetric or tilted view, tiles are not 2:1 diamonds | Equal x, y, z position: pitch 35.264, yaw 45 |
| 3 | Moving the camera to turn the world | DOM labels drift off their pins | Fix the camera; turn and scale a group; use the same yaw and scale in `project()` |
| 4 | Smooth shading | Gradients across faces, it reads as clay render, not low poly | `flatShading` on every material |
| 5 | Tone mapping left on | Palette colours come out grey and washed | `flat` and `linear` on the canvas |
| 6 | Two lights cast shadows | Every object has two shadows | Only the key light has `castShadow` |
| 7 | Shadow camera too big or too small | Blocky, soft shadows, or shadows cut off | Orthographic shadow camera bounds 9, map 2048 |
| 8 | Shadow acne | Thin stripes on every face | `shadow-bias` -0.0004, `shadow-normalBias` 0.03 |
| 9 | Key light from the front | Left and right faces look the same | Key from (0.25, 1, 0.55): top 1, left 0.6, right 0.42 |
| 10 | Rock lost on a dark sky | The island looks like a flat plate floating in nothing | Lift earth and rock on dark `bg`; side 1.6:1 or more on the sky |
| 11 | High segment counts | Round smooth trees, no facets | 4 to 6 segments, icosahedron detail 0 |
| 12 | `Math.random()` in geometry | The rock changes shape on every frame | Seeded `Math.sin` noise |
| 13 | Scale 0 on a pop | Console spam, NaN in the matrix | `Math.max(0.0001, k)` and `visible={k > 0.001}` |
| 14 | Pop from the centre | Buildings grow out of the ground's middle and clip | Put the group origin at the base of the part |
| 15 | Tall building on the front row | It hides the street and the actor | Tall on back rows and corners |
| 16 | Pin the same red as the roof | The pin head vanishes | A `surface` collar under the head, head radius 0.3 |
| 17 | Badge with no leader | The number floats; which pin is it? | A 4 px `ink` leader from badge to head |
| 18 | Badge near another part | The number sits on the crane or a roof edge | Move the pin to a clear spot; badge 78 px above the head |
| 19 | 3D text in the canvas | Blurry, hard to read, the font gate is skipped | All text is DOM on top |
| 20 | Text on the diorama | Contrast changes with every face | Text on `bg` or on a `surface` plate only |
| 21 | Plates far from the island | The eye jumps; the shadow sits under the plates | Plates at y 69 percent, blob under the rock tip at y 1288 |
| 22 | Full 360 spin | Dizzy, labels swap sides | Turntable drift of plus or minus 5 degrees |
| 23 | Pull-back with no overshoot | It looks like a plain zoom | Spring 9/60/1 from 1.55 |
| 24 | Close-up shows the rock | The opening frame is mostly dirt | Shift the canvas down by `(scale - 1) * 260` while zoomed |
| 25 | Tiles pop at random | Noise, not a build | Order by `i + j` from the back corner, 2 frames apart |
| 26 | More than 3 pins | Plates crowd, nothing stands out | 3 pins per 10 s |
| 27 | Actor with a face or many parts | It looks like a different style | 4 to 6 primitives, no face |
| 28 | Palette hex in a component | `check-design.js` palette lock fails | Role names from `design-system.json`; tints from `iso.lights` |
| 29 | Plate text beyond 85 percent or 80 percent | `check-safezones.js` fails | Keep text in x 9 to 85, y 7 to 80 |
| 30 | `Canvas` from fiber instead of `ThreeCanvas` | Frames render out of sync or blank | `ThreeCanvas` from `@remotion/three` |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems low-poly-isometric` and `check-design.js` on the film.
2. Run `check-safezones.js` on the film.
3. Render the close-up, the pull-back and the last frame. Can you tell the top, left and right faces apart?
4. Does every pin stand out from what is under it? Does every badge sit over its pin? Is the rock visible?
