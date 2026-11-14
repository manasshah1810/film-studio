# Motion: text and data reveals

Code: `components/motions/text-data.ts`. Four deterministic helpers that turn a headline or a number into an
event, instead of a static opacity fade: `hackerDecodeScramble`, `odometerNumberRoll`, `svgPathDrawOn`,
`activeWordHighlight`. Each takes the frame number and returns plain values (strings, transforms, dash values,
states) plus an `sfx` cue list. No state, no `Math.random`, so a still of frame N is the same on every worker.

Rules this file follows: `personas/motion-choreographer.md` section 4 (decode resolves over 20 frames, odometer is
stepped per digit column, draw-on is `stroke-dashoffset` from length to 0, randomness is seeded, 3 of each per
35 s film) and `personas/sound-designer.md` section 1 (onset within 2 frames of the visual peak, one sound per
peak). Frame rate is 30 fps; every helper takes `hold` (2 = on twos) for stepped styles.

```ts
import {hackerDecodeScramble, odometerNumberRoll, svgPathDrawOn, activeWordHighlight} from '../motions/text-data';
const f = useCurrentFrame();
const d = hackerDecodeScramble(f, {text: 'ACCESS GRANTED', start: 12, seed: 'p3-title'});
const o = odometerNumberRoll(f, {to: 2013, start: 30, cellPx: 200 * 1.12});
const p = svgPathDrawOn(f, {path: LINE_D, start: 20, frames: 80, strokeWidth: 9});
const h = activeWordHighlight(f, {words: captions, power: [3]});   // captions from @remotion/captions
```

## 1. Flicker-free, defined

| Primitive | Flicker it prevents | How |
|---|---|---|
| Decode | glyphs changing every frame (unreadable noise) | a scrambled glyph holds `step` = 2 frames (15 changes a second) |
| Decode | a character shows its real letter, then scrambles again | the glyph is nudged off the target until its lock frame |
| Decode | the line reflows as glyph widths change | letters scramble inside their class (A-Z, a-z, 0-9); `symbols` = 0 for proportional fonts; mono is best |
| Odometer | a column strobing (random digit each frame) | no column moves more than `maxCells` = 1.5 cells a frame; faster rolls spin a shorter path |
| Odometer | landing between two digits | both paths are exact integers at the end frame (tested for 18 targets) |
| Draw-on | a round-cap dot at p = 0, a cap stub after p = 1 | the dash gap is padded by `strokeWidth` |
| Highlight | a block lit for 1 to 3 frames | words within `minHold` = 6 frames of a group's first word light together |
| Highlight | the block blinking off between two words | gaps of `bridge` = 6 frames or less are held lit |

## 2. hackerDecodeScramble: character-step formula

Characters that scramble: letters and digits (punctuation with `scramblePunctuation`). Spaces never scramble.
With `m` scrambling characters ranked `r = 0..m-1` in lock order:

```
lockFrame(r)  = start + lead + round((frames - lead) * (r + 1) / m)
s             = floor((f - start) / step)                 step index, holds `step` frames
pool          = class pool of the target (A-Z, a-z, 0-9), or symbols with chance `symbols` (letters only)
glyph(i, s)   = pool[floor(rand(seed, i, s) * |pool|)]    then +1 (mod |pool|) while it equals the target
                                                           or glyph(i, s - 1); at most 3 nudges
ch(i, f)      = target            if f >= lockFrame
              = glyph(i, s)       otherwise
text(f < start) = spaces of the same length (the width is reserved, nothing shows)
```

Defaults: `frames` 20 (choreographer), `lead` 4, `step` 2, `order` `'ltr'`, `symbols` 0.2. Orders: `ltr`
(scifi-hud: "characters lock left to right"), `rtl`, `center-out`, `random` (seeded permutation).

Measured, `ACCESS GRANTED`, seed `s1`, start 0:

| Frame | Text | Locked |
|---|---|---|
| -1 | 14 spaces | 0 / 13 |
| 0 and 1 | `F#JW&O J$WVRR%` (same: holds 2 frames) | 0 / 13 |
| 4 | `?BFWLT AKBI*FJ` | 0 / 13 |
| 8 | `ACCA/< PHO>MNZ` | 3 / 13 |
| 12 | `ACCESS R&P!=@E` | 6 / 13 |
| 16 | `ACCESS GRAN!$E` | 10 / 13 |
| 20 | `ACCESS GRANTED` | 13 / 13 |

Lock frames 5, 6, 8, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20. Glyph changes on odd frames: 0. Target shown before
its lock: 0. A digit string (`2013`) scrambles only through digits, so tabular width holds.

Pass the live value, not a final one, when the text is a ticking readout (scifi-hud recipe 5): a locked character
shows whatever `text` is on that frame.

## 3. odometerNumberRoll: digit-strip formula

The value runs on the curve, scaled to an integer by `10^decimals`:

```
e(f)  = bezier(curve, clamp((f - start) / frames))           curve default `roll` [0.22, 1, 0.36, 1]
V(f)  = |from| * 10^dec + (|to| - |from|) * 10^dec * e(f)
q_k   = V / 10^k            column k, k = 0 is the last digit shown
r_k   = V - floor(q_k) * 10^k
```

**Stepped strip** (default, choreographer "stepped per digit column", dark-neon-dataviz "each rolls on the second
half of its step"):

```
pos_k = floor(q_k) + smoothstep(clamp((r_k - (10^k - 0.5)) * 2))      smoothstep(x) = x^2 (3 - 2x)
```

Every column rolls during the last half unit before it changes, in step with the units rolling 9 to 0. For
k = 0 this is the dark-neon recipe `floor + smooth((frac - 0.5) * 2)`. The recipe's `frac(q_k)` for k > 0 is
wrong: 0 to 4.75 with 2 decimals lands at "5.75" (the hundreds column stops half rolled whenever the lower digits
are 5 or more). This file uses `r_k` instead.

**Carry strip** (`strip: 'carry'`, the Odometer widget in `components/widgets/data/parts.tsx`):

```
pos_0 = q_0;   pos_k = floor(q_k) + max(0, (pos_(k-1) mod 10) - 9)
```

**Strip and window.** One 11-cell strip per column: `0 1 2 3 4 5 6 7 8 9 0`, window one cell tall,
`overflow: hidden`, tabular numerals, column width 1ch.

```
translateY_k  = -(pos_k mod 10) / 11 * 100 %         of the strip's own height
digit_k       = round(pos_k mod 10) mod 10
visible_k     = 1 for k <= decimals, else clamp((V / 10^k - 0.5) / 0.5)     leading zeros fade, width too
```

**Spin path (anti-strobe).** If any column of the true path moves more than `maxCells` = 1.5 cells in one frame,
every column spins on the shared curve instead, so slow high columns cannot lag and show a wrong number:

```
d0, d1 = start and final digit of the column;   dir = sign(to - from)
r      = ((d1 - d0) * dir) mod 10
T      = r + 10 * max(0, floor((maxCells / max_f(e(f + 1) - e(f)) - r) / 10))
pos    = d0 + dir * T * e(f)
```

Measured, 0 to 2013 over 45 frames, `roll` curve: peak `e` step 0.098 a frame, so travel 12 / 10 / 11 / 13 cells
(thousands to units), peak 1.28 cells a frame, all columns settle on frame 38, exact 2,013 from frame 30.

| Frame | Shown | Units cells / frame | Blur px (cell 100 px) |
|---|---|---|---|
| 0 | 0 | 1.28 | 16 (cap) |
| 10 | 9,789 | 0.50 | 16 |
| 20 | 1,902 | 0.12 | 6.06 |
| 30 | 2,013 | 0.02 | 1.18 |
| 38 to 45 | 2,013 | 0 | 0 |

While spinning the shown digits are a slot machine, not the value: 0 to 2013 reads backwards on 2 frames.
Slow rolls keep the true path: 1995 to 2005 and 2010 to 2013 never spin and never read backwards.
To keep a readable tick (scifi-hud `ALT` 12,000 to 13,152), lengthen `frames` until no column passes 1.5 cells.
`from` and `to` must share a sign; a roll that crosses zero throws (stop and report).

**Blur.** `blur = min(blurMax 16, 0.5 x rate x cellPx)`, 0 under 0.5 px, vertical only:
`<feGaussianBlur stdDeviation={col.stdDeviation} />` (`"0 b"`). Set `cellPx` to font size x line height.

## 4. svgPathDrawOn: stroke-dashoffset formula

```
L      = getLength(d)            @remotion/paths, deterministic; or pass the length in px
p      = bezier(curve, clamp((f - start) / frames))           curve default dark-neon `draw` [0.45, 0, 0.2, 1]
pad    = strokeWidth             0 for butt caps
strokeDasharray  = "L  L + 2 pad"
strokeDashoffset = (L + pad) * (1 - p)          reverse: -(L + pad) * (1 - p)
drawn  = L * p;   tip = drawn (reverse: L - drawn), feed it to getPointAtLength for a pen head
speed  = L * (p(f + 1) - p(f))   px per frame
```

Why the pad: a round or square cap reaches `w / 2` past each dash end. At p = 0 the dash spans
`[-(L + w), -w]` and the next dash starts at `L + w`, so neither cap reaches the path. At p = 1 the dash is
exactly `[0, L]`. Measured, 600 px line, width 9, 40 frames: offset 609 at frame 0, 494.7 at 10, 144.8 at 20,
0 at 40; peak pen speed 33.4 px a frame near frame 10.

Do not use `vector-effect="non-scaling-stroke"` on a draw-on path (minimalist-doodle failure 8): it breaks the
length and the stroke shows at t 0. A `pathLength = 1` path works too: pass `path: 1` and `strokeWidth: w / L`.

Style durations: dark-neon-dataviz data line 80 frames; minimalist-doodle `L / 45` frames clamped to 4 to 16,
strokes in pen order starting 2 frames before the last ends; archival-grunge marker 24 frames. Default here 40.

## 5. activeWordHighlight: word timing formula

Input is `{text, startMs, endMs}[]`, the `Caption` shape from `@remotion/captions`, so Whisper or ElevenLabs
word timestamps pass straight in.

```
on_i   = round(startMs_i / 1000 * fps) - lead                    lead default 0 (hormozi: "on its spoken frame")
group  = words whose on_i is under minHold (6) frames after the group's first word
off_g  = max(round(endMs_last / 1000 * fps) - lead, on_first + minHold)
         = on_next   when on_next - off_g <= bridge (6)          no blink between words
         <= on_next  always                                      groups never overlap
state  = future (f < on_i), active (on_i <= f < off_g), past
t      = bezier(punch [0.16, 1, 0.3, 1], (f - on_i + 1) / swipe)  swipe default 4 frames; 0 unless active
```

Measured, "You are losing $4,000 every month": `You` 0-8 and `are` 5-8 share group 0 (onsets 5 frames apart),
`losing` 8-21, `$4,000` 21-45 (the 0.2 s pause after it is bridged), `every` 45-53, `month` 53-66. Frames
with no active word inside the line: 0. `t` is 0.83 on the onset frame and 1 by frame 2.

The widget maps `t` to the block width or colour mix, `state` to colour (hormozi: active `primary` block, past
power word stays `primary`, past normal word returns to `ink`), and `power` to the `highlight` block at scale 1.1.
At most 4 words lit at once (hormozi rule 5); `activeCount` reports it.

## 6. SFX sync rules: key-click and chime

| Sound | Event (the visual peak) | Onset | Pre-roll | Spacing |
|---|---|---|---|---|
| `key-click` | a decode character locks; an odometer column settles; a word onset (`clicks: true`) | the lock or settle frame | 0 | merged under 2 frames (15 a second at most) |
| `soft-chime` | the decode's last lock; the odometer's end frame; a draw-on's end (`chime: true`); a power word's spoken onset | that frame | 0 | at most one per 20 frames |

1. Onset = peak frame. Both sounds start on their transient, so `frame = peak_frame` and `pre_roll = 0`.
   The sound designer's contract is |onset - peak| <= 2 frames; these cues are at 0.
2. One sound per peak. The chime replaces any click within 2 frames of it.
3. Clicks closer than 2 frames merge into the earlier one: 13 decode locks become 6 clicks plus the chime
   (frames 5, 8, 10, 13, 15, 18; chime 20).
4. An odometer clicks once per settle frame, not once per digit passed: 0 to 2013 gives one click on 38 (all
   four columns) and the chime on 45. A spinning column's passing digits get no sound.
5. A draw-on is silent by default and chimes on its last frame only when it is the reveal.
6. Highlight: a chime on each power word's spoken onset (`on + lead`), no per-word sound unless `clicks`.
   A clicked word that is also a power word gets only the chime.
7. Never stack a chime on an impact frame: the `sub-bass-hit` is the loudest cue in the film and wins.
8. If a reveal is retimed, re-read its `sfx` list; cues come from the same timing as the motion.

Cues are `TextSfxCue`, the same fields as `SfxCue` in `physics.ts`, with the ids `key-click` and `soft-chime`. `soft-chime` is in
the sound designer's lookup; `key-click` is not yet (it lists `digital-tick` for odometer and decode).
[CHECK] add `key-click` to `personas/sound-designer.md` section 2 or map it to `digital-tick` before mixing.

## 7. Style pairing

All 12 styles are `requires: none`. Frame counts, curves and quoted rules come from each style's `style.md`, `recipes.md`
or `design-system.json`; the other cells (where to use a decode, which values roll) are this file's defaults.

| Style | Decode | Odometer | Draw-on | Highlight |
|---|---|---|---|---|
| scifi-hud | yes: mono only, `ltr`, 18 to 20 frames, stagger readouts 8 frames | fixed-length mono values | `draw` [0.22, 1, 0.36, 1] | active plate line |
| dark-neon-dataviz | rare | every counting number, `roll`, stepped, drive from the data function | data line, 80 frames, `draw` [0.45, 0, 0.2, 1] | no |
| hormozi-kinetic | power word only | Banknote counts up over 20 frames | no | yes: lead 0, `punch`, power words |
| tactical-vector-maps | coordinates and codes | `roll` | routes, `trace` [0.45, 0, 0.2, 1] | no |
| minimalist-doodle | no | no style rule; `settle` | yes: `L / 45` frames, 4 to 16, on twos | one highlighter swipe |
| archival-grunge | typewriter labels (`symbols: 0`) | no glowing counter (widgets-data) | marker 24 frames, `draw` [0.22, 1, 0.36, 1] | marker on the key line |
| neo-brutalist-ui | UI values | `settle` | no | `snap` |
| holographic-wireframe, glowing-plexus | labels | `settle` | `draw` [0.65, 0, 0.35, 1] | no |
| low-poly-isometric, voxel-art | no | `settle` on twos where stepped | no | no |
| 2-5d-parallax-depth | no style rule | `settle` | no style rule | no style rule |

## 8. Anti-patterns

| Do | Do not |
|---|---|
| Decode the power word or the title | Decode every line of text |
| Scramble in a mono or tabular face | Scramble a proportional font with symbols (the line breathes) |
| Lock left to right | Lock from the right (digits snap in a strange order) |
| Drive the odometer from the data function | Run the number on its own timer (it disagrees with the line) |
| Pass the widest value as `columns` | Let a value change length mid roll (the plate reflows) |
| Pad the dash by the stroke width | Show a cap dot at frame 0 |
| One active block at a time | Light every word on the line |
| Opacity fade for body copy only | Fade in a statistic: the number is the punch |

## 9. Checks

- Same frame, same output: every helper is a pure function; `rand` is FNV-1a with an avalanche mix.
- Decode: 0 changes on odd frames, 0 targets shown early, ends on the exact text on frame `start + frames`.
- Odometer: exact digits at the end frame for 0 to 7, 49, 475, 999, 2013, 13152, 4.75, 0.5, 100 (0 and 2
  decimals), every column on a whole cell for all integers 0 to 120, peak rate 1.28 (0 to 2013) and 1.48
  (12,000 to 13,152) cells a frame, under `maxCells`.
- Draw-on: offset `L + w` at p = 0, 0 at p = 1; `getLength('M0 0 L300 400')` = 500.
- Highlight: no blank frame inside a line, no group shorter than 6 frames.
- `tsc` clean under the project's strict config.
- [CHECK] No widget uses these helpers yet, so no frame has been rendered. Render a still of the decode at its
  middle frame, the odometer at frames 10 and 30, and a 9 px round-cap draw-on at frame 0 before relying on them.
- [CHECK] The 1.5 cells a frame spin limit and the 6 frame hold are judgement values; confirm on a rendered clip.
