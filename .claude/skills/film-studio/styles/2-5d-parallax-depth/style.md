---
id: 2-5d-parallax-depth
status: verified
requires: none
subject_mode: layered
---
# 2-5d-parallax-depth

A flat vector scene cut into four planes and filmed by a camera that moves forward. Each plane
moves and blurs by its own amount, so a pure CSS and SVG frame feels like a theatre set. A Story
Actor stands on the hero plane, sharp, while the world behind and the frame in front go soft.
Read `design-system.json` for every number; this file says how to use them. `recipes.md` has the
math and code, `failures.md` the traps.

## 1. When to use
- A story with a place and a person in it: a journey, a memoir, a fable, a night scene, a quiet drama.
- An intro, a chapter card or a hook where the camera should feel like it is entering a world.
- Any beat that needs "look over there": a light, a door, a tower, a sign.
- The user asks for "cinematic", "depth", "parallax", "3D feel", "layered", "dolly".

## 2. When to avoid
- Data, charts, dense text or a list of facts (use `dark-neon-dataviz` or `neo-brutalist-ui`).
- Photoreal scenes. The look is flat vector cut-outs with light and haze, never a photograph.
- Long films with the camera always moving. Past 45 s, rest the dolly on a held plane at each re-hook (every 12 to 15 s); length itself is no limit.
- A story with many actors on screen at once. One Story Actor per scene.

## 3. The four planes
Camera perspective is 1400 px. A plane at depth `z` moves sideways by `1400 / (1400 - z)` of the camera.
| Plane | Name | z | Parallax | Blur at rest | What lives there |
|---|---|---|---|---|---|
| Z0 | atmospheric backdrop | -1400 | 0.50 | 3 px | sky, moon, stars, far hills, sea, haze |
| Z1 | midground | -700 | 0.67 | 2 px | buildings, a tower, arches, lamp posts; the lit story beat |
| Z2 | hero subject | 0 | 1.00 | 0 px | the Story Actor and the pier or floor it stands on |
| Z3 | foreground frame | 500 | 1.56 | 7 px | a post, a rope, reeds, a branch; dark, at the edges |
- Parallax must rise from Z0 to Z3. If two planes move the same, the scene looks like a poster.
- Z2 is the only sharp plane at rest. The eye goes to the sharpest plane.
- Z3 sits at the frame edges and never covers the actor's face or any plate.
- Atmosphere: far planes lean to the haze colour, near planes lean to `bg` darkened. Z0 is the lightest
  plane, Z3 the darkest, and the actor is the most saturated thing in the frame.
- Every plane is authored 1900 x 2200 and centred, so a push and a whip pan never show an edge.

## 4. Mode B: the layered Story Actor
The actor is a flat vector cut-out, built once and never redrawn (see `personas/casting-rig-designer.md`).
- Layers, back to front: shadow, back arm, legs, coat, scarf, head, front arm, lantern, glow.
- Limbs are tapered polygons on two joints, so an arm bends at the elbow.
- Three states: `idle` (breathing, lantern sway, a blink), `react` (head turns, brows lift, arm opens
  toward the beat), `act` (the lantern goes up, a step forward, the glow blooms). States are 0 to 1 weights.
- The actor needs a ground shadow and one rim light in the light colour, or it floats.
- The actor holds the light source. The glow falls on the pier and on the coat edge, which ties it to the set.
- Facial detail is small. Silhouette, scarf and lantern carry identity.

## 5. Palettes
10 palettes, two tiers. Pick by mood, then check that the actor reads against the horizon.
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | dusk-harbour, neon-rain, golden-hour, blue-hour, ember-night | one mood, one light |
| Expanded | 10 | misty-forest, desert-dawn, noir-city, aurora-coast, storm-front | a stronger world |
- Roles: `bg`, `surface`, `ink`, `primary` (the coat), `highlight` (the light). Expanded adds `sky`,
  `haze`, `mid`, `fore` and `coat`. A focused palette derives them by blending.
- One light colour (`highlight`) per scene. It is the lantern, the tower lamp and the scarf.
- Every text role is 4.5:1 or better on both `bg` and `surface` (lowest 5.6). Colour is a role name.

## 6. Typography
Sizes are pixels on the 1080 x 1920 frame. Display is at least 2.2x the body.
| Level | Size | Notes |
|---|---|---|
| Display | 108 | the title, two lines at most, on an opaque plate |
| Body | 44 | a caption line on a plate |
| Label | 34 | mono; readouts, plane tags; the floor for any text |
- 6 SIL OFL pairings, all Google Fonts: anton-dmsans-dmserif, bebas-inter-instrument,
  syne-manrope-fraunces, oswald-lora, unbounded-outfit-garamond, sora-grotesk-cormorant.
- Text lives in x 8 to 85 percent and y 8 to 80 percent, on an opaque `surface` plate.
- Text is never put on a plane. A plane blurs and moves; a plate does neither.

## 7. Depth rules
- Blur is depth of field: the sharp plane is 0, the others take 2 to 8 px. Blur only the planes, not the plates.
- Rack focus moves the sharp plane from Z2 to Z1 and back over 24 frames. The old plane takes 4 px.
- Parallax comes from real CSS perspective. Each plane is `translate3d(x, 0, z + push) scale((P - z) / P)`.
- The push is slow and ends before the last beat; the whip pan is fast and short. Never both fast at once.
- Light travels with the story: the tower lamp turns on when the actor looks at it, and the beam crosses the actor.

## 8. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| LayerExplode | the viewer should see the stack | planes slide apart along Z by 120 px each, hold 20 frames, close up |
| PictureDive | a place needs a picture | the camera pushes through a picture frame on Z1 until it fills the screen |
| RackFocus | the story moves to a new thing | blur swaps between two planes over 24 frames; the specimen has two swaps |
| DollyZoom | a moment of dread or realisation | push in while the perspective widens, so the actor holds size and the world stretches |
| StoryboardDeck | a film of 3 to 6 scenes | cards of the planes slide in a deck, each with a scene number |
One widget family per scene. Widget text comes from the script. RackFocus is built in the specimen;
LayerExplode, PictureDive, DollyZoom and StoryboardDeck are specified here and not yet built.

## 9. Top motions
| Motion | Where | Spec |
|---|---|---|
| Continuous Z-push | the whole film | the camera moves 220 px forward on the `push` bezier; Z3 grows 32 percent, Z2 19, Z1 12, Z0 9 |
| Rack focus swap | after a whip pan | the sharp plane changes in 24 frames on the `rack` bezier, blur rises on the old plane |
| Directional whip pan | to the story beat | camera x moves 260 px in 10 frames, an x only blur follows the speed, a spring settles it |
| Actor state change | on a beat | the actor blends idle to react to act over 26 frames each, on a smooth curve |
Limits per 35 s: 1 whip pan, 2 rack focus swaps, 1 actor, 1 widget family.

## 10. Anti-patterns
- A plane edge showing during a push or a pan (a visible rectangle, a strip of bare background).
- All planes blurred alike, or the hero blurred at rest.
- Text on a moving plane, or a plate that blurs.
- A foreground plane that covers the actor's face or the beat.
- A camera that cuts, or a push with linear or default ease.
- More than one light colour, or a glow that does not touch the set.
- A photograph, a video or an image fetched from the network.
- A second actor that is not built on the same layer contract.

## 11. Proof
- Specimen: `components/styles/2-5d-parallax-depth/Preview.tsx`, rendered in `dusk-harbour` and
  `noir-city`; stills in `previews/2-5d-parallax-depth/`.
- Gate: `node scripts/check-design.js --systems 2-5d-parallax-depth`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
