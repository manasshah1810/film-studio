# Camera widgets 31-40

Ten camera-language and colour-grade micro-widgets in `components/widgets/camera/`. They give a code-drawn film a
post-production feel: a rack focus, a dolly zoom, a two-frame impact flash, a diagonal blade cut, a print look, a
magnifying lens, a before/after grade, a colour sampler, a file ingest and an icon strike. Each one draws itself from
the active style's `design-system.json`. Ids: RackFocus, ImpactFrame, DollyZoom, BladeSlice, FilmLook, LensRing,
GradeSlider, EyedropperGrade, FileDrop, IconStrike.

No widget uses a photograph or a video. The shot inside a widget is `Scene`, a code-drawn place (sky, ridge, skyline
with a landmark tower, a figure in a coat, a foreground edge). Text never sits on the shot: every label is on the card
or on an opaque plate, which is what `2-5d-parallax-depth` ("text on a blurred or moving plane") and `scifi-hud`
require.

## 1. The token contract
`cameraTokens(ds, paletteId, pairingId)` in `tokens.ts` is `dataTokens()` (see `widgets-data.md` section 1: `text`,
`label`, `accent`, `series`, `onSeries`, `grid`, `stroke`, `glow`, `num`, `labelMin`, `lab()`) plus the tokens below.
A widget reads only that object: no hex, no font name, no fixed blur, flicker or shake.

| Token | Read from | When the style lacks it |
|---|---|---|
| `blurOff` | largest `tokens.blur.z*` value (7 in 2-5d-parallax-depth) | 8 px |
| `rackFrames` | `tokens.blur.rack_frames` | 24 |
| `rack` | `motion.easings.rack`, else `focus` | the move easing |
| `whip` | `motion.easings.whip`, else `punch` | the move easing |
| `whipBlur` | `tokens.whip.blur_px` | 18 |
| `vignette` | `tokens.vignette.alpha` (or `doodle.board.vignette`) | 0.4 |
| `grain` | `paper.grain` or `tokens.grain`: freq, octaves, opacity (opacity capped at 0.3) | 0.85, 2, 0.14 |
| `flicker` | `paper.flicker` or `tokens.flicker`: fps, brightness, weave_px, specks, scratch_alpha | 12, 0.06, 1, 12, 0.16 |
| `impact` | `voxel.impact` or `tokens.impact`: frames, silhouette roles, shake_px, rays | 2 frames; sky `highlight`, rays `surface`, world `ink`, hero `surface`; shake 10, -8, 5, 0; 14 rays |
| `slam` | `motion.springs.slam`, else `stamp`, else `pop` | the style's pop spring |
| `strike` | first of `alert`, `highlight`, `primary` with 3:1 on `surface` | series 0 |
| `light` | `surface` lighter than `ink` (paper styles) | |
| `shade` | the darker of `bg` and `ink` (vignette, flicker, lens rim) | |

- Flicker brightness is capped at 0.08 for every style. archival-grunge forbids "flicker above 8 percent".
- Glow goes on marks only (focus brackets, lens rim, blade, strike ring, upload check), never on text.
- Resolved in the two rendered palettes:
  - `2-5d-parallax-depth` dusk-harbour: text and label `ink`, accent and series 0 `primary`, strike `highlight`,
    onSeries `bg`. blurOff 7 px, rack 24 frames on the rack easing.
  - `archival-grunge` newsprint: text and label `ink` on the paper (`surface`), accent and series 0 `primary`, strike
    `primary`, onSeries `surface`. Grain 0.26 multiply, flicker 7 percent at 12 fps, 1 px weave, 14 specks.

## 2. Shared props, parts and determinism
Every widget takes `{tk, frame, box, seed}` plus its content, as in `widgets-data.md` section 2.

- Widgets never call `useCurrentFrame`, `Math.random` or the clock. Seeded values (skyline, dust, weave, hex scramble)
  use Remotion `random(seed)`.
- Motion is spring or interpolation of the local frame: `rackP` (rack easing), `whipP` (whip easing), `slamP` (slam
  spring), `filmTick(f, fps)` (the film frame index at 12 fps), `shakeAt(px, f, at)`, plus the data and social helpers.
- Each file exports a constant (`RACK_FOCUS`, ...) with `frames`, `hero` and `sfx`. SFX ids come from
  `personas/sound-designer.md` section 2.
- `parts.tsx`:
  - `Scene`: the shot, in five layers (`sky`, `far`, `mid`, `subject`, `near`). Each layer takes `{blur, scale, x, y,
    opacity}` through `fx`. Each layer is drawn 60 px past every edge (`span` adds width for a layer that shrinks), so a
    blur or a scale never shows a transparent edge inside the viewport. `paint` turns it into a flat silhouette
    (impact frame); `night` swaps the sun for a moon; `hide` drops layers.
  - `SPOT`: the scene's landmarks as fractions (horizon, subject, tower, lit window, sun) for brackets, lens and samples.
  - `Viewport` (the clipped shot with a hairline frame), `Plate` (an opaque label plate on `surface`), `Brackets` (focus
    and lock corners), `halfPoly` and `polyCss` (a clip-path polygon for one side of a cut line).
- Keep the box inside the safe rectangle: `x` 6 or more, `x + w` 85 or less, `y` 8 or more, `y + h` 80 or less.

```tsx
import ds from '../../styles/2-5d-parallax-depth/design-system.json';
import {cameraTokens, RackFocus, type CameraJson} from './widgets/camera';
const tk = cameraTokens(ds as unknown as CameraJson, 'dusk-harbour', 'anton-dmsans-dmserif');
<Sequence from={240} durationInFrames={96}>
  <Local render={(f) => <RackFocus tk={tk} frame={f} box={{x: 8, y: 16, w: 76, h: 60}} label="FOCUS PULL"
    near="The courier at the gate" far="A light in the tower" seed="rack-1" />} />
</Sequence>
```
`Local` is any wrapper that passes `useCurrentFrame()` to `render`; `Sheet.tsx` has one (`Live`).

## 3. The widgets
Frames are local. "Compatible styles" lists the styles whose `style.md` names the widget; any built style can render it.

### 31 RackFocus
Focus pulls from the subject to the lit tower window over `rackFrames`. A plane's blur is its depth distance from the
focus times blurOff / 0.6, capped at blurOff, so no two planes blur the same. Glowing brackets travel with the focus;
the footer marks the focused subject and reads the focus distance (1.8 m to 12.0 m, tabular).

| Prop | Type | Default |
|---|---|---|
| `label`, `near`, `far` | string | |
| `rackAt` | frame | 20 |
| `swaps`, `hold` | 1 or 2, frames | 1, 30 (with 2, it racks back after `hold`) |

- Trigger: the story moves from one thing to the next.
- Compatible: 2-5d-parallax-depth, dark-neon-dataviz, glowing-plexus, holographic-wireframe.
- SFX: `zoom-swell` at `rackAt`, `click-soft` at `rackAt` + `rackFrames`.
- Length 96, hero 56.

### 32 ImpactFrame
A 5 percent push builds to `hitAt`. For `impact.frames` (2) frames the shot is a silhouette: sky in the impact sky
role with turning rays from the subject, world in the world role, subject in the hero role. The payoff word starts
its slam (1.7x to 1x on the slam spring) 5 frames early so it lands on the flash, then the shot shakes by
`impact.shake`. The word sits on an opaque plate.

| Prop | Type | Default |
|---|---|---|
| `word`, `label` | string | |
| `hitAt` | frame | 14 |

- Trigger: the payoff word, once per film (hormozi-kinetic), a hard landing (voxel-art).
- Compatible: hormozi-kinetic, voxel-art.
- SFX: `tactile-pop` at `hitAt` - 5, `sub-bass-hit` at `hitAt`.
- Length 60, hero 15 (the second flash frame).

### 33 DollyZoom
The camera pushes from `d0` to `d1` while the focal length falls with it (f = f0 x d / d0), so the subject keeps its
size and the world stretches away. A plane `gap` units behind the subject scales by (d / (d + gap)) / (d0 / (d0 + gap));
the foreground grows. Floor lines fan wider as the field of view opens. Fixed brackets on the subject prove it holds
size; the footer reads focal length, distance and subject scale.

| Prop | Type | Default |
|---|---|---|
| `label` | string | |
| `dollyAt`, `dollyFrames` | frame, frames | 12, 60 |
| `d0`, `d1`, `f0` | metres, metres, mm | 4, 1.6, 85 (ends at 34 mm) |

- Trigger: dread or a realisation, "and then it clicked".
- Compatible: 2-5d-parallax-depth, low-poly-isometric.
- SFX: `zoom-swell` at `dollyAt`, `sub-bass-hit` at the end.
- Length 96, hero 78.

### 34 BladeSlice
A blade of light runs along a diagonal cut on the whip easing, then the two halves of shot A slide apart along the
cut's normal and reveal shot B (the same place at night). The halves are clip-path polygons, so the cut edge stays
hard; each half carries a strike-colour rim on its cut face.

| Prop | Type | Default |
|---|---|---|
| `label`, `from`, `to` | string | |
| `angle` | degrees | -24 |
| `cutAt` | frame | 10 (blade 10 frames, split 22 frames) |

- Trigger: a hard change of time or place, before and after.
- Compatible: no style lists it yet; it fits any style with a whip easing.
- SFX: `fast-whoosh` at `cutAt` - 6, `tactile-pop` at `cutAt` + 10.
- Length 72, hero 24. The split runs on the style's whip easing; a style without one (archival-grunge) falls back to
  its move easing, which opens faster, so frame 24 shows the cut mid-split in both rendered styles.

### 35 FilmLook
A print look built up over the shot one layer at a time: gate weave, grain, flicker, vignette, dust, scratch. Each
layer re-rolls at the style's film rate (12 fps). Dust and scratch use the best text colour on the card, so they show on
paper and on a dark shot. A chip per layer lights as it switches on and shows its token value.

| Prop | Type | Default |
|---|---|---|
| `label` | string | |
| `onAt`, `each` | frame, frames | 8, 6 |

- Trigger: archive footage, the past, "always, on the last layer" in archival-grunge.
- Compatible: archival-grunge.
- SFX: `click-soft` per layer, `stop-tick` on the film rate.
- Length 90, hero 62.

### 36 LensRing
A lens pops open, travels to the lit window on an arc and, on the lock spring, magnifies `zoom` times inside the ring.
The lens is a second copy of the shot scaled about the lens centre and clipped to a circle, and it shows a figure in
the window that is too small to see at 1x. A rim gradient, a crosshair with a centre gap and a lock box sit on top.

| Prop | Type | Default |
|---|---|---|
| `label`, `caption` | string | |
| `zoom` | number | 2.2 |
| `moveAt`, `moveFrames` | frame, frames | 14, 36 |

- Trigger: one small detail matters.
- Compatible: holographic-wireframe, scifi-hud, tactical-vector-maps.
- SFX: `tactile-pop` at 4, `digital-tick` on lock, `click-soft` 10 frames later.
- Length 96, hero 82.

### 37 GradeSlider
Before and after on one shot. Left of the divider is the flat log look (a CSS filter on the shot only); right of it is
the shot in the style's own palette. The divider sweeps from 96 to 10 percent on the rack easing, then settles at
`rest` on the pop spring. LOG and GRADE plates hide when the divider covers them.

| Prop | Type | Default |
|---|---|---|
| `label`, `before`, `after` | string | LOG, GRADE |
| `log` | {sat, con, bri} | 0.3, 0.72, 1.1 |
| `rest`, `sweepAt` | 0..1, frame | 0.5, 16 |

- Trigger: before and after, raw against finished.
- Compatible: no style lists it yet; it fits any style with a card.
- SFX: `fast-whoosh` at `sweepAt`, `click-soft` when it settles.
- Length 96, hero 90.

### 38 EyedropperGrade
A ring cursor samples three points of the shot (the sun, the coat, the tower). The ring fills with each sample, a
swatch pops into the footer and its hex decodes from scrambled characters, one character every 2 frames, in tabular
mono. The values are the palette colours the shot is drawn with.

| Prop | Type | Default |
|---|---|---|
| `label` | string | |
| `names` | [string, string, string] | KEY LIGHT, COAT, TOWER |
| `at`, `each` | frame, frames | 10, 28 |

- Trigger: a colour or a value is sampled.
- Compatible: scifi-hud.
- SFX: `click-soft` per sample, `digital-tick` while a hex decodes.
- Length 110, hero 104.

### 39 FileDrop
A cursor drags a file (page, folded corner, extension badge) on an arc into a dashed drop zone. The zone lights while
the file hovers, the file lands on the pop spring, a bar fills with a tabular percent and size readout, and a check
draws on.

| Prop | Type | Default |
|---|---|---|
| `label`, `file`, `ext` | string | |
| `sizeMB` | number | |
| `zoneText` | string | DROP FOOTAGE HERE |
| `dragAt`, `dropAt`, `upFrames` | frame, frame, frames | 8, 40, 40 |

- Trigger: footage, a file or data goes in, "I fed it 600 MB of tape".
- Compatible: no style lists it yet; it fits any style with a card.
- SFX: `click-soft` at `dragAt`, `tactile-pop` at `dropAt`, `digital-tick` during upload, `notification-ping` at the end.
- Length 100, hero 94.

### 40 IconStrike
A line icon (`camera`, `film`, `mic`, `bell`, `play`, `heart`) pops in, then a ring and a slash draw over it in the
strike colour. A surface-coloured band under the slash cuts the icon, so the strike reads as a cut. The card shakes
once, the icon dims, the name is struck through and the verdict rises.

| Prop | Type | Default |
|---|---|---|
| `icon` | IconId | |
| `label`, `name`, `verdict` | string | |
| `strikeAt` | frame | 20 |

- Trigger: a rule, a thing ruled out, "no stock footage".
- Compatible: no style lists it yet; it fits any style with a card.
- SFX: `tactile-pop` at 4, `pen-scratch` at `strikeAt`, `sub-bass-hit` at `strikeAt` + 12.
- Length 72, hero 66.

## 4. Styles to avoid
- minimalist-doodle: a lens, a blur or a print look fights the flat marker board. Use its own widgets.
- neo-brutalist-ui: hard offset shadows and no blur token; RackFocus and FilmLook read soft there. FileDrop and
  IconStrike fit it.
- ImpactFrame more than once per film (hormozi-kinetic) or more than twice in 10 s (voxel-art).
- FilmLook outside archival-grunge only with intent: the grain and flicker change the whole frame's register.

## 5. Contact sheet and checks
- `CameraSheet` (5 x 2 cells, each widget frozen on its hero frame) and `CameraReel` (all 10 back to back, 888 frames)
  are registered in `components/Root.tsx`.
  - Props: `{style, palette, pairing}`; `CameraSheet` also takes `at`.
  - Defaults: 2-5d-parallax-depth, dusk-harbour, anton-dmsans-dmserif.
- `Sheet.tsx` exports `CAMERA_BOXES`. All sheet content is sample content and says so.
- Stills: `previews/camera-widgets/` at the repo root, both styles (2-5d-parallax-depth dusk-harbour, archival-grunge
  newsprint).
  - Pass 1 (`pass1-*.png`):
    - BladeSlice's hero frame came after the halves had left the frame, so the cut did not show. Its footer cut
      "Harbour, midnight" short.
    - FilmLook's chips were set at 21 px in three columns and crowded their values.
    - EyedropperGrade's third sample sat on the frame's bottom edge, which clipped the cursor.
    - Blur edges were clean in both styles: the 60 px layer bleed left no transparent fringe at the viewport edge.
      Wipe edges (BladeSlice halves, GradeSlider divider) were hard, with no blur on the cut.
  - Pass 2 (`pass2-*.png`):
    - BladeSlice hero moved to frame 24, where the cut is opening in both styles (archival-grunge has no whip easing
      and splits faster on its settle curve). The split travel dropped to 0.55 of the diagonal. Its footer is now two
      rows.
    - The FilmLook header label ran into the FPS readout; the header row now has a 24 px gap and the sample label is
      shorter.
    - FilmLook chips are two columns at `lab(tk, 0.72)`, and the header uses the mono label.
    - The third sample moved to the tower body.
- A storyboard mirror of these boxes, holding every text and fill pair the widgets draw, passes `check-design.js` and
  `check-safezones.js` in both rendered palettes. `check-design.js --systems` passes for all 12 styles.
- [CHECK] Only 2-5d-parallax-depth (dusk-harbour) and archival-grunge (newsprint) have been rendered. The other 10
  styles resolve tokens through the same code but nobody has looked at them.
- [CHECK] Only hero frames were inspected. The rack's mid-blur, the dolly's per-frame scale, the 12 fps flicker
  cadence and the hex scramble have not been checked frame by frame.
- [CHECK] CSS `blur()` cost grows with radius and layer size; a reel with several blurred layers has not been timed.
