# Motion: camera and velocity

How the virtual camera moves, and how every layer keeps moving between resets. Code:
`components/motions/camera.ts`. Laws: `personas/motion-choreographer.md` section 1 (a visual reset
every 105 frames or less) and section 2 (Zero Dead Velocity: no layer still for more than 45 frames).
Springs and impacts live in `references/motion-physics.md`; this file is the camera and the drift.

All helpers are pure functions of the frame. No state, no `Math.random`: seeds go through `seeded()`
(FNV-1a), so every worker renders the same frame.

## 1. Frame rate

| Item | Spec |
|---|---|
| Base rate | 30 fps. Every frame count in this file is at 30 fps. |
| Other rates | Pass `fps`. Frame counts scale by `fps / 30`; px per frame scale by `30 / fps`. Limits in px per second (`LIMITS.driftMin` 9, `driftMax` 20) convert with `perFrame(pxPerSec, fps)`. |
| On twos | `hold: 2` quantises the frame (`held()` from physics.ts). Use for voxel-art and minimalist-doodle. A held layer has zero velocity on every other frame; the 45 frame dead run still passes because the next held frame moves. |
| Velocity | `v = value(f + 1) - value(f)` per frame (the choreographer's definition). Scale counts as px at the frame edge: `vScale x 540` on a 1080 frame. |
| 12 fps texture | archival-grunge weave and grain re-roll at 12 fps (`filmTick` in camera tokens). That is texture, not camera; it does not count as ambient motion for a layer. |

## 2. Motion blur and smear

| Item | Spec |
|---|---|
| Shutter | 180 degrees: `blur = 0.5 x px moved this frame` (`shutterBlur`). |
| Speed | Central difference for blur: `v = cam(f + 0.5) - cam(f - 0.5)`, so the smear is centred on the frame's exposure. |
| Cap | 12 to 20 px (choreographer section 4). Default 16. `blurMax` is clamped to 20. |
| Floor | Under 0.5 px is dropped. Ambient drift (0.3 to 0.67 px per frame) never blurs: 0.5 x 0.67 = 0.33. |
| Axis | One axis only: SVG `<feGaussianBlur stdDeviation="{stdDeviation}"/>` with the helper's string, e.g. `"16.00 0"`. CSS `filter: blur()` is round and softens the cross axis; never use it for a whip. |
| Stretch | `1 + stretchMax x blur / blurMax` on the pan axis. Default `stretchMax` 0.06 (6 percent at full smear). |
| Text | Smear the planes, never a plate or caption (2-5d-parallax-depth: "a plate does neither"). Text rides on the incoming scene and lands sharp. |

## 3. Velocity ranges

| Motion | Range | Source |
|---|---|---|
| Ambient drift | 0.3 to 0.667 px per frame (9 to 20 px per second), default 0.4 | choreographer section 2: 0.3 floor, 20 px/s ceiling |
| Breathing scale | amplitude 0 to 0.015, period 90 frames or less, default 0.015 / 90 | 1.5 percent ambient ceiling; the persona's "1.00 to 1.02" row is above that ceiling, so the helper uses the ceiling |
| Parallax | front plane 0.5 px per frame, back half that | choreographer section 2 |
| Long dolly push | 220 px of Z over 180 frames: hero scale 1 to 1.186, edge speed up to 1.2 px per frame | 2-5d-parallax-depth `camera` |
| In-panel whip | 260 px in 10 frames: peak 80.5 px per frame at frame 5 | 2-5d-parallax-depth signature move |
| Scene whip | 1080 px in 10 frames: peak 334 px per frame at frame 5 | full-frame transition |
| Dead threshold | every channel under 0.01 px per frame | `maxDeadRun` default `eps` |

The drift helper clamps speed, breathing and period into these bands and reports `clamped: true`
when it did. A clamped result means the request broke the persona's rule; fix the request.

## 4. zeroDeadVelocityDrift

```ts
zeroDeadVelocityDrift(frame, {start, end, speed = 0.4, angle | seed, ease = 12, breathe = 0.015, period = 90, hold, fps})
-> {x, y, scale, vx, vy, vScale, speed, clamped, distance, transform}
```

Formula, with `D = end - start`, `E = ease`, velocity ramp `r(u) = 3u^2 - 2u^3`:

```
s(t) = E (u^3 - u^4 / 2)          t < E, u = t / E
s(t) = E / 2 + (t - E)             E <= t <= D - E
s(t) = (D - E) - s_ramp(D - t)     t > D - E
position = speed x s(t) x (cos a, sin a)       distance = speed x (D - E)
scale = 1 + breathe x (1 - cos(2 pi t / period)) / 2
```

Measured: `end 300`, angle 0, speed 0.4: x at frame 100 is 37.6 px, vx 0.400, total 115.2 px.
Longest dead run inside the drift is 1 frame (frame 0). After `end` the layer is at rest: the next
tween must start by `end + 45` or `maxDeadRun` fails (frames 300 to 400 report a 100 frame run).

Use on: every background, grid, map, plate group and headline between its entrance and its exit.
Avoid on: a layer already carried by a whip, a dolly or a spring that frame; text on twos in styles
that forbid baseline drift on body text (archival-grunge keeps body text still: drift the paper under it).

## 5. directionalWhipPan

```ts
directionalWhipPan(frame, {start, frames = 10, distance = span, direction = 'left', curve = CURVES.whip, blurMax = 16, shutter = 0.5, stretchMax = 0.06, hold, fps})
-> {p, cam, v, blur, stretch, stdDeviation, outgoing, incoming, swapFrame, peakFrame, peakV, landed, sfx}
```

`cam(t) = distance x bezier(whip, t / frames)`, whip = `[0.7, 0, 0.2, 1]`. The bezier is solved the
way Remotion's `Easing.bezier` is: maximum difference 3.7e-9 over 1001 samples of all four curves.
The incoming scene sits one span behind the outgoing one (a film strip), so with `distance = span`
it lands at 0. `direction` names where the content goes: `'left'` brings the new scene in from the right.

Scene whip, 1080 px, 10 frames, cap 16 (camera px / speed / smear):

| Frame | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| cam | 0 | 8.5 | 40.7 | 116.7 | 300.8 | 686.6 | 904.9 | 1002.2 | 1050.9 | 1073.7 | 1080 |
| v | 2.0 | 18.8 | 50.2 | 115.9 | 298.8 | 334.4 | 141.9 | 68.6 | 34.1 | 13.7 | 1.5 |
| blur | 1.0 | 9.4 | 16 | 16 | 16 | 16 | 16 | 16 | 16 | 6.9 | 0.7 |

`swapFrame` is 5: from that frame the incoming scene covers more of the frame, so a cut-on-blur whip
(render one scene only) swaps there. In-panel whip, 260 px: peak 80.5 px per frame at frame 5, smear
14 or more on frames 3 to 6, under 0.5 at frame 10, so the landing frame is sharp.

SFX: `fast-whoosh`, peak on the last frame of the pan (`start + frames`), pre-roll 6, so the file
starts at `start + frames - 6`. For a pan at frame 0 the cue is `{frame: 4, peak_frame: 10}`.

Use on: a change of place or subject, 3 per film at most (choreographer section 4), never three
transitions of the same kind in a row. Avoid on: a locked-camera style (section 8), a beat that is
quieter than the one before it in phase 2, and right next to a long fast push (2-5d-parallax-depth:
never both fast at once).

## 6. simulatedDollyPush

```ts
simulatedDollyPush(frame, {start, frames = 180, push = 220, perspective = 1400, z = 0, curve = CURVES.push | 'constant', hold, fps})
-> {p, d, scale, vScale, edgeV, transform, sfx}
```

A layer at `translateZ(z)` under perspective `P` draws at `P / (P - z)`. Pushing the camera by `d`
equals moving the layer to `z + d`, so at its rest size `scale(d) = (P - z) / (P - z - d)` with
`d = push x curve(t / frames)`. `push` is clamped below `P - z` (the camera may not pass the plane).

Measured at P 1400, push 220, frame 180: Z0 1.0853, Z1 1.1170, Z2 1.1864, Z3 1.3235: the 9, 12, 19
and 32 percent growth stated in 2-5d-parallax-depth's `continuous-z-push`. Edge speed peaks at 1.2 px
per frame, so a long push is ambient, not a reset.

A short push (30 frames or less) is a punch-in reset: `{frames: 20, push: 120}` reaches 1.0938, and gets
`zoom-swell` peaking on the landing frame with its 9 frame pre-roll (`{frame: 11, peak_frame: 20}`).
A long push gets no cue.

`curve: 'constant'` is linear and exists only for glowing-plexus, whose camera "never eases, stops or
cuts". Everywhere else linear is banned (choreographer: default fades and linear tweens are banned).

Use on: the whole film under a layered scene, a punch on the power word, a slow push during a hold.
Avoid on: a push that runs into the last beat, a push and a whip both fast at once, a push past 1.5
percent scale per second on a caption.

## 7. multiPlaneParallaxRig

```ts
multiPlaneParallaxRig({planes = DEPTH_PLANES, perspective = 1400, camX, camY, push, vx, vy, shutter, blurMax, frameW, frameH, bleed = {w: 1900, h: 2200}})
-> [{id, z, parallax, scale, x, y, blurX, blurY, stdDeviation, needW, needH, edgeSafe, transform}]
```

Per plane: `parallax k = P / (P - z - push)`, `scale = (P - z) / (P - z - push)`, `offset = -cam x k`,
`smear = shutterBlur(v x k)`, total blur on the moving axis `min(max(blurMax, b0), sqrt(b0^2 + smear^2))`,
`b0` on the other. A plane covers the frame while `needW = (frameW + 2 |x|) / scale` is within the bleed.

Feed it the other helpers at the same frame: `camX` from a whip's `cam` (signed by direction) or a drift's
`x`, `push` from a dolly's `d`, `vx` from the whip's `v`. Default planes are the 2-5d-parallax-depth
ladder Z0 -1400 / 3 px, Z1 -700 / 2 px, Z2 0 / 0 px, Z3 500 / 7 px.

| Plane | k at rest | x for cam 260 | need W | k at push 220 | blur at v 60, push 220 |
|---|---|---|---|---|---|
| Z0 | 0.500 | -130 | 1340 | 0.543 | 16.0 x, 3 y |
| Z1 | 0.667 | -173 | 1427 | 0.745 | 16.0 x, 2 y |
| Z2 | 1.000 | -260 | 1600 | 1.186 | 16.0 x, 0 y |
| Z3 | 1.556 | -404 | 1889 | 2.059 | 16.0 x, 7 y |

Every plane stays inside 1900 x 2200 for the 260 px whip. Z3 needs 1889 of its 1900: a longer in-panel
whip on Z3 shows an edge, so read `edgeSafe` before raising `distance`.

Use on: any scene with 2 or more planes. Avoid on: one flat plane (that is drift, not parallax), planes
whose parallax does not rise from back to front, a hero plane that is not the sharpest at rest.

## 8. Style pairing

All 12 styles are `requires: none`.

| Style | Drift | Whip | Dolly | Rig |
|---|---|---|---|---|
| 2-5d-parallax-depth | on plates, 0.3 px | 260 px, 10 f, x smear; 1 per 35 s | 220 px over the film, `push` | Z0 to Z3 defaults |
| hormozi-kinetic | captions breathe, never frozen 45 f | scene whips between beats, cap 12 to 20; 3 per 35 s | punch 1.00 to 1.06 on power words, 14 f settle | no |
| dark-neon-dataviz | the whole scene, `drift` curve | no (never a cut) | scale 1.00 to 1.03 over the film | no |
| glowing-plexus | no | no (never cuts) | `'constant'`, never eases | near nodes faster than far |
| tactical-vector-maps | map grid | map moves on `pan`, no smear on labels | zoom by coordinate | no |
| neo-brutalist-ui | workspace only | no: "the camera does not move" | workspace 1.00 to 1.03 | no |
| low-poly-isometric, voxel-art, holographic-wireframe, scifi-hud, minimalist-doodle, archival-grunge | layers only, on twos where the style is stepped | no: locked camera | no | no |

Locked-camera styles meet Zero Dead Velocity through their own loops (turntable, rings, boil, weave)
plus layer drift. The camera helpers are for the first five rows.

## 9. Anti-patterns

| Fails | Instead |
|---|---|
| A layer frozen between its entrance and exit | `zeroDeadVelocityDrift` from entrance to exit |
| A drift that ends with nothing after it | start the next tween by `end + 45` |
| Drift at 1 px per frame on a caption | 0.3 to 0.667 px per frame |
| `filter: blur()` on a whip | one-axis `feGaussianBlur` with `stdDeviation` |
| Smear on the landing frame | the landing frame is under 0.5 px, so it is sharp |
| Whip, whip, whip | whip, flip, whip, zoom (no three in a row) |
| Linear push in a non-plexus style | `CURVES.push` |
| A push and a whip both fast at once | one slow, one fast |
| All planes at the same parallax | parallax rising Z0 to Z3 |
| Camera moves in a locked style | drift the layers, keep the camera still |
| A gap of 110 frames between resets | a reset every 45 to 90 frames |

## 10. Enforcement and checks

- `maxDeadRun(sample, from, to, eps = 0.01)`: `sample(f)` returns the layer's channels in px (scale as
  `scale x 540`). Returns the longest run of frames where no channel moved, and `ok` when it is 45 or less.
- `visualResets(resets, total)`: counts frame 0, merges resets within 20 frames, and fails any gap over
  105, including the gap from the last reset to the end. Example: resets 45, 60, 150, 260 in 330 frames
  keep 0, 45, 150, 260 (60 merges into 45) and fail on 150 to 260 (110 frames).
- Verified: dolly growth matches the style's 9 / 12 / 19 / 32 percent; bezier matches Remotion to
  3.7e-9; drift dead run 1 frame; `tsc` clean under `components/tsconfig.json`.
- [CHECK] No widget calls these helpers yet, so no frame has been rendered with them; the smear and
  the plane edges are computed, not seen.
- [CHECK] hormozi-kinetic says the whip blur sits on the last 4 frames. With the `whip` bezier the speed
  peaks at frame 5 of 10, so a speed-driven smear covers frames 2 to 8. Confirm on a still which reads better.
- [CHECK] The 0.01 px dead threshold and the 540 px scale-to-edge conversion are this file's choices; the
  persona defines velocity but no threshold.
