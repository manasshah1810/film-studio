---
id: glowing-plexus
status: verified
requires: none
subject_mode: ui-first
---
# glowing-plexus

A system drawn as light. Bright nodes gather into hubs, links glow brighter the closer two nodes sit, and light packets
run along the links from cause to effect. The camera drifts forward the whole time, so the web always breathes. It
makes contagion, neural networks, ecosystem collapse and domino effects feel alive and traceable. All of it is code:
a seeded network projected from 3D onto one 2D canvas with additive light. No images, no models, no randomness at
render time. Read `design-system.json` for every number; `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Something spreads: a rumour, a virus, a bank run, a meme, a power cut.
- A network decides: a neural network, a brain, a recommendation engine, a supply chain.
- One failure topples the next: ecosystem collapse, domino effects, cascading outages.
- The user asks for "network", "nodes", "plexus", "connections", "neurons", "contagion", "ripple effect".

## 2. When to avoid
- A human story or a face (use `2-5d-parallax-depth` or `hormozi-kinetic`).
- Exact numbers that must be compared (use `dark-neon-dataviz`), or a real place (use `tactical-vector-maps`).
- A light, warm or paper look. Additive light needs a dark sky; on a light `bg` the glow disappears.
- More than 3 named actors. The web carries 3 labelled hubs at most; the rest are anonymous nodes.

## 3. Hub weighting
- Each node's weight comes from its degree: `w = (deg / max deg) ^ 0.8`.
- Core radius runs 2.2 to 7.7 px with weight; halo is 4.5 times the core at alpha `0.18 + 0.22 * w`.
- Labelled hubs reach 1.6 times further than a normal node, so they collect the most links. They draw at an 11 px
  core with a 6 times halo and an `ink` centre dot, so they read as the brightest points in the frame.
- Each labelled hub seeds a cluster of 36 nodes on a clamped normal (sigma 0.55), so a hub is a dense knot.
- 60 scatter nodes fill the field and tie the clusters together; 90 far dust points with no links give depth.
- Sizes are at the reference depth and scale with perspective, so near hubs are bigger, far ones smaller.

## 4. Distance-based edge opacity
| Rule | Value | Why |
|---|---|---|
| Link exists | 3D distance under `0.75 * max(reach a, reach b)` | a plexus links neighbours, not everyone |
| Alpha | `0.5 * (1 - d / limit) ^ 1.6` | close pairs glow, far pairs whisper, zero at the limit |
| Live distance | measured every frame from the bobbing positions | links breathe; nothing pops on or off |
| Two strokes | 1.4 px core, then a 5 px halo at 0.18 of the core alpha | a crisp line with a soft glow |
| Lit link | alpha times 2 plus 0.14 once a packet has crossed it | the path the signal took stays traced |
| Fog | alpha times 1 at depth 8 down to 0.5 at depth 12.5 | far links sit back |
- Links take the colour of their cluster (`primary`, or `secondary` for the second hub). Mixed links take `primary`.
- Cause and effect bridges join hub to hub: dashed and flowing until their packet lands, then solid at 0.75.

## 5. Depth, drift and staging
- **Camera.** A pinhole at z 10, fov 40, looking down -z. It moves forward 0.008 units every frame and never stops.
- **Bob.** Every node bobs 0.05 units on its own sines (period 90 to 150 frames, seeded phase).
- **Composition.** Hubs sit in a zigzag: top left, middle right, lower left, so leaders alternate sides.
- **Scrims.** A `bg` fade over the top 24 percent keeps the title off the light. A soft vignette closes the corners.
- The bottom 20 percent stays quiet: faint web and dust only, never a hub, never text.

## 6. Mode C: UI and data first
- No person, no face, no person icon. The one subject is the network.
- Every word sits on an opaque `surface` plate with a 2 px `primary` border and a 28 px `bg` scrim around it,
  so the glowing links behind it are knocked back. Never set type straight on the web.
- A plate is a mono label in `primary` (34 px: number and role) over a value in `ink` (accent face, 46 px).
- A leader runs straight from the plate edge nearest the hub to the hub's orbit ring, and follows the hub each frame.
- Readouts in the bottom row are live: `REACH 1.42M`, `NODES LIT 089/137`, `HOPS 08`. Fixed-length strings in
  tabular numerals. Label in `dim` (expanded) or `primary` (focused), value in `ink`.
- 3 labelled hubs and 3 readouts at most.

## 7. Palettes
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | neural-cyan, synapse-amber, contagion-red, bio-lime, ultraviolet | one web colour and one packet colour |
| Expanded | 10 | deep-mind, forest-collapse, domino-ember, social-magenta, arctic-signal | a second cluster colour, a link tint and alert and ok states |
- Roles: `bg` (sky), `surface` (plates), `ink` (values, title, hub centres), `primary` (web, borders, labels), `highlight`
  (packets, flashes, orbit riders). Expanded adds `secondary`, `dim`, `link`, `alert` and `ok`; focused derives the
  colours the canvas needs and never sets text in a derived colour.
- Every `bg` is near black. `ink` and `primary` are 4.5:1 or better on `bg` and `surface` (lowest 6.3).

## 8. Typography
| Level | Size | Notes |
|---|---|---|
| Display | 100 | the title, upper case, 2 lines; 7 characters a line or fewer for wide faces such as Syne |
| Accent | 46 | plate and readout values |
| Body | 44 | a sentence if one is needed |
| Label | 34 | mono caps: kicker, plate labels, readout labels |
- 6 pairings, all Google Fonts: sora-manrope-dmmono, bricolage-inter-firacode, outfit-figtree-redhatmono,
  redhat-display-text-mono, epilogue-worksans-sourcecode, syne-dmsans-synemono.

## 9. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| OrbitRing | a hub fires or matters now | a tilted ellipse at 3.2 times the hub core, 12 ticks turning 2 degrees a frame, one `highlight` rider at 3 times that; older rings drop to 0.3 |
| GridCollapse | a system fails or an ecosystem collapses | each node eases to its nearest point on a 6 x 9 lattice in 15 frames, then lattice rows drop out bottom up in a 3 frame stagger, links fading with their nodes |
| PlayingGrid | the story counts who was reached | an 8 x 8 grid of small squares on a plate beside the web; one square lights in `highlight` as each node lights; a counter plate counts them |
| PromptBar | an AI prompt or a single action starts the chain | a `surface` bar above the web; the prompt types in mono at 2 characters a frame; on Enter, hub 1 fires |
| RackFocus | attention moves from one hub to the next | the focus depth moves to the firing hub over 14 frames; off-focus points grow by 6 px a unit of depth and dim so their light stays the same |
One widget leads at a time. OrbitRing and RackFocus are built in the specimen. GridCollapse, PlayingGrid and
PromptBar are specified here and not yet built.

## 10. Top motions
| Motion | Where | Spec |
|---|---|---|
| Pulse packet propagation | along the links | a shortest path tree from the firing hub gives every node an arrival frame; a packet crosses each tree link in `8 * d / 0.75 + 2` frames with a tail 0.35 of the link; the node flashes `highlight` and decays over 6 frames |
| Continuous Z-drift | the camera | forward 0.008 units a frame for the whole film; near nodes slide out faster than far ones; it never eases, stops or cuts |
| Elastic hub zoom | a firing hub | the hub springs to 1.6 times its size on 6/170/0.6, overshoots and settles; its orbit ring opens with it |
- A bridge packet is 1.6 times bigger and takes 24 frames hub to hub; it lands exactly when the next hub fires.
- Limits per 10 s: 3 hub fires, 2 bridges, 3 plates, 1 lead widget.

## 11. Beats
- 0 to 20: nodes fade in on seeded delays. 6 to 26: kicker and title. 14 to 30: readouts.
- 30: hub 1 fires (zoom, orbit ring); packets fill its cluster to about 70. 34: plate 1.
- 46 to 70: the bridge packet to hub 2. 70: hub 2 fires, focus racks to it. 74: plate 2.
- 86 to 110: the bridge to hub 3. 110: hub 3 fires, focus racks to it. 114: plate 3.
- The last node lights by about 160. Hold the full web at least 20 frames.

## 12. Anti-patterns
- `Math.random`, or any random number drawn inside a frame. The web flickers and two renders differ.
- Links that switch on at full strength, or a fixed line width with no halo.
- Type on the web with no plate and scrim. A packet or a lit link will run through the letters.
- A camera that stops, eases out or cuts. The drift is the heartbeat.
- A packet that jumps between nodes with no link, or arrives before its parent lit.
- A light `bg`, a person, a 4th labelled hub.

## 13. Proof
- Specimen: `components/styles/glowing-plexus/Preview.tsx`, rendered in `deep-mind` and `contagion-red`; stills in
  `previews/glowing-plexus/`. The same frame renders byte for byte the same twice.
- Gate: `node scripts/check-design.js --systems glowing-plexus`, then `check-design.js` and `check-safezones.js` on the
  film's work folder.
