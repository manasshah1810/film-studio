# Motion physics primitives

`components/motions/physics.ts` holds four deterministic helpers for tactile motion:

- `springPopIn`
- `elasticPullBackZoom`
- `gravityDropBounce`
- `squashStretchImpact`

They share the closed-form spring, three named presets and the SFX cue format. Each helper is a pure function of `frame`: no React hooks, no state, no `Math.random`. Any frame renders the same on any worker, in any order.

Use these instead of a CSS ease-in-out entrance. A plain ease has no mass: it starts and stops the same way for every object, and viewers read that as machine-made (see `references/ai-tells.md`). These helpers give every entrance three things:

- a calibrated overshoot,
- an anticipation that loads the move before it plays,
- a contact that changes the object's shape.

## 1. The spring, exactly

A spring released from rest at 0 towards 1, with `s = t / fps` seconds after release, has these parameters:

- `zeta = damping / (2 sqrt(stiffness * mass))` (damping ratio)
- `w0 = sqrt(stiffness / mass)` (natural frequency, rad/s)
- `wd = w0 sqrt(1 - zeta^2)` (damped frequency)

| Quantity | Formula (zeta < 1) |
|---|---|
| position | `x = 1 - e^(-zeta w0 s) (cos(wd s) + (zeta w0 / wd) sin(wd s))` |
| velocity | `x' = (w0^2 / wd) e^(-zeta w0 s) sin(wd s)` (divide by fps for units per frame) |
| first crossing of 1 | `s = (pi - atan(sqrt(1 - zeta^2) / zeta)) / wd` |
| k-th extreme | `s_k = k pi / wd` (odd k: overshoot above 1, even k: undershoot below 1) |
| first overshoot | `e^(-zeta pi / sqrt(1 - zeta^2))` |
| settle (`|1 - x| < 0.005` from then on) | scan back from the bound `ln(1 / (0.005 sqrt(1 - zeta^2))) / (zeta w0)` |

With `zeta >= 1`, the critically damped branch applies: `x = 1 - e^(-w0 s)(1 + w0 s)`. There is no overshoot.

This is the same model Remotion's `spring()` steps frame by frame (`remotion/dist/cjs/spring/spring-utils.js`), including the critically damped branch for `zeta >= 1`.

- **Verified:** `springValue(cfg, n)` matches `spring({frame: n, fps: 30, config: cfg})` within 3.3e-16 for all three presets over frames 0 to 89.
- **What that means:** a widget can mix the two freely, and the peak frames below are exact.

Exports:

| Export | What it gives |
|---|---|
| `springValue(cfg, t)` | position `t` frames after release |
| `springVelocity(cfg, t)` | velocity, in units per frame |
| `springParams(cfg)` | zeta, w0, wd |
| `springInfo(cfg)` | `{zeta, overshoot, cross, extremes[3], settle}`, frames at 30 fps |
| `held(frame, hold)` | quantises to twos (`hold: 2`) for the stepped styles |
| `resolveSpring(name or config)` | a preset name or a style's own spring, as a config |

## 2. Presets

All three sit inside the spring-overshoot band in `personas/motion-choreographer.md` (damping 10 to 14, stiffness 160 to 200). The figures are computed at 30 fps by `springInfo`.

| Preset | damping / stiffness / mass | zeta | overshoot | crosses 1 | peak (SFX frame) | undershoot | settled |
|---|---|---|---|---|---|---|---|
| `snappy` | 14 / 200 / 0.6 | 0.639 | 7.4 % | 4.84 | 6.71 (7) | 13.42 | 15 |
| `bouncy` | 10 / 180 / 0.8 | 0.417 | 23.7 % | 4.40 | 6.91 (7) | 13.82 | 24 |
| `heavy` | 14 / 160 / 1.2 | 0.505 | 15.9 % | 6.32 | 9.46 (9) | 18.92 | 24 |

- **snappy:** UI cards, captions, data labels, plates. One small overshoot, done in half a second.
- **bouncy:** characters, stickers, a win, a reaction. The second swing is visible, so use it once per beat.
- **heavy:** cards with weight, world-scale moves, the pull-back. It arrives later and settles at the same time as bouncy.

**Style springs come first.** When the style's `design-system.json` names a spring for the move, pass that config, not a preset. The style is a closed system. Some style springs, computed with `springInfo`:

| Style spring | config | zeta | overshoot | peak | settled |
|---|---|---|---|---|---|
| low-poly-isometric `pull_back` | 9 / 60 / 1 | 0.581 | 10.6 % | 14.95 | 36 |
| voxel-art `bounce` | 9 / 180 / 0.7 | 0.401 | 25.3 % | 6.42 | 23 |
| neo-brutalist-ui `gravity` | 7 / 220 / 1.1 | 0.225 | 48.4 % | 6.84 | 50 |

## 3. SFX cues

Every helper returns cues in the cue-sheet shape from `personas/sound-designer.md`:

```ts
{frame, sfx, peak, peak_frame, pre_roll}   // frame = peak_frame - pre_roll
```

- `peak_frame` is the frame the motion lands, rounded to the nearest frame. The contract is that `|onset - peak|` is 2 frames or less.
- Pre-rolls come from the sound-designer lookup: `zoom-swell` 9, `fast-whoosh` 6, everything used here 0.
- Add the helper's local frame to the panel's global start before writing the cue sheet.

| Helper | SFX | Peak frame |
|---|---|---|
| `springPopIn` | `tactile-pop` | `start + pi / wd` (the overshoot top) |
| `elasticPullBackZoom` | `zoom-swell`, 9 frame pre-roll | `release + pi / wd` (the undershoot bottom) |
| `gravityDropBounce` | `tactile-pop` (or `sub-bass-hit`, `stop-tick`, `click-soft`) | each contact; bounces under 12 px are silent |
| `squashStretchImpact` | same choice as the drop | `impactAt` |

`hold: 2` moves the peak to the first held frame at or after the true peak. For example, snappy's peak at 6.71 becomes frame 8.

**One sound per peak.** A drop plus a squash on the same contact makes two cues on one frame. Keep the drop's cue and drop the squash's.

## 4. springPopIn

```ts
const p = springPopIn(frame, {start: 12, spring: 'snappy', from: 0, fadeFrames: 3, rise: 0, hold: 1});
// style={{transform: `translateY(${p.y}px) scale(${p.scale})`, opacity: p.opacity}}
```

- `scale = from + (1 - from) x(f - start)`
- `opacity = clamp((f - start) / fadeFrames, 0, 1)`. It is linear and never overshoots, so a 1.07 scale never shows as an alpha above 1.
- `y = rise (1 - x)`: an optional lift that settles on the same spring.

**Example:** with defaults, frame 10 gives scale 1.018. The pop cue is `{frame: 7, sfx: 'tactile-pop', pre_roll: 0}`.

**Compatible styles:**
- every style with a pop-type spring:
  - hormozi-kinetic `pop`
  - dark-neon-dataviz `pop`
  - scifi-hud `pop`
  - 2-5d-parallax-depth `pop`
  - tactical-vector-maps `pop`
  - minimalist-doodle `pop`
  - neo-brutalist-ui `overshoot`
  - archival-grunge `stamp`
  - voxel-art `plate`
- voxel-art and minimalist-doodle animate on twos, so pass `hold: 2`.

**Use it for** arrivals, confidence and a win: the "spring overshoot" primitive, at most 4 per film (motion-choreographer). Word pops in kinetic captions are exempt.

**Avoid:**
- `from: 0` on body text. Pop the block and fade the text, so letters never render at 3 px.
- `bouncy` on data values, where the overshoot reads as a wrong number.
- Staggers shorter than 3 frames, which turn a row of pops into one wobble.

## 5. elasticPullBackZoom

```ts
const z = elasticPullBackZoom(frame, {start: 0, from: 1.15, to: 1, anticipation: 6, lean: 0.12, spring: 'heavy'});
// world layer: transform: `scale(${z.scale})`, transformOrigin at the subject
```

- **Anticipation**, for `f` in `[start, R)` where `R = start + anticipation` and `u = (f - start) / anticipation`:
  - `scale = from + lean (from - to)(3u^2 - 2u^3)`.
  - The camera leans further in, slows and stops. That is the wind-up.
- **Release**, for `f >= R`:
  - `scale = top + (to - top) x(f - R)`, where `top = from + lean (from - to)`.
  - The spring undershoots `to`, showing a little more of the world than its rest framing, then settles.
- `phase` is `hold`, `anticipate`, `release` or `settled`.

**Frames with the defaults** (heavy):

| Frame | 0 | 3 | 6 | 10 | 15 | 20 | 30 |
|---|---|---|---|---|---|---|---|
| Scale | 1.150 | 1.159 | 1.168 (release) | 1.062 | about 0.973 (bottom) | 0.993 | 1.001 |

The cue is `zoom-swell` with `peak_frame` 15 and `frame` 6, so the swell starts on the release.

**Compatible styles:**

| Style | Settings | Cue |
|---|---|---|
| hormozi-kinetic | from 1.15, `pullback` spring (12/150/1), first frame and each new beat, background layer only | |
| low-poly-isometric | from 1.55, its `pull_back` spring 9/60/1, start 62, `anticipation: 0` | peak 77, frame 68 |
| tactical-vector-maps | from 1.5 to 0.85 on its `elastic` spring (8/70/1); its style.md describes the overshoot to about 0.75 | |
| other styles | the `heavy` preset | |

**Use it for** a reveal, context or a new act. It is a transition: at most 2 per film (motion-choreographer), and hormozi-kinetic allows 2 per 35 s.

**Avoid:**
- Scaling the caption layer. Captions must stay pinned.
- A lean above 0.2, which reads as a glitch backwards.
- Anticipation longer than 10 frames, which stalls the beat.
- Chaining two pull-backs within 90 frames.

## 6. gravityDropBounce

```ts
const d = gravityDropBounce(frame, {start: 0, height: 600, fallFrames: 8, restitution: 0.35, bounces: 1});
// transform: `translateY(${d.y}px)`  (y is negative above the rest line)
```

- **Fall:** `y = -height (1 - (t / T)^2)` with `T = fallFrames`. This is constant acceleration from rest, the voxel-art rule `y = h (1 - t^2)`.
  - Gravity is `g = 2 height / T^2` px per frame squared.
  - Contact speed is `v0 = 2 height / T`.
- **Bounce `k`:**
  - leaves the floor at `v_k = v0 e^k`;
  - flies `2 T e^k` frames;
  - peaks `height e^(2k)` px above the floor.
- **Contacts:** `c_0 = start + T`, then `c_k = c_(k-1) + 2 T e^k`.
- **Outputs:** `vy` (px per frame, downward positive), `vImpact`, `contacts`, `lastContact` and `landed`.

**Frames with the defaults:**
- g = 18.75 px per frame squared and v0 = 150 px per frame.
- The first contact is frame 8. The bounce rises 73.5 px, peaking near frame 11 at -73.1, and lands at 13.6.
- Cues are tactile-pop at 8 and 14.

**Compatible styles:**

| Style | Settings |
|---|---|
| voxel-art | `fallFrames: 8`, `bounces: 0`, `hold: 2`. The style lands dead and squashes; a block falls 6 units, so `height = 6 x unit px`. |
| neo-brutalist-ui | Its recipe wants a 70 px rebound, so set `restitution = sqrt(70 / height)`, for example 0.265 for a 1000 px fall. Squash 0.06. |
| low-poly-isometric | Pins drop with this, without the stamp. |
| others | Cards and blocks only. |

**Use it for** a heavy thing arriving: a block, a card, a pin or a product.

**Avoid:**
- A drop under 6 frames, which reads as a cut.
- A drop over 14 frames, which reads as floating.
- A restitution above 0.5, which feels like rubber.
- Dropping text-heavy panels (the `impact-squash` row in `library/vfx/emphasis.json` says not on text panels).
- `sub-bass-hit` on any drop that is not the film's one impact frame.

## 7. squashStretchImpact

```ts
const d = gravityDropBounce(frame, opts);
const s = squashStretchImpact(frame, {impactAt: d.contacts[0], velocity: d.vy, vMax: d.vImpact, amount: 0.12, stretch: 0.1});
// transform: dropSquashTransform(d, s), transformOrigin: s.transformOrigin ('50% 100%')
```

- **Before contact:** `sy = 1 + stretch min(1, velocity / vMax)`. The object stretches along its fall as it speeds up.
- **From contact:** `sy = 1 - amount (1 - x(f - impactAt))`. It squashes fully on the contact frame, then the recovery spring brings it back. The spring's overshoot makes it briefly taller than rest, the rebound.
- **Width, set by `preserve`:**
  - `area`: `sx = 1 / sy`, for flat 2D shapes. Verified: `sx * sy = 1.0000` on every frame.
  - `volume`: `sx = 1 / sqrt(sy)`, for a 3D block scaled in x and z.
- **Origin `50% 100%`:** the base stays on the contact line. A centre origin sinks the object into the floor (voxel-art failure 15).

**Frames with the defaults plus the drop above:**

| Frame | 6 | 7 | 8 (contact) | 10 | 14 | 20 |
|---|---|---|---|---|---|---|
| sx / sy | 0.930 / 1.075 | 0.920 / 1.087 | 1.136 / 0.880 | 1.084 / 0.923 | 0.975 / 1.025 | 1.003 / 0.997 |

**Compatible styles:**

| Style | Settings |
|---|---|
| voxel-art | `amount: 0.22` (squash 0.78), `preserve: 'volume'` (1.13 wide, close to the style's 1.1), `hold: 2`, `spring: voxel bounce` |
| neo-brutalist-ui | `amount: 0.06`, `spring: 'snappy'`, `stretch: 0` |
| minimalist-doodle, hormozi-kinetic | Icons and stickers only, `bouncy`. |

**Use it for** contact: landings, stamps and button presses.

**Avoid:**
- An amount above 0.25. The object looks like it breaks.
- Squash on text, charts, maps or HUD frames. A data shape must keep its proportions, and the wireframe and HUD styles are rigid.
- Squash with no fall, stretch or press before it. Nothing earned the contact.
- Stretch on a slow object (set `vMax` to the real impact speed).

## 8. Anti-patterns

| Do not | Do |
|---|---|
| `interpolate` with an ease-in-out for an entrance | `springPopIn` with a named preset or the style's spring |
| `Math.random()` jitter in a curve | A seeded `random(seed)` from Remotion, outside these helpers |
| Re-implement a spring by integration with your own step | `springValue`, which is exact on any frame, including fractional ones |
| A pop opacity driven by the spring (an alpha overshoot) | The linear `opacity` from `springPopIn` |
| A guessed SFX frame ("about when it lands") | `sfx.peak_frame` from the helper, plus the panel's global start |
| A start-of-motion SFX for a swell | `frame = peak_frame - pre_roll`, so the swell's transient hits the peak |
| Every element on `bouncy` | One bouncy hero per beat; snappy or the style spring for the rest |
| `hold: 2` in a smooth style | A hold only where the style declares `stepped` (voxel-art, minimalist-doodle) |
| Scale about the centre on contact | `transformOrigin: '50% 100%'` |
| Pull-back on the caption layer | Pull-back on the world or background layer only |

## 9. Checks

**Done:**
- Run in node:
  - Spring values match Remotion's `spring()` within 3.3e-16 for all three presets.
  - The computed peaks match a frame scan (7, 7, 9).
  - The computed settles match a frame scan (15, 24, 24).
  - The squash keeps `sx * sy = 1`.
  - The drop contact frames match the table above.
- `tsc` on the components project is clean.

**[CHECK]:**
- None of the four helpers is wired into a widget or style Preview yet, so no frame has been rendered with them.
- The SFX pre-rolls are the sound-designer table's values; the real transient offsets of the audio files were not measured.
