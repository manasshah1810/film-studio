---
id: voxel-art
status: verified
requires: none
subject_mode: layered
---
# voxel-art

A world built from cubes on one grid. A floating island assembles block by block, a blocky hero drops in and lands with
a punch, and every face takes one of three exact shades, so the scene reads like a toy diorama. It suits playful
explainers, gaming histories and epic character stories. All of it is code: InstancedMesh cubes in `@remotion/three`
through a true isometric orthographic camera, with stepped shadows baked into instance colours. No images, no
textures, no lights. Read `design-system.json` for every number; `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Playful explainers: how something is built, piece by piece (a city, a supply chain, a game economy).
- Gaming histories: consoles, genres, the rise of a studio, told with toy-like dioramas.
- Epic character stories: one hero on one island, with a clear arc (arrive, react, act).
- The user asks for "voxel", "blocky", "cube world", "8-bit 3D", "toy diorama", "isometric blocks".

## 2. When to avoid
- A serious or tragic subject (war, illness, grief). The toy look trivialises it; use `archival-grunge`.
- Exact data that must be compared (use `dark-neon-dataviz`) or a real map (use `tactical-vector-maps`).
- Smooth organic shapes: faces with real emotion, water, cloth. Cubes cannot carry them.
- Copying a known game's blocks, characters or world. Build original dioramas only.

## 3. Cubic grid alignment
- World blocks are 1 unit. Characters use a quarter grid: 0.25 unit cubes (hero cells).
- At rest every block centre sits on `(x + 0.5, y + 0.5, z + 0.5)`, and a hero's feet rest on a whole-unit top.
- Off-grid positions are allowed only in motion (a fall, a hop, a flip) and snap back on the landing frame.
- Camera: orthographic at `(20, 20, 20)` looking at the origin, pitch 35.264, yaw 45, 78 px per unit, origin at
  pixel (540, 960). The camera never moves; the island floats instead (0.12 unit, 72 frame period, on twos, 1/32 steps).
- Isometric to pixels: screen right is `(1, 0, -1) / sqrt 2`, screen up is `(-1, 2, -1) / sqrt 6`. DOM labels and
  leaders use the same `toPx`, so text always points at the right block.
- The island is 8 x 8 with a cut corner, a grass top, earth under it and 4 underside layers, each inset by one cell.
  Tall things (house, tree) go on the back rows so the hero on the front rows is never hidden.

## 4. Three-shade cubes and stepped shadows
| Rule | Value | Why |
|---|---|---|
| Top face | 1.0 of the block colour | the light comes from above |
| Left face | 0.8 | the light leans left |
| Right face | 0.62 | the darkest visible side, so every edge reads |
| Bottom face | 0.5 | seen only during a flip |
| Shade pick | world normal, in a ShaderMaterial | a rotating cube keeps correct shades |
| Ambient steps | 1, 0.9, 0.82, 0.76 per occupied side cell one layer up | stepped, never smooth |
| Underside steps | 1, 0.88, 0.78, 0.7 per layer down | the island fades into its shadow |
| Cast shadow | march `(-1, 1, 1)` up to 6 cells; a hit means x 0.8 | hard, cell sized shadows |
| Grain | seeded 0.96, 1, 1.04 per block | a flat run still shows the grid |
- No real-time light, no soft transparent black shadow. Every shade is a palette colour times a factor.

## 5. Mode B: the expressive voxel character
- Never a flat 2D or stick figure. A hero is a 3D build of hero cells: legs 2 x 3 x 2, torso 5 x 3 x 3, arms
  1 x 3 x 2, head 6 x 4 x 5 with a cap 6 x 1 x 5 and a brim 6 x 1 x 2. Total about 15 cells tall (3.75 units).
- The head is about a third of the height. Big head, small body reads as friendly at phone size.
- Colour roles: suit `highlight`, face panel `surface`, eyes `ink`, cap `ink`, scarf `primary`, boots `ink`.
  The cap must not match the roof or any big block on the island, so the silhouette separates.
- One asymmetry: the right brow sits 0.3 cell higher and turns -8 degrees. It reads curious, not angry.
- One accessory pair: a cap with a brim and a scarf with a tail. The scarf is the only `primary` on the hero.
- Face features are flat plates on the face panel: eyes 1 x 2 cells, brows 1.24 x 0.26, mouth 1 x 0.36.
- Three states, in this order the first time:
  - idle: bob 1/8 unit every 10 frames, blink every 60 to 90 frames (3 frames, eyes at 0.2 height);
  - react: on landing the body squashes and springs back on the stepped spring; eyes 1.25 times, mouth 2.2 times,
    brows up 0.4 cell, for 14 frames;
  - act: wave (one arm up 150 degrees with a 20 degree swing on twos) or the 3D axis flip.
- One hero per scene. A second character may appear only as a smaller, single-colour build.
- The hero casts an opaque patch in the ground's cast-shadow shade. It shrinks in 3 steps (1, 0.75, 0.5) as the hero
  rises and slides away from the light.

## 6. Widgets
- **GravityDrop** (built in Preview). Blocks fall 6 units in 8 frames, `y = h * (1 - t ^ 2)`, then squash to
  1.1 x 0.78 x 1.1 for 2 frames. Order: lowest layer first, centre out, seeded jitter, starts spread over frames 2 to 42.
  A counter plate shows `landed / total` as an integer.
- **ImpactFrame** (built in Preview). On a hard landing only: frame 1 is silhouettes (world in `ink`, hero in
  `surface`) on a `highlight` sky with 14 `surface` rays from the feet; frame 2 keeps the rays; then shake 10, -8, 5,
  0 px. At most 2 per 10 s.
- **PlayingGrid**. A 6 x 6 board of 1 unit tiles on the island top, alternating `surface` and `primary`; pieces are
  2 x 2 x 2 hero-cell builds that hop one tile per beat (6 frames, up 0.5, land on the stepped spring). A DOM label
  such as `MOVE 03` in `mono`. Use for strategy, rules of a game, turn-based steps.
- **Banknote**. A voxel bill 6 x 1 x 3 units in `leaf` (`primary` on focused palettes) with a `surface` 2 x 1 x 1
  medallion on top. Bills stack with GravityDrop, one per 3 frames; the counter plate shows the total in `mono`.
  Use for prices, budgets, earnings. Never a real currency design.
- **DayDial**. A 5 x 5 unit ring of blocks around the island; a sun cube (`highlight`) and a moon cube (`surface`)
  step around it one block per 4 frames. The sky role eases between `bg` and `ink` on `snap`. A plate shows `DAY 3`.
  Use for time passing, seasons, timelines.

## 7. Motion
- **Stepped spring bounce.** Every spring is sampled on twos and snapped to 1/8: bounce (9 / 180 / 0.7) for the
  hero, plate (11 / 200 / 0.6) for DOM plates. Motion clicks like a stop-motion toy.
- **Gravity drop block assembly.** As GravityDrop above; the island builds over frames 2 to 52, never all at once.
- **3D axis flip.** The hero crouches 0.15 for 6 frames, hops 2.5 units and turns 360 degrees about x in 16 frames
  on the `flip` easing, pivoting at its centre, then lands on the grid with an ImpactFrame and the stepped spring.
- Pacing for 6 s: island 2 to 52, title 6 to 26 (stepped translate), hero drops at 52 and lands at 60, plate at
  68, wave 84 to 118, flip 124 to 140, blink at 152, hold to 180.

## 8. Typography and layout
- All text is DOM, `ink` on `bg` or on a `surface` plate. Plates are toy-like: radius 14, padding 22, 4 px `ink`
  border, a hard 8 px `ink` drop below, no blur.
- Display 104 (chunky, upper case, 7 characters or fewer per line), body 44, accent 48, label 32 in `mono`.
- Margin 9 percent, left aligned. Text stays inside x 9 to 85 and y 6 to 80; the island owns the centre.
- One leader at most: 4 px `ink` with a 9 px dot, from a plate edge to the hero's head pixel.

## 9. Palettes and pairings
- Focused (5 roles: `bg`, `surface`, `ink`, `primary`, `highlight`): lagoon-day, candy-pop, desert-quest, mint-arcade,
  night-camp. Block materials are derived in code: roof slate `mix(ink, surface, 0.4)`, plus earth, stone, wood, leaf.
- Expanded story palettes (adding `secondary`, `earth`, `stone`, `wood`, `leaf`): sunny-isle, sunset-arcade,
  frost-quest, night-candy, jungle-myth.
- Pairings: lilita-nunito-spacemono, bowlby-figtree-dmmono, titan-baloo-firacode, rammetto-rubik-jetbrains,
  pixelify-outfit-silkscreen, dela-sora-redhatmono.

## 10. Self-check before render
- [CHECK] Every block at rest on the grid; the hero's feet on a whole-unit top.
- [CHECK] Top, left and right faces visibly differ on every palette.
- [CHECK] The hero is 3D, head about a third, one asymmetry, cap and scarf.
- [CHECK] At most 2 impact frames per 10 s; no `Math.random`, no hex in components.
