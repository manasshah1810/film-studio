# Data widgets 21-30

Ten quantitative, time and technical micro-widgets in `components/widgets/data/`, used as visual proof for a number,
a share, a time span, a ranking or a piece of code. Each one draws itself from the active style's
`design-system.json`. In `dark-neon-dataviz` a number is a cyan display odometer with a capped glow on the marks. In
`scifi-hud` it is a mono readout on a hairline plate with 34 px labels. Ids: CloneRow, DayDial, OrbitRing, CodeBody,
Banknote, RunningList, PlayingGrid, GridCollapse, NLETimeline, Keycaps.

Every number on a widget comes from `script.json` with its `[VERIFY]` cleared, or is labelled as sample data on the
widget itself (the contact sheet does this: "SAMPLE", "Sample data", "not a real index"). Never present invented data
as real; this is the same rule as the forbidden list in `styles/dark-neon-dataviz/style.md`. Banknote draws a made-up
note marked "SPECIMEN · NOT LEGAL TENDER", never a real currency design.

## 1. The token contract
`dataTokens(ds, paletteId, pairingId)` in `tokens.ts` is `socialTokens()` (see `widgets-social.md` section 1) plus the
tokens below. A widget reads only that object: no hex, no font name, no fixed stroke, radius or glow.

| Token | Read from | When the style lacks it |
|---|---|---|
| `text` | `ink` if it reaches 4.5:1 on `surface` | the best of `bg` and `surface` on `surface` |
| `label` | `muted`, else `dim`, if it reaches 4.5:1 on `surface` | `text` |
| `accent` | first of `primary`, `highlight` with 4.5:1 on `surface` | `text` |
| `series` | two mark colours: first of `primary`, `highlight`, `alert` with 3:1 on `surface`, then a second distinct one | `ink` |
| `onSeries` | `tk.on(series[0])` | |
| `grid` | `tokens.grid` or `tokens.ground.grid` (role and alpha) | `primary` mixed 16% into `surface`, else the line colour |
| `stroke` | `tokens.stroke` hair, line, heavy; else `tokens.line.width` | line = border width x 2 (at least 4) |
| `glow(hex)` | `tokens.glow` inner, outer, outer_alpha (or blur, alpha), capped at `max_radius` 28 | `'none'` |
| `num` | `mono` when `numerals.rule` says mono, else `display`; always tabular | `display` |
| `numeral` | `type_scale.numeral`, capped at 140 | `type_scale.display`, else 108 |
| `labelMin` | `hud.readout.label_px` (34 in scifi-hud) | 0 |
| `plateR` | `tokens.plate.radius` | the style radius |
| `draw`, `roll` | `motion.easings.draw`; `roll`, else `settle` | the move easing |
| `lock` | `motion.springs.lock`, else `pulse` | the style's pop spring |

- Numerals are always tabular: `TAB` sets `font-variant-numeric: tabular-nums` and `"tnum" 1`, and `numCss()` applies
  it in the numeral font. Every changing number uses it, so digits never shift as they count.
- `lab(tk, k)` gives a small label size: `size.label x k`, never under `labelMin`. Every label, axis tick, track name
  and code line uses it, so scifi-hud's "no label under 34 px" holds.
- Glow goes on marks only (rings, arcs, bars, lit cells, keys), never on text. Both styles forbid glow on text.
- Text lives on the card (`surface`). Text on a fill (the active clip, a pressed key) uses `onSeries`.
- Resolved in the two rendered palettes:
  - `dark-neon-dataviz` obsidian-cyan: text and label `ink` (15.15:1), accent and series 0 `primary` (9.88:1),
    series 1 `highlight` (5.56:1), onSeries `bg` (10.89:1). Numerals in the display font.
  - `scifi-hud` cyan-ops: text and label `ink` (15.87:1), accent and series 0 `primary` (9.65:1), series 1 `highlight`
    (11.38:1), onSeries `bg` (10.93:1). Numerals in mono, labels at least 34 px.
  - Neither focused palette has `muted` or `dim`, so `label` falls back to `text`.

## 2. Shared props, parts and determinism
Every widget takes `{tk, frame, box, seed}` plus its content. `tk`, `frame` and `box` work as in `widgets-social.md`
section 2. `seed` fixes seeded layouts (PlayingGrid levels, GridCollapse survivors, Banknote guilloche).

- Widgets never call `useCurrentFrame`, `Math.random` or the clock. Seeded values use Remotion `random(seed)`.
- Motion is spring or linear interpolation of the local frame: `drawP` (draw easing), `rollP` (roll easing), `lockP`
  (lock spring), plus the social `enterP` and `popP`.
- Each file exports a constant (`CLONE_ROW`, ...) with `frames` (length), `hero` (the frame that best shows it on a
  still) and `sfx` (cue points).
- `tokens.ts` also exports `fmt(n, dec)` (en-US grouping), `hhmm(hours)`, and `timecode(frames)` (HH:MM:SS:FF at 30 fps).
- `parts.tsx` holds the shared pieces:
  - `Card`: the style's card on `surface`, clipped to w x h.
  - `Label`: mono, uppercase, 0.12em tracking, tabular, `label` colour, `lab(tk, 0.82)`.
  - `Odometer`: one 1ch column of 0-9 per digit that rolls, with carries. At p = 1 every column sits exactly on the
    final digit. A leading column that is not needed fades and closes its width (over a 1.33x band below its power of
    ten), so "$62" sits flush where "$100" stood.
  - `arc(cx, cy, r, a0, a1)` and `polar(cx, cy, r, a)`: degrees, 0 at 12 o'clock, clockwise.
- Keep the box inside the safe rectangle: `x` 6 or more, `x + w` 85 or less, `y` 8 or more, `y + h` 80 or less.

```tsx
import ds from '../../styles/dark-neon-dataviz/design-system.json';
import {dataTokens, OrbitRing, type DataJson} from './widgets/data';
const tk = dataTokens(ds as unknown as DataJson, 'obsidian-cyan', 'grotesk-inter-jb');
<Sequence from={120} durationInFrames={90}>
  <Local render={(f) => <OrbitRing tk={tk} frame={f} box={{x: 8, y: 16, w: 76, h: 60}} value={72}
    label="GRID LOAD" caption="Peak hour, 2024" seed="orbit-1" />} />
</Sequence>
```
`Local` is any wrapper that passes `useCurrentFrame()` to `render`; `Sheet.tsx` has one (`Live`).

## 3. The widgets
Frames are local. SFX ids come from `personas/sound-designer.md` section 2. "Compatible styles" lists the styles whose
`style.md` names the widget; any built style can render it.

### 21 CloneRow
One unit cloned into a grid ("3 in 10"). The units stamp in one by one, then the counted ones fill with series 0 and
glow while the odometer rolls from 0 to `hit`. The caption fades in last.

| Prop | Type | Default |
|---|---|---|
| `count`, `hit` | number | `hit` of `count` units light |
| `unit` | `square`, `circle`, `coin`, `bar` | `square` |
| `label`, `caption` | string | |
| `perRow`, `hitAt` | number, frame | 5, 34 |

- Trigger: a share or a ratio, "1 in 4", "3 of every 10".
- Compatible: dark-neon-dataviz.
- SFX: `tactile-pop` per unit at 6 + 2i, `digital-tick` per lit unit from `hitAt`.
- Length 90, hero 82.

### 22 DayDial
A 24-hour dial with 96 ticks and 00/06/12/18 outside the ring. The hand sweeps from `from` to `to` over 48 frames; the
arc between them draws with a glow. The centre reads the clock time and the elapsed span ("7H 45M"); the footer gives
the caption and the range.

| Prop | Type | Default |
|---|---|---|
| `from`, `to` | hours (decimal, 0-24, wraps past midnight) | |
| `label`, `caption` | string | |
| `sweepAt` | frame | 18 |

- Trigger: a schedule, a shift, sleep, "he worked from 4 a.m. to 9 p.m.".
- Compatible: low-poly-isometric, tactical-vector-maps, voxel-art.
- SFX: `pen-scratch` at `sweepAt`, `click-soft` at `sweepAt` + 48.
- Length 90, hero 84.

### 23 OrbitRing
A gauge. The outer tick ring turns slowly anticlockwise and a dashed inner ring clockwise. The gauge arc fills to
`value`% over 56 frames with a series 1 dot at its tip, while the centre odometer rolls to the value.

| Prop | Type | Default |
|---|---|---|
| `value`, `dec` | percent, decimals | 0 decimals |
| `label`, `caption` | string | |
| `fillAt` | frame | 16 |

- Trigger: a percentage, a load, a completion rate, "72% of the grid".
- Compatible: dark-neon-dataviz, glowing-plexus, holographic-wireframe, scifi-hud, tactical-vector-maps.
- SFX: `digital-tick` at `fillAt`, `tactile-pop` at `fillAt` + 56.
- Length 90, hero 84.

### 24 CodeBody
An editor pane. The header shows the file name and a live "LN xx COL xx". Code types in at `cps` characters per frame
with a block cursor, tabular line numbers and token colours (keywords, strings, numbers, comments, calls). When typing
ends, a focus band sweeps across line `focus`.

| Prop | Type | Default |
|---|---|---|
| `file` | string | |
| `lines` | string[] | 6 to 10 short lines |
| `focus` | line index | none |
| `typeAt`, `cps` | frame, chars per frame | 8, 2.2 |

- Token colours: keywords `primary`, strings and numbers `highlight`, comments `label`, the rest `text`. A colour under
  4.5:1 on `surface` falls back to `text`.
- Trigger: "one line of code", a bug, an algorithm, a formula.
- Compatible: holographic-wireframe, scifi-hud.
- SFX: `digital-tick` per character from `typeAt`, `click-soft` at done + 6.
- Length 120, hero 114.

### 25 Banknote
A made-up note (guilloche, rosette, "SPECIMEN · NOT LEGAL TENDER") slides in. Its value rolls from `from` to `to` while
a clip line drains the lost share of the note into a dashed outline, and "−N%" counts up beside the odometer.

| Prop | Type | Default |
|---|---|---|
| `from`, `to`, `dec` | number | 0 decimals |
| `symbol` | string | |
| `label`, `caption` | string | |
| `years` | [string, string] | |
| `shiftAt` | frame | 36 |

- The fine print drops its tracking from 0.2em to 0.04em when the label floor would make it wider than the note.
- Trigger: inflation, purchasing power, "what 100 buys now".
- Compatible: dark-neon-dataviz, low-poly-isometric, voxel-art.
- SFX: `cash-rustle` at 4, `digital-tick` at `shiftAt`, `sub-bass-hit` at `shiftAt` + 40.
- Length 100, hero 94.

### 26 RunningList
A ranked list whose values run through keyframes. Each row is a tabular rank, a label above a pill bar, and a tabular
value. Rank is a smooth function of the values (smoothstep over 4% of the max), so an overtake is a slide, not a jump.
The leader's bar fills with series 0 and glows. The header shows the period and RUNNING, then FINAL.

| Prop | Type | Default |
|---|---|---|
| `title`, `unit` | string | unit empty |
| `rows` | {label, values: number[]}[] | same keyframe count in each row |
| `periods` | [string, string] | |
| `runAt`, `runFrames`, `dec` | frame, frames, decimals | 16, 84, 0 |

- Trigger: a ranking that changes over time, "who overtook whom".
- Compatible: minimalist-doodle.
- SFX: `digital-tick` at `runAt`, `click-soft` on each overtake.
- Length 120, hero 116.

### 27 PlayingGrid
A calendar grid (default 20 x 7) of activity levels 0-4. A playhead sweeps the columns; cells light as it passes and
the running total (tabular, grouped) grows with the level sum played. A legend and month marks sit below.

| Prop | Type | Default |
|---|---|---|
| `label`, `unit`, `caption` | string | |
| `total` | number | the value at the end of the sweep |
| `levels` | number[] (0-4) | seeded from `seed` |
| `cols`, `rowsN` | number | 20, 7 |
| `marks` | string[] | none |
| `playAt`, `playFrames` | frame, frames | 14, 66 |

- Trigger: a streak, a habit, daily activity, "every day for 20 weeks".
- Compatible: glowing-plexus, low-poly-isometric, voxel-art.
- SFX: `digital-tick` at `playAt`, `click-soft` at `playAt` + `playFrames`.
- Length 100, hero 94.

### 28 GridCollapse
A 10 x 10 grid. The seeded survivors light up; the rest shrink and fall over 30 frames while the count rolls from the
grid size to `keep` (no grouping). The survivors then gather into a centred row and pop.

| Prop | Type | Default |
|---|---|---|
| `keep` | number | survivors |
| `cols`, `rowsN` | number | 10, 10 |
| `label`, `caption` | string | |
| `collapseAt` | frame | 28 |

- Trigger: survival and failure rates, "7 of 100 are still standing".
- Compatible: dark-neon-dataviz, glowing-plexus, scifi-hud.
- SFX: `static-zap` at `collapseAt`, `digital-tick` at `collapseAt` + 30, `tactile-pop` at `collapseAt` + 52.
- Length 110, hero 104.

### 29 NLETimeline
An edit timeline. A year ruler sits over tracks V2, V1 and A1; clips pop in, then a series 1 playhead scrubs from the
first year to the last. The year readout and an SMPTE timecode run with it, and each clip fills with series 0 and
glows while the playhead is inside it.

| Prop | Type | Default |
|---|---|---|
| `title` | string | |
| `span` | [year, year] | |
| `clips` | {label, start, end, track}[] | a clip needs about 6 label characters of width |
| `tracks` | string[] | V2, V1, A1 |
| `scrubAt`, `scrubFrames` | frame, frames | 30, 66 |

- The tick step is the first of 1, 2, 5, 10, 20, 25, 50 years that gives about 8 ticks and keeps 4-digit labels apart
  at the label size. Ticks sit on multiples of the step.
- Trigger: a life or company story told as an edit, "the arc from garage to crash to rebuild".
- Compatible: no style lists it yet; it fits any style with a dark `surface`.
- SFX: `card-flick` as each clip builds, `click-soft` as the playhead enters a clip.
- Length 110, hero 104.

### 30 Keycaps
A shortcut or a typed number as physical keys. Caps pop in, separated by "+", then each one presses down in turn on the
style's spring: the top face drops into its side wall and fills with series 0. The result line rises after the last key.

| Prop | Type | Default |
|---|---|---|
| `keys` | string[] | a key longer than 2 characters is 1.5 units wide |
| `label`, `result` | string | |
| `pressAt`, `each` | frame, frames | 24, 8 |
| `holdAll` | boolean | true (keys stay down) |

- Trigger: a shortcut, a command, "one keystroke undid it".
- Compatible: no style lists it yet; it fits any style with a card.
- SFX: `click-soft` per key at `pressAt` + i x `each`, `notification-ping` at the end + 4.
- Length 90, hero 72.

## 4. Styles to avoid
- archival-grunge and minimalist-doodle (except RunningList): a glowing odometer on paper reads as a screen, not
  print. Use the editorial widgets (`widgets-editorial.md`) there.
- hormozi-kinetic: its numbers are full-frame kinetic type; a card-sized widget reads small next to them.
- low-poly-isometric and voxel-art: widgets are flat DOM over a 3D world. Place them on a plate, never in the scene.

## 5. Contact sheet and checks
- `DataSheet` (5 x 2 cells, each widget frozen on its hero frame) and `DataReel` (all 10 back to back, 1020 frames)
  are registered in `components/Root.tsx`.
  - Props: `{style, palette, pairing}`; `DataSheet` also takes `at`.
  - Defaults: dark-neon-dataviz, obsidian-cyan, grotesk-inter-jb.
- `Sheet.tsx` exports `DATA_BOXES`, the box of each widget on the sheet. All sheet content is sample data and says so.
- Stills: `previews/data-widgets/` at the repo root, both styles (dark-neon-dataviz obsidian-cyan, scifi-hud cyan-ops).
  - Pass 1 (`pass1-*.png`):
    - The Odometer left a gap where an unneeded leading column faded but kept its width ("$ 62", " 7").
    - Scifi labels rendered at 22-28 px, under the style's 34 px floor.
    - The "Crash" clip was cut off, and CodeBody, RunningList and PlayingGrid had empty card space.
  - Pass 2 (`pass2-*.png`):
    - Leading columns now collapse.
    - `labelMin` and `lab()` hold every label at 34 px or more in scifi-hud.
    - The NLETimeline tick step widens so years never touch.
    - The Banknote fine print tightens to fit.
    - The three boxes were fitted to their content.
    - Numerals line up in every widget; all labels are legible in both styles.
- A storyboard mirror of these boxes, holding every text and fill pair the widgets draw, passes `check-design.js` and
  `check-safezones.js` in both rendered palettes. `check-design.js --systems` passes for all 12 styles.
- [CHECK] Only `dark-neon-dataviz` (obsidian-cyan) and `scifi-hud` (cyan-ops) have been rendered. The other 10 styles
  resolve tokens through the same code but nobody has looked at them.
- [CHECK] Only hero frames were inspected. The Odometer's width change around a power of ten, the RunningList
  overtake slide and the CodeBody cursor have not been checked frame by frame.
- [CHECK] The mono advance of 0.6-0.62em used to fit NLETimeline ticks and the Banknote fine print matches JetBrains
  Mono and Share Tech Mono on these stills; a much wider mono face may still overflow.
