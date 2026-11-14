# voxel-art failures

What goes wrong in this style, what it looks like, and the fix. Read before building a voxel scene.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Perspective camera | Blocks converge, the grid bends, labels drift off their blocks | Orthographic at (20, 20, 20), zoom 78 |
| 2 | One Mesh per block | Hundreds of draw calls; slow renders | One InstancedMesh per material, `setMatrixAt` and `setColorAt` |
| 3 | Real-time lights on blocks | Smooth gradients across faces; looks like generic 3D | Unlit ShaderMaterial, 3 shades from the world normal |
| 4 | Shade picked from the local normal | A flipping cube keeps the wrong shade | Normal through `modelMatrix * instanceMatrix` |
| 5 | Default colour management | Palette hexes come out washed or too dark | `flat linear` canvas and `setRGB(..., LinearSRGBColorSpace)` |
| 6 | Left and right shades too close | Cubes read as flat hexagons | Top 1, left 0.8, right 0.62 |
| 7 | Smooth ambient occlusion | Blurry dark corners, not toy-like | Stepped: 1, 0.9, 0.82, 0.76 per occupied side cell |
| 8 | Soft transparent black shadow | Grey smudge under the hero | Opaque patch in `primary * 0.8`, 3 size steps |
| 9 | Clouds counted as solid | Clouds darken the grass under them | Exclude clouds from `solid` |
| 10 | Every grass block identical | A flat green slab; the grid vanishes | Seeded grain 0.96, 1, 1.04 per block |
| 11 | `Math.random` anywhere | Blocks or grain change between renders | `mulberry32(fnv1a(seed))` at module load only |
| 12 | All blocks drop at once | One lump falls; no assembly | Starts spread over 2 to 42, lowest layer first, centre out |
| 13 | Linear fall | Blocks float down | `y = h * (1 - t ^ 2)`, constant acceleration |
| 14 | Drop height too tall | Falling blocks cross the title | 6 units in 8 frames |
| 15 | Squash about the centre | The block sinks into the one below | Move down `(1 - 0.78) / 2` while squashed |
| 16 | Smooth springs | Motion looks like a generic tween | Sample on twos, snap to 1/8 |
| 17 | Hero on the 1 unit grid | A giant hero that dwarfs the house | Quarter grid: 0.25 cubes, about 15 cells tall |
| 18 | Flat 2D or stick figure | Breaks the world; reads cheap | A 3D build: legs, torso, arms, head with depth |
| 19 | Cap the same colour as the roof | Hero merges into the house | Cap `ink`; focused roofs are slate `mix(ink, surface, 0.4)` |
| 20 | Symmetric face | Blank, robotic | One raised brow, +0.3 cell, -8 degrees |
| 21 | Brow tilted down at the inner end | Hero reads angry | Tilt up at the inner end, raise it |
| 22 | Flip pivots at the feet | Hero swings in a wide arc and clips the ground | Flip group at the body centre |
| 23 | Flip ends off grid | Hero floats or sinks after landing | Parabolic hop returns to 0 at t = 1; squash after |
| 24 | ImpactFrame as one flat blob | World and hero merge into one shape | Two materials: world `ink`, hero `surface`, sky `highlight` |
| 25 | Impact frames everywhere | Strobe, tiring | At most 2 per 10 s, only on hard landings |
| 26 | Shake on the text | Title jitters and blurs | Shake only the canvas wrapper |
| 27 | Accent block competing with the hero | The eye lands on a red flower, not the hero | Only the hero's scarf uses `primary` near it |
| 28 | Tall props on the front rows | Hero hidden behind the house | House and tree on the back rows |
| 29 | Leader drawn from fixed pixels | Leader misses the head when the island bobs | `toPx` of the head plus the bob |
| 30 | Title over 7 characters a line | Chunky display clips at 104 | Short lines: "BLOCK BY / BLOCK" |
| 31 | Copying a known game's look | Licensing and originality problem | Original island, original hero, palette roles only |

## Self-check
- [CHECK] Top, left and right faces visibly differ on a still of each palette.
- [CHECK] Blocks at rest land exactly on the grid; no gaps or overlaps on the island top.
- [CHECK] The hero reads as 3D, curious, and distinct from the house.
- [CHECK] Text passes `check-design.js` and `check-safezones.js`.
