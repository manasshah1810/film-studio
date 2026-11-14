---
id: scifi-hud
status: verified
requires: none
subject_mode: ui-first
---
# scifi-hud

A frame that looks like an instrument. Concentric targeting rings, corner registration brackets, live
signal bars, scanlines and monospace telemetry that decodes itself. The viewer feels they are watching a
machine think. There is no person in the frame; the one subject is the thing being tracked, drawn as a wire
shape. Read `design-system.json` for every number; this file says how to use them. `recipes.md` has the
geometry and code, `failures.md` the traps.

## 1. When to use
- AI, models, agents, robotics, drones, aerospace, space, chips, networks, security, cyber thrillers.
- A breakdown where numbers carry the story: speed, altitude, latency, accuracy, a status that flips.
- A hook, a chapter card or a "system online" beat that should feel authoritative and fast.
- The user asks for "HUD", "sci-fi", "cyber", "terminal", "targeting", "telemetry", "futuristic UI".

## 2. When to avoid
- Warm human stories, memoir, food, wellness (use `2-5d-parallax-depth` or `hormozi-kinetic`).
- Long reading. Monospace in caps tires the eye; keep each plate to a label and a value.
- Films over about 40 s. Constant motion in the rings needs a rest.
- Real maps and routes (use `tactical-vector-maps`).

## 3. Segmented HUD geometry
The reticle is built from circles with `stroke-dasharray`. All radii are around the frame centre.
| Ring | r | Kind | Spin per frame |
|---|---|---|---|
| ticks | 330 | 120 minor ticks plus 24 major | -0.15 deg |
| outer arcs | 296 | 6 arcs, 22 percent gap, stroke 6 | +0.5 deg |
| gauge | 262 | partial arc that fills with the signal, orbit dot rides it | none |
| fine dashes | 228 | 36 short dashes, stroke 3 | -0.9 deg |
| inner arcs | 190 | 4 arcs, stroke 2 | +1.6 deg |
| lens | 150 | soft disc, thin rim, a crosshair with a centre gap | none |
- Neighbouring rings turn in opposite directions at different speeds. Never all one way.
- Dashes fit the circumference exactly: `seg = 2 * PI * r / N`, `dash = seg * (1 - gap)`.
- Corner brackets sit 36 px from the corner, arms 110 px, stroke 5. A plus mark sits at each edge middle.
- Three line weights only: 2, 4 and 6 px. Glow is one soft disc behind the reticle, never on text.
- Scanlines (2 px line every 4 px, alpha 0.16) and one slow bright band sit above the rings and under plates.

## 4. Mode C: UI and data first
- The frame is the interface. Rings and plates are the picture; there is no photo, no video, no person.
- One subject only: the tracked thing, a wire shape in `ink`, with a lock box in `primary` that turns `highlight`.
- Every readout is a plate: label (34 px, `dim`) above a value (44 px, `ink`), mono, tabular numerals.
- Text lives on opaque `surface` plates with a thin `primary` border. Text is never on a ring, the grid or a scanline.
- Values are live strings of fixed length, so a plate never reflows while a number ticks.
- State is a word that flips (ACQUIRE, TRACKING, LOCKED) and a colour that flips with it.
- The story is three beats: acquire, track, lock. The lock is the only moment with a glitch.

## 5. Palettes
10 palettes, two tiers. Pick by domain, then check the highlight reads against `bg`.
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | cyan-ops, amber-terminal, phosphor-green, red-alert, ice-blue | one mood, one signal colour |
| Expanded | 10 | deep-space, cyber-noir, aerospace-amber, mil-green, fusion-orange | a richer system with alert and ok states |
- Roles: `bg`, `surface`, `ink`, `primary` (the rings), `highlight` (lock and cue). Expanded adds `dim`,
  `grid`, `alert`, `ok` and `glow`. A focused palette derives them by blending.
- Every text role is 4.5:1 or better on both `bg` and `surface` (lowest 5.0). Colour is a role name.
- One signal colour does the work. `highlight` is used for the lock, the orbit dot and the peak bar.

## 6. Typography
Sizes are pixels on the 1080 x 1920 frame. Display is at least 2.2x the body.
| Level | Size | Notes |
|---|---|---|
| Display | 108 | the title, caps, one line, on a plate |
| Body | 44 | the readout value, mono |
| Label | 34 | mono caps; the floor for any text |
- 6 SIL OFL pairings, all Google Fonts: orbitron-chakra-sharetech, oxanium-grotesk-jetbrains,
  rajdhani-exo-plex, saira-inter-dmmono, chakra-sora-martian, kode-barlow-spacemono.
- Display and labels are upper case. The mono carries every number; use tabular numerals.
- Text lives in x 8 to 85 percent and y 8 to 80 percent. The bottom 20 percent is left empty.
- Small mono is legible at 34 px on `surface` when it is `ink` or `dim` (7:1 or better here).

## 7. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| OrbitRing | a value circles a target | a dot on a ring, a short comet arc behind it, 2.2 deg per frame |
| CodeBody | the film shows a system prompt, a log or a config | a plate of 4 to 6 mono lines, the active line takes `highlight`, lines scramble in |
| LensRing | the subject is looked at by a sensor | a disc with a radial rim gradient, a crosshair with a centre gap, a lock box |
| EyedropperGrade | a colour or a value is sampled | a ring cursor over a swatch plate, the hex or value decodes beside it |
| GridCollapse | the HUD closes down or a scene ends | the grid lines pull to the centre in 15 frames and the rings shrink to a dot |
One widget family per scene. Widget text comes from the script. OrbitRing and LensRing are built in the
specimen; CodeBody, EyedropperGrade and GridCollapse are specified here and not yet built.

## 8. Top motions
| Motion | Where | Spec |
|---|---|---|
| Text scramble decode | every readout, the title, the state word | random glyphs from a fixed charset, locked from the left over 18 frames, 8 frames apart |
| Counter-rotating reticle drift | the whole film | neighbouring rings spin opposite at 0.5, 0.9 and 1.6 deg per frame |
| RGB chromatic glitch | the lock | 8 frames, ghosts in `primary` and `alert` at 12 px, three shifted slices, once |
| Lock on | the middle of the film | the lock box shrinks from 640 to 250 px on a spring, the state word flips |
Limits per 10 s: 1 glitch, 1 lock, 1 widget family, readouts that decode once and then tick.

## 9. Anti-patterns
- Text drawn on the rings, the grid or the scanlines.
- A proportional font for a number, or a value whose width changes while it ticks.
- All rings turning the same way at the same speed.
- A glitch that repeats every second, or a glitch that moves a plate.
- A glow on text, or more than one glow.
- More than one signal colour doing the same job.
- A label under 34 px, or a label under 4.5:1.
- A photograph, a video, a person, or an image fetched from the network.

## 10. Proof
- Specimen: `components/styles/scifi-hud/Preview.tsx`, rendered in `cyan-ops` and `cyber-noir`;
  stills in `previews/scifi-hud/`.
- Gate: `node scripts/check-design.js --systems scifi-hud`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
