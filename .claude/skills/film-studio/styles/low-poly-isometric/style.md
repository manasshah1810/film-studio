---
id: low-poly-isometric
status: verified
requires: none
subject_mode: layered
---
# low-poly-isometric

A miniature world on a floating island, seen from the classic isometric angle. Every shape is a few flat
facets lit by one warm key light, so the top, left and right faces read as three clear tones. Pins drop onto
the places that matter and numbered plates name them. It gives economics, supply chains, cities and myths
a map you can point at. All of it is code in `@remotion/three`: no generated 3D, no model files, no images.
Read `design-system.json` for every number; `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Economics and supply chains: where a thing is made, moved and sold.
- Urban history, how a town grew, a port, a factory district, a city block before and after.
- Mythology and ancient worlds: a temple hill, an underworld layer, a sacred grove.
- The user asks for "isometric", "diorama", "miniature", "low poly", "3D map", "SimCity look", "tiny world".

## 2. When to avoid
- A story about one person's face or feelings (use `2-5d-parallax-depth` or `hormozi-kinetic`).
- Data with many exact numbers (use `dark-neon-dataviz`), or a document story (use `archival-grunge`).
- Real buildings that must be recognised. The diorama is a type, not a portrait of a place.
- More than 3 places to point at in one scene.

## 3. Orthographic diorama framing
- **Camera.** An `OrthographicCamera` at `(20, 20, 20)` looking at the origin. That is pitch 35.264 degrees
  (`atan(1 / sqrt 2)`) and yaw 45 degrees: true isometric, so parallel edges stay parallel and nothing shrinks
  with distance. Zoom 100 px per unit. Never a perspective camera.
- **Camera stays fixed.** The world group turns and scales. That keeps the projection maths simple, so DOM
  labels can follow 3D points.
- **Island.** 6 x 6 tiles of 1 unit: a 0.3 slab on 0.35 of earth, over an upside-down faceted rock 4 units deep.
  The origin lands at x 540, y 900 on the 1080 x 1920 frame. The island fills about 85 percent of the width.
- **Rows.** Tall things (a tower, a chimney, a factory) go on the back rows and corners. Short things (stalls,
  trees, a pier) go in front. A tall thing in front hides the story.
- **Floating.** A soft blob shadow sits under the rock tip and the island bobs 7 px. The sky is `bg`, flat.
- **Text is DOM, never 3D.** Title top left, plates in a row at y 69 percent, number badges over the pins.
  The bottom 20 percent stays empty for platform captions.

## 4. Lighting and materials
| Part | Value | Why |
|---|---|---|
| Material | `meshLambertMaterial`, `flatShading` | each facet is one tone, no smooth gradient |
| Canvas | `flat` (no tone mapping), `linear` | a lit top face shows the palette colour exactly |
| Key light | direction (0.25, 1, 0.55), 2.2, warm tint, casts shadows | tops brightest, left faces mid, right faces dark |
| Rim light | direction (-0.7, 0.45, -0.6), 1.1, cool tint, no shadow | a cool edge on the back faces |
| Ambient | 0.9 | shaded faces never go black |
| Shadow map | 2048, bounds 9, bias -0.0004, normal bias 0.03 | crisp shadows, no stripes |
- Top : left : right is about 1 : 0.6 : 0.42. If two faces of a box look the same, the key light is wrong.
- One shadow-casting light only. A second one doubles every shadow.
- On a dark `bg` the earth and rock are lifted so the island side is 1.6:1 or more against the sky.

## 5. Mode B: faceted 3D Story Actors
- An actor is 4 to 6 primitives: feet box, body (a 6-sided tapered cylinder), head (an icosahedron, detail 0),
  a hat cone, two arm boxes. No face. Colour and the hat carry who it is.
- Scale 1.45 so it reads at the 6 x 6 island size; it is about 1 unit tall, as tall as a house wall.
- Three states: idle (a 1 percent bob), react (a hop of 0.26 units over 12 frames), act (one arm swings up and waves).
- An actor stands on a tile centre, faces the camera half way (`rotation.y` 0.5), and is never under a pin.
- Same build every scene: one seed, one set of parts (see the casting ledger in `personas/casting-rig-designer.md`).

## 6. Palettes
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | clay-coral, mint-model, night-shift, blueprint-sky, terracotta | a one-colour clay model with one accent |
| Expanded | 10 | harbour-town, desert-bazaar, midnight-metro, olympus-myth, autumn-mill | a full world: earth, walls, roofs, trees, water |
- Roles: `bg` (sky), `surface` (plates and pin collars), `ink` (text, leaders), `primary` (pins, accents),
  `ground` (tile tops). Expanded adds `earth`, `wall`, `roof`, `foliage` and `water`; focused derives them.
- `ink` is 4.5:1 or better on `bg` and on `surface` in every palette (lowest 10.9).
- `primary` is for pins and one accent part only. When the roofs are red, the pin gets a white collar.

## 7. Typography
| Level | Size | Notes |
|---|---|---|
| Display | 104 | the title, upper case, 2 lines, no wrap |
| Plate word | 60 | the accent face, one word: MAKE, MOVE, SELL |
| Body | 44 | a sentence under the title if needed |
| Label | 34 | mono caps: kicker, plate sub line, badge numbers at 38 |
- 6 pairings, all Google Fonts: fredoka-nunito-dmmono, outfit-dmsans-spacemono, sora-manrope-jetbrains,
  lilita-quicksand-redhatmono, rubik-worksans-ibmplexmono, poppins-figtree-robotomono.
- Text never sits on the diorama. It sits on `bg` or on a `surface` plate.

## 8. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| LayerExplode | a system has levels (ground, pipes, cables, tunnels) | the island splits into 3 to 4 slabs along y, 0.8 units apart, each with a side plate |
| DayDial | time passes in the world | a flat disc on a corner tile with a hand; the key light swings 40 degrees and `bg` blends to the night colour |
| Banknote | money moves between places | a faceted note (a thin box with a primary band) flies a 3 point arc between two pins in 20 frames |
| PlayingGrid | the story is about land or choices | tiles light up one by one in `primary`, a counter plate counts them |
| DollyZoom | one place becomes the whole story | world scale springs from 1 to 2.2 on the target while the others fade; the camera stays fixed |
One widget at a time. Pins and plates are the base layer and are built in the specimen; LayerExplode, DayDial,
Banknote, PlayingGrid and DollyZoom are specified here and not yet built.

## 9. Top motions
| Motion | Where | Spec |
|---|---|---|
| Slow turntable drift | the whole scene | world yaw from -5 to +5 degrees on a cosine over the scene; never a full spin |
| Spring tile pop-up | the opening | each tile rises from 1.2 units below and scales from 0, spring 11/170/0.7, 2 frames apart from the back corner |
| Elastic pull-back zoom | after the build | world scale springs from 1.55 to 1 on 9/60/1, overshoots once, settles |
Also: buildings pop from their base on 9/150/0.8, pins fall 3 units on 8/160/0.8 and their heads spin
2.4 degrees a frame, plates rise 40 px on 13/180/0.8 eight frames after their pin.
Limits per 10 s: 1 pull-back, 3 pins, 1 widget, 1 actor action.

## 10. Beats
- 0 to 10: the rock appears. 8 to 30: tiles pop up from the back corner. 6 to 30: the title lands line by line.
- 30 to 60: buildings, trees, crane, ship and the actor pop in, close up at scale 1.55.
- 62 to 95: the elastic pull-back shows the whole island. 96, 116, 136: pins 1, 2 and 3 drop, each with its plate.
- 142 to 160: the actor hops and waves. Hold the last frame at least 30 frames.

## 11. Anti-patterns
- A perspective camera, smooth shading, or a smooth sphere.
- A loaded 3D model, a texture image, or 3D text in the canvas.
- Tone mapping that greys the palette, or two shadow-casting lights.
- A full 360 degree spin, or a camera that flies around.
- A pin with the same colour as the roof under it and no collar.
- More than 3 pins at once, or a plate with no number to tie it to its pin.

## 12. Proof
- Specimen: `components/styles/low-poly-isometric/Preview.tsx`, rendered in `harbour-town` and `midnight-metro`
  (also `night-shift`); stills in `previews/low-poly-isometric/`.
- Gate: `node scripts/check-design.js --systems low-poly-isometric`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
