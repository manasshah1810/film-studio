# Motion effects: 3D flip, RGB glitch, stop-motion jitter, film gate

Code: `components/motions/effects.ts`. Four seeded helpers, each a pure function of the frame number:
`axisFlip3D`, `rgbChromaticGlitch`, `stopMotionSteppedJitter`, `filmGateFlicker`. Rules they follow:
`personas/motion-choreographer.md` section 4 (pairing and limits) and `personas/sound-designer.md`
section 1 (SFX lookup). Numbers marked "token" come from a style's `design-system.json`; numbers marked
"default" are this file's choice where no style or persona gives one.

## 1. Determinism contract
Remotion renders frames in parallel on several workers, in any order. An effect is safe only if frame N
draws the same pixels whether the worker started at 0 or at N.
| Rule | How the helpers keep it |
|---|---|
| No `Math.random`, no state, no "previous frame" variable | every random value is `rand(seed, pose, k)` (FNV-1a plus an avalanche mix) |
| Same seed, same look | the seed is a string option; give each element its own (`'headline'`, `'stamp'`) |
| Stepped textures change only on pose frames | `pose = floor((f - start) * stepFps / 30 + 1e-9)` |
| No float drift between machines | the `1e-9` keeps `12 * 5 / 30 = 2` from becoming `1.9999` on one CPU |
| No blank frames | a flip never draws an exact edge-on frame (section 3) |
| Inputs cannot break the bounds | offsets, lengths, alphas and rates are clamped to `EFFECT_BOUNDS` |

## 2. Stepped frame rates: 8 fps and 12 fps on a 30 fps timeline
A stepped texture holds each pose for several frames. 30 is not a multiple of 8 or 12, so the holds are
uneven but exact and repeating. `steppedPose(f, stepFps)` returns `{pose, poseStart, holdFrames, isNewPose}`.
| Step rate | Pose index | Hold pattern (frames) | Poses per second | Feel |
|---|---|---|---|---|
| 12 fps | `floor(f * 12 / 30)` = `floor(f * 0.4)` | 3, 2, 3, 2 ... (cycle 5 frames, 2 poses) | 12 | handmade, "on twos" of 24 fps animation; archival-grunge token |
| 8 fps | `floor(f * 8 / 30)` = `floor(f * 0.2667)` | 4, 4, 4, 3 ... (cycle 15 frames, 4 poses) | 8 | chunkier, clay or cut-out paper; default for a heavier hand |
| 15 fps | `floor(f / 2)` | 2, 2, 2 ... | 15 | the choreographer's "every 2 frames"; even, reads closer to a shake |
| 30 fps | every frame | 1 | 30 | not stop motion: a vibration (archival-grunge failures.md #21) |
Measured with `steppedPose` over 300 frames: 12 fps gives 12 poses in every second with holds 3,2,3,2;
8 fps gives 8 poses with holds 4,4,4,3; `holdFrames` matched the real next pose change on all 1200 checks.
- Pick 12 fps for texture that must still read as alive (headline jitter, gate flicker).
- Pick 8 fps when the style is visibly handmade and the beat is slow; it halves the visual noise.
- Accepted range is 4 to 15 fps (`EFFECT_BOUNDS.stepFps`); outside it the helper clamps.
- One rate per film. Mixing 8 and 12 fps layers reads as a frame-rate bug, not a style.
- Every stepped layer counts poses from its own `start`, so two layers that start on different frames
  step on different frames. To make layers step together (a whole-page jitter), give them the same `start`.

## 3. axisFlip3D: perspective axis flip
```
t      = bezier(flip, clamp01((f - start) / frames))           flip = [0.65, 0, 0.35, 1]  (neo-brutalist token)
turn:  angle = dir * turn * t                                  turn 180 shows the back, 360 comes round
swap:  angle = dir * (t < 0.5 ? 180 t : 180 t - 180)           A turns 0 to 90, B turns -90 to 0
edge:  if |cos(angle)| < 0.05 on a frame inside the flip, sample f + 0.5 instead
face   = turn: back while 90 < |angle| mod 360 < 270;  swap: back from t >= 0.5
bright = 1 - shade * (1 - |cos angle|)                          shade 0.25 default
```
Setup: the parent gets `parentStyle` (`perspective: 1400px`, origin centre); the turning element gets
`transform` and `transformStyle: preserve-3d`; in turn mode each face has `backfaceVisibility: hidden` and
the back face is pre-rotated `rotateY(180deg)` (neo-brutalist-ui recipes.md section 6). Both faces are
full cards with their own border, so no seam shows at 90 degrees.

Why the edge sample: an 18 frame flip on this curve hits t = 0.5 exactly on frame 9, which is exactly
90 degrees: both faces are a zero-width sliver and the frame is blank. Measured, 18 frames, turn mode:
`0 0.47 2.02 4.92 9.58 16.58 26.83 41.7 62.85 104.09 117.15 138.3 ... 179.53 180`. Frame 9 shows
104 degrees instead of 90. Over 16 flips (8 to 24 frames, both modes) no frame lands edge-on.

| Option | Default | Source |
|---|---|---|
| `frames` | 18 | neo-brutalist-ui token; voxel-art uses 16 |
| `axis` | `y` | choreographer `rotateY`; voxel-art flips about `x` |
| `turn` | 180 | neo-brutalist card; voxel-art 360 |
| `perspective` | 1400 px | 2-5d-parallax-depth and neo-brutalist-ui token |
| `mode` | `turn` | `swap` is the choreographer's "0 to 90 then 90 to 0 on the swap frame" |

Perspective bounds: keep `perspective` at or above about 1.3 times the card's width (1400 for a 1080 card).
Lower values bulge the near edge past the frame and stretch type on the turn. [CHECK] the 1.3 ratio is
judged from the 1400/1080 token pair, not measured on a render.

## 4. rgbChromaticGlitch: RGB channel split
```
active  = start <= f < start + frames
i       = f - start
amount  = decay: 1 - i / frames          flip: 1
sign    = decay: -1                       flip: i even -> -1, i odd -> +1
dx      = sign * offset * amount          red channel moves dx, blue moves -dx, green stays put
bands   = n slices, cut points k/n +- 0.3/n, re-rolled every bandStep frames
band dx = (k even ? -1 : 1) * (0.3 + 0.7 rand) * bandShift * offset * amount
```
Two ways to draw it, both from the styles:
- **Channel filter** (holographic-wireframe recipes.md section 6): `feColorMatrix` with `CHANNEL_MATRIX.r`,
  `.g`, `.b`, `feOffset` the red by `dx` and the blue by `-dx`, `feBlend` screen. Pad the filter region by
  `filterPadPct(widthPx)` percent on each side, or the shifted channels are clipped at the box edge.
- **Ghost copies plus slices** (scifi-hud recipes.md section 7): two mono copies in `primary` and
  `alert` moved by `redTransform` and `blueTransform` with `mixBlendMode: screen`, and the real element
  cut into `bands`, each with its `clipPath` and `transform`.

### Chromatic offset bounds
| Bound | Value | Source |
|---|---|---|
| Minimum offset | 4 px | choreographer: 4 to 10 px |
| Default offset | 10 px | choreographer upper value; holographic-wireframe token |
| Maximum offset | 12 px (clamped) | scifi-hud token is 12; nothing goes past it |
| Band shift | up to 1.4 x offset (default) | scifi-hud slices use 16, 10 and 7 px against a 12 px ghost |
| Length | 4 to 10 frames (clamped), default 8 | holographic-wireframe 4, scifi-hud 8, choreographer 6 to 10 |
| Decay | linear to 0; the last glitch frame keeps `1/frames` of the offset | scifi-hud `1 - (f - LOCK) / 8` |
| Bands re-roll | every 2 frames (default) | slices that re-cut every frame strobe |
All offsets are at the 1080 px design width. Measured, 8 frames at 12 px: dx `-12 -10.5 -9 -7.5 -6 -4.5
-3 -1.5`, frame 108 clean; asking for 40 px returns 12; asking for 30 frames ends at frame 110.
- The glitch is channel maths, so it needs no palette colour in the filter form.
- Never glitch body text, tags or readouts (holographic-wireframe and scifi-hud both forbid it): canvas,
  title or one hero element only.

## 5. stopMotionSteppedJitter: stepped handmade jitter
```
pose  = steppedPose(f, fps, start).pose
x, y  = (2 rand(seed, pose, 1|2) - 1) * px          px default 1.6 (archival-grunge token), clamp 1 to 3
rot   = (2 rand(seed, pose, 3) - 1) * deg           deg default 0.5 (token), clamp 0 to 1
scale = 1 + (2 rand(seed, pose, 4) - 1) * scale     default 0 (off)
no repeat: if |x - x_prev| and |y - y_prev| are both < 0.35 px, x is pushed 0.35 px away from x_prev
```
- Outside `[start, end)` the element is at rest (`translate(0, 0) rotate(0)`).
- `x_prev` is the previous drawn pose, resolved the same way up to 8 poses back, so the rule holds and the
  function stays pure. Measured over 6 seeds, 8 and 12 fps, 3000 frames: 0 near-duplicate poses, max
  offset 1.6 px, 0 changes inside a hold.
- Jitter the headline, notes and stamp; never the body text (archival-grunge style.md).
- SFX `ticks`: `onset` (default) gives one `stop-tick` at `start`; `poses` gives a tick on pose changes,
  at least 5 frames apart (12 fps on 30 gives ticks at 10, 15, 20, 25 ...); `none` for silent texture.

## 6. filmGateFlicker: film gate texture
```
pose        = steppedPose(f, fps = 12).pose
overlay     = brightness * rand(seed, pose, 1)       black overlay, brightness 0.07 token, clamp 0.08
weaveX      = (2 rand - 1) * weave                   weave 1 px token; weaveY = half of that
specks      = 14 (token): x, y in %, r 1 to 3.6 px, half dark and half light, alpha 0.25 to 0.7
scratch     = visible when rand(seed, pose, 20) < 0.35; x holds for 6 poses; 1.5 px wide, alpha 0.18
```
- The gate is the last layer, over the stamp and tape (archival-grunge failures.md #23).
- `weaveTransform` moves the whole frame; the paper itself never slides (archival-grunge camera note).
- Measured over 900 frames at 12 fps: max overlay 0.0699, mean 0.034, weave within 1 px, scratch in 134
  of 360 poses (37 percent). Asking for brightness 0.3 returns at most 0.079.
- The scratch keeping its x for 6 poses (half a second) is a default: a scratch lives on the print.
- No SFX: the gate is a bed texture. A projector loop is not in the sound designer lookup.

## 7. Style compatibility
All 12 styles are `requires: none`. "Token" means the style's design-system.json sets the effect's
numbers; "not in vocabulary" means the style's files never use it, so do not add it.
| Style | Axis flip | RGB glitch | Stop-motion jitter | Film gate |
|---|---|---|---|---|
| archival-grunge | not in vocabulary | not in vocabulary | token: 12 fps, 1.6 px, 0.5 deg | token: 12 fps, 0.07, 1 px, 14 specks |
| holographic-wireframe | not in vocabulary | token: 4 frames, 10 px, `flip`, canvas and title only | not in vocabulary | not in vocabulary |
| scifi-hud | not in vocabulary | token: 8 frames, 12 px, `decay`, 3 bands, the lock only | not in vocabulary | not in vocabulary |
| neo-brutalist-ui | token: Y, 18 frames, 1400 px, `flip` bezier | not in vocabulary | not in vocabulary | not in vocabulary |
| voxel-art | token: X, 360 deg, 16 frames, with a 2.5 unit hop | not in vocabulary | not in vocabulary | not in vocabulary |
| 2-5d-parallax-depth, dark-neon-dataviz, glowing-plexus, hormozi-kinetic, low-poly-isometric, minimalist-doodle, tactical-vector-maps | not in vocabulary | not in vocabulary | not in vocabulary | not in vocabulary |
A style with no token can still take the choreographer's generic primitive if the storyboard asks; use the
helper defaults and log the choice. [CHECK] no style besides the five above has been tested with these effects.

## 8. Overuse limits
| Effect | Per film (about 35 s) | Per 10 s | Spacing rules |
|---|---|---|---|
| 3D axis flip | 2 (choreographer) | neo-brutalist-ui: 2 per 35 s | never 3 identical transitions in a row; never on neighbouring resets |
| RGB glitch | 2 (choreographer) | holographic-wireframe 2; scifi-hud 1 | never with jitter in the same 20 frames; not on every beat |
| Stop-motion jitter | 2 placements (choreographer) | n/a | archival-grunge runs it all film on headline, notes and stamp only |
| Film gate | 1 layer, whole film | n/a | archival-grunge only; never above 0.08 |
- Limits scale with film length (choreographer rule 5): a 70 s film gets 4 glitches, not 2.
- Glitch and jitter are both "loud" primitives: keep 20 frames between them (choreographer rule 4).
- The climax impact frame may carry a flip or a glitch; nothing louder comes after it.

## 9. SFX sync
| Effect | SFX | Pre-roll | Onset |
|---|---|---|---|
| Axis flip | `card-flick` | 3 frames | `swapFrame - 3`; the peak is the edge-on frame (measured: frame 9 of 18, cue at 6) |
| RGB glitch | `static-zap` | 0 | `start` |
| Jitter | `stop-tick` | 0 | `start`, or every pose change at least 5 frames apart |
| Film gate | none | n/a | n/a |
Onset must sit within 2 frames of the visual peak (`EFFECT_SFX.syncTolerance`).

## 10. Anti-patterns
| Fails | Why | Instead |
|---|---|---|
| `Math.random()` in a jitter | each worker draws different poses; flicker on the seam | `rand(seed, pose)` |
| Jitter at 30 fps | reads as camera shake | 12 or 8 fps poses |
| Flip of even length sampled straight | blank edge-on frame | `flipSample` (built in) |
| Glitch longer than 10 frames | reads as a broken file, not a hit | 4 to 10 frames |
| Offset 20 px | the word stops being readable | 12 px cap |
| Gate flicker at 0.15 | a strobe | 0.07, cap 0.08 |
| Glitch on body text | the line cannot be read | title, canvas or hero only |

## 11. Checks
- [CHECK] Nothing here has been rendered. All numbers are from `node` runs of the compiled helpers.
- [CHECK] The 0.35 px no-repeat distance, the 2 frame band re-roll, the 1.4 band shift and the 6 pose
  scratch run are judgement calls, not tokens.
- [CHECK] The glitch `flip` mode alternates red and blue every frame (15 Hz). Its total brightness does not
  change, so it should not count as a flash under the 3 per second guideline; not tested with a flash analyser.
