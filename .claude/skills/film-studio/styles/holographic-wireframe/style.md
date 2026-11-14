---
id: holographic-wireframe
status: verified
requires: none
subject_mode: ui-first
---
# holographic-wireframe

A machine drawn as light. The object floats over a perspective floor grid as a glowing wire schematic: thin
bright edges with a soft halo, glass-clear faces that only glow at the silhouette, and a scan band that sweeps
down it like a scanner reading the part. It turns slowly, tilts, and comes apart into layers so the viewer can
see inside. Tags with leaders name the parts. It makes a teardown or an engineering mystery feel measured and
exact. All of it is code in `@remotion/three`: no model files, no textures, no images, no generated 3D.
Read `design-system.json` for every number; `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Hardware teardowns: what is inside a phone, a servo, an engine, a drone, a chip package.
- Engineering mysteries and failures: which part broke, where the load went, what the inspection found.
- Futuristic explainers: a prototype, a concept vehicle, a reactor, a space part.
- The user asks for "hologram", "wireframe", "CAD", "schematic", "X-ray view", "exploded view", "teardown".

## 2. When to avoid
- A human story or anything with a face (use `2-5d-parallax-depth` or `hormozi-kinetic`).
- A light, warm or paper look. Additive light needs a dark sky; on a light `bg` the glow disappears.
- Data with many exact numbers (use `dark-neon-dataviz`), or a place and a route (use `tactical-vector-maps`).
- A real branded product that must be recognised. The object is a type, built from primitives.

## 3. Dual-pass hologram rendering
Every part is drawn twice, and both passes add light: `AdditiveBlending`, `depthWrite: false`.
| Pass | What | Value | Why |
|---|---|---|---|
| 1 Faces | fresnel `ShaderMaterial`, both sides | `base 0.05 + rim 0.32 * (1 - abs(n . v)) ^ 2` | glass: clear in the middle, glowing at the silhouette |
| 2a Core edges | `EdgesGeometry` (15 degrees) into `LineSegments2` | 2.2 px, opacity 1 | the crisp line the eye reads |
| 2b Halo edges | the same edges again | 9 px, opacity 0.16 | the glow around the line |
| Scan copy | the same edges, clipped to the band | 3.6 px in `highlight` | the part lights up where the scan is |
- `LineSegments2` and `LineMaterial` give real pixel widths; WebGL draws plain lines 1 px wide whatever you ask.
- Flat extruded profiles (gears, the horn) use an outline wire: the top and bottom outline plus holes, no
  stub at every tooth corner. `EdgesGeometry` on a gear draws a short line at each tooth and it reads as noise.
- No depth writes, so inner parts show through the shell. That is the X-ray look; it is the point.
- The scene background is `bg` inside the canvas, so additive light adds onto the real sky colour.
- The canvas is `flat` and `linear`, and colours are set from the hex bytes, so a lit edge is the palette hex.
- Two roles carry the parts: `primary` for the shell and the moving parts, `secondary` for the motor and the board.
- Cylinders use 28 segments: under the 15 degree threshold, so only the end rings draw, not 28 side lines.
- Never stack coincident shapes (a band exactly on a can): additive light doubles and blows out to white.

## 4. Perspective grid and staging
- **Camera.** Perspective, fov 30, at `(0, 2.6, 11)`, looking at the origin. It never moves. The object turns.
- **Floor grid.** Lines every 0.5 units at y -1.25, faded to nothing by radius 7, so it melts into the sky.
- **Turntable ring.** A ring of radius 1.9 with 48 ticks on the floor under the object, turning with its yaw.
- **Object.** Assembled at scale 0.88, centred. Exploded at scale 0.58, moved 0.6 units right so the tags
  get a clear column on the left. Its centre sits at world y 0.45, about 43 percent down the frame.
- **Scanlines.** A 2 px dark line every 4 px at alpha 0.18 over the canvas, under all text.
- **Corner brackets.** 36 px in from each corner, 96 px arms, 4 px, `primary`.

## 5. Mode C: UI and data first
- The frame is an instrument. There is no person and no actor; the one subject is the object.
- Every word sits on an opaque `surface` tag with a 3 px `primary` border. Never on the hologram or the grid.
- A tag is a mono label in `primary` (34 px: number and name) over a value in `ink` (accent face, 46 px).
- Each tag has a leader: 40 px straight out of the tag, then a diagonal to a 3D anchor, ending in a ring
  with a `highlight` dot. The anchor is projected every frame, so the leader follows the turning part.
- Readouts in the bottom row are live: `AXIS Y 036.5°`, `SCAN 064%`, `LAYERS 06/06`. Fixed-length strings
  in tabular numerals, so a tag never reflows. Label in `dim`, value in `ink`.
- 3 tags at most on screen. The glitch never touches the tags or readouts; they stay readable.

## 6. Palettes
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | cyan-schematic, amber-cad, acid-green, magenta-holo, ice-white | one wire colour and one scan colour |
| Expanded | 10 | deep-lab, reactor-orange, stealth-teal, violet-forge, arctic-red | a second part colour, a grid tint and alert and ok states |
- Roles: `bg` (sky), `surface` (tags), `ink` (values, title), `primary` (wire, borders, labels), `highlight`
  (scan band, anchor dots). Expanded adds `secondary`, `dim`, `grid`, `alert` and `ok`; focused derives them.
- Every `bg` is near black. `ink` and `primary` are 4.5:1 or better on `bg` and `surface` (lowest 6.5).

## 7. Typography
| Level | Size | Notes |
|---|---|---|
| Display | 100 | the title, upper case, 2 short lines, no wrap; wide faces need 8 characters a line or fewer |
| Accent | 46 to 52 | tag and readout values |
| Body | 44 | a sentence if one is needed |
| Label | 34 | mono caps: kicker, tag labels, readout labels |
- 6 pairings, all Google Fonts: unbounded-plexsans-plexmono, oxanium-saira-sharetech, syne-spacegrotesk-spacemono,
  chakra-barlow-jetbrains, orbitron-exo-kodemono, jura-instrument-martian.
- Numbers are always `tabular-nums`.

## 8. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| OrbitRing | a part spins, cycles or orbits | a ring 1.3 times the object radius, tilted 70 degrees, 12 ticks, a dot riding it 2 degrees a frame; core and halo lines |
| LensRing | one small part matters | a 300 px DOM ring over one anchor; inside it a second canvas draws that part at 2.2 times, clipped to the circle |
| CodeBody | the story is a spec or a process | a `surface` panel beside the object; 6 mono lines at 34 px type on at 2 characters a frame |
| RackFocus | the story moves from one layer to another | the other layers fade to 25 percent line and face opacity over 12 frames; the focused one keeps full light and gets the next sweep |
| LayerExplode | showing what is inside | each layer slides along y by 0.5 units times its index on a spring 14/70/1; the object shrinks and moves right |
One widget at a time. LayerExplode is built in the specimen. OrbitRing, LensRing, CodeBody and RackFocus are
specified here and not yet built.

## 9. Top motions
| Motion | Where | Spec |
|---|---|---|
| 3D axis rotation | the whole scene | yaw from -40 degrees at 0.45 a frame; tilt on x from 6 to 16 degrees on a spring 12/60/1 at the explode; end in a three quarter view, never edge-on |
| Scanline sweep | 3 passes | a `highlight` band 0.07 units wide moves down the object in world y over 36 frames on the sweep easing; edges in it redraw thick, faces glow and fade behind it; 4 corner marks ride it |
| RGB chromatic glitch | 2 beats | an SVG filter splits the red channel left and the blue channel right by 10 px for 4 frames, sign flipping each frame; canvas and title only |
- The first sweep is the reveal: a clipping plane hides everything below the band, so the object prints top down.
- Gears turn 3 degrees a frame times their tooth ratio (8 drives 16 drives 10), so they look meshed.
- Limits per 10 s: 1 explode, 3 sweeps, 2 glitches of 4 frames, 3 tags, 1 widget.

## 10. Beats
- 0 to 20: the grid and brackets draw in. 6 to 26: kicker and title. 14 to 30: the readouts.
- 12 to 48: the first sweep prints the assembled object. 58: glitch.
- 62 to 100: the object explodes, tilts and shrinks right. 70 to 106: sweep 2 reads the exploded stack.
- 96, 108, 120: tags 1, 2 and 3 scale in, then their leaders draw. 128 to 164: sweep 3. 150: glitch.
- Hold the last frame at least 30 frames, in a three quarter view.

## 11. Anti-patterns
- A light `bg`, lit solid shading, or shadows. It stops being a hologram.
- Plain 1 px lines for the main edges, or no halo.
- Depth writes on faces or edges, so the inside goes missing.
- `EdgesGeometry` on a gear or any toothed profile; a band or ring exactly on another shape.
- A glitch longer than 4 frames, more than 2 per 10 s, or on the tags.
- An object that ends edge-on, or tags that cover the object.
- A loaded model, a texture, 3D text, or a person.

## 12. Proof
- Specimen: `components/styles/holographic-wireframe/Preview.tsx`, rendered in `deep-lab` and `magenta-holo`;
  stills in `previews/holographic-wireframe/`, including frame 151 mid glitch.
- Gate: `node scripts/check-design.js --systems holographic-wireframe`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
