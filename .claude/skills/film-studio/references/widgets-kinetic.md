# Kinetic widgets 41-50

Ten kinetic-text and spatial-dive micro-widgets in `components/widgets/kinetic/`. They carry hooks and scene
transitions: a row of heads with one speaker, a dive through a letter, a push through a picture frame, an exploded
stack of planes, a line that blows away, knockout captions, a slam-in hook, words that fall as blocks, one giant
word per beat and a dealt storyboard deck. Each one draws itself from the active style's `design-system.json`. Ids:
HeadStack, LetterDive, PictureDive, LayerExplode, BlowAway, KnockoutCaptions, KineticHook, GravityDrop,
GiantCaptions, StoryboardDeck.

No widget uses a photograph or a video. PictureDive, LayerExplode and StoryboardDeck show `Scene`, the code-drawn
shot from `widgets-camera.md`. Labels in those three sit on the card or on opaque plates, never on a moving plane.

## 1. The token contract
`kineticTokens(ds, paletteId, pairingId)` in `tokens.ts` is `cameraTokens()` (see `widgets-camera.md` section 1, which
builds on `widgets-data.md` section 1) plus the tokens below. A widget reads only that object.

| Token | Read from | When the style lacks it |
|---|---|---|
| `hero` | `type_scale.hero`, else `display`, capped at 180 | 150 |
| `h1` | `type_scale.h1`, else `display`, capped at 130 | 120 |
| `knock` | fill `primary`, text the best of ink, bg, surface on it | |
| `power` | fill `highlight` (`alert` when highlight equals primary), text the best text role on it | |
| `powerInk` | series 0 when it reaches 3:1 on `surface` (display rule) | `text` |
| `activeScale`, `powerScale`, `powerTilt` | `kinetic.active_scale`, `power_scale`, `power_tilt` | 1.06, 1.1, -2 degrees (hormozi-kinetic style.md section 5) |
| `punch` | `kinetic.punch` | 1.06 |
| `beat` | `kinetic.beat_frames` | 8 frames a word |
| `pullFrom` | `motion.pull_back.from` | 1.15 |
| `pullback` | `motion.springs.pullback`, else `pull_back`, else `settle` | the pop spring |
| `explode` | `motion.springs.explode`, else `settle` | the pop spring |
| `explodeGap` | `kinetic.explode_gap_px` | 120 px (2-5d-parallax-depth style.md section 8) |
| `perspective` | `camera.perspective` | 1400 |
| `drop` | `voxel.drop` (or `tokens.drop`): fall_frames, squash, spread | 8 frames, 0.78, frames 2 to 42 |
| `upper(role)` | the pairing's `case` for that role | |

No built style has a `kinetic` block yet, so every style uses the defaults in that row.
- Resolved in the two rendered palettes:
  - `hormozi-kinetic` blackout-gold: text and label `ink`, accent and powerInk `primary`, knock `bg` on `primary`,
    power `bg` on `highlight`. Pull-back from 1.15 on `pullback` (12/150/1). No `surface`, so the card is `bg` and
    reads as the frame itself.
  - `2-5d-parallax-depth` dusk-harbour: text and label `ink`, accent and powerInk `primary`, knock `bg` on `primary`,
    power `bg` on `highlight`. Explode and pull-back on `settle` (14/120/1).

### Line breaks and orphans
- `measure(tk, role, size, s)` reads real glyph widths from a canvas once `FontGate` has loaded the pairing, with
  the role's tracking and case. `glyphBox` gives a glyph's ink box (LetterDive uses it to find the dive point).
- `breakLines(tk, role, size, words, maxW, maxChars, padEm)` breaks greedily, counting the word-block padding, then
  pulls a word down when the last line would hold one word alone (orphan control).
- `fitSize` picks the largest size that fits a line count. KnockoutCaptions then steps down to 0.8 of that size to
  the first size where no line holds a lone word.
- `parseWords` reads `*word*` as a power word.

## 2. Shared props, parts and determinism
Every widget takes `{tk, frame, box, seed}` plus its content, as in `widgets-data.md` section 2.
- Widgets never call `useCurrentFrame`, `Math.random` or the clock. Seeded values (gust order, deck angles, drop
  jitter, scene skylines) use Remotion `random(seed)`.
- Motion is spring or interpolation of the local frame: `springAt(cfg, f, start)`, plus the camera, data and social
  helpers (`whipP`, `slamP`, `rollP`, `drawP`, `enterP`, `moveP`, `popP`).
- Each file exports a constant (`HEAD_STACK`, ...) with `frames`, `hero` and `sfx`. SFX ids come from
  `personas/sound-designer.md` section 2.
- `parts.tsx`:
  - `Word`: one word in a font role. With `fill` it is a solid block (knockout or power) in the style radius, capped at
    0.14 of the size. Without it the same padding (`WORD_PAD`, 0.14 em by 0.04 em) is kept, so a word that turns into a
    block never shifts its line.
  - `frameOf(tk)`: the shared padding (52 px) and header height.
  - Re-exports `Card`, `Label`, `Plate`, `Scene`, `SPOT`, `Viewport` from the camera parts.
- Keep the box inside the safe rectangle: `x` 6 or more, `x + w` 85 or less, `y` 8 or more, `y + h` 80 or less.
  hormozi-kinetic asks for text in x 8 to 83 and y 10 to 78.

```tsx
import ds from '../../styles/hormozi-kinetic/design-system.json';
import {kineticTokens, KnockoutCaptions, type KinJson} from './widgets/kinetic';
const tk = kineticTokens(ds as unknown as KinJson, 'blackout-gold', 'anton-inter');
<Sequence from={120} durationInFrames={96}>
  <Local render={(f) => <KnockoutCaptions tk={tk} frame={f} box={{x: 8, y: 16, w: 76, h: 60}} label="CAPTION"
    text="Most people quit *three* weeks before it starts *working.*" seed="cap-1" />} />
</Sequence>
```
`Local` is any wrapper that passes `useCurrentFrame()` to `render`; `Sheet.tsx` has one (`Live`).

## 3. The widgets
Frames are local. "Compatible styles" lists the styles whose `style.md` names the widget; any built style can render it.

### 41 HeadStack
Two to five heads (head only), each with its own hair silhouette (bun, crop, long, curls, side part) and one brow,
pop into a row 4 frames apart. At `speakAt` the speaker's collar takes series 0, the head tilts -7 degrees and looks
up, and its quote enters word by word under the row (display, sized to fit 4 lines, no orphan). A tally line closes.

| Prop | Type | Default |
|---|---|---|
| `label`, `quote`, `tally` | string | `tally` optional |
| `heads` | string[] (2 to 5 names) | |
| `speaker` | index | 0 |
| `speakAt` | frame | heads x 4 + 14 |

- Trigger: groups, opinions, surveys, "most people think".
- Compatible: minimalist-doodle.
- SFX: `tactile-pop` at 0, `notification-ping` at `speakAt`.
- Length 84, hero 76.

### 42 LetterDive
The word is a window cut in the card: the next scene (a `knock` fill) shows through its letters. The camera dives into
one letter (the first I, T, H or E, else `dive`) on the whip easing with an exponential scale, up to
`max(w, h) x 2.4 / (size x 0.1)`. The dive point is the letter's measured ink centre, so the dive always ends on ink.
When the stroke fills the window, the next word pops in on the new scene.

| Prop | Type | Default |
|---|---|---|
| `label`, `word`, `to` | string | |
| `dive` | letter index | first I, T, H or E |
| `diveAt`, `diveFrames` | frames | 22, 22 |

- Trigger: a hook that jumps into its subject; a chapter cut.
- Compatible: hormozi-kinetic, neo-brutalist-ui (flat fills). Not named in any style.md yet.
- SFX: `zoom-swell` at `diveAt`, `sub-bass-hit` at `diveAt + diveFrames`.
- Length 72, hero 28.

### 43 PictureDive
A picture hangs on a wall with a picture light. The camera pushes through the frame on the move easing until the
painting fills the shot exactly: the inner `Scene` is drawn at viewport size and hung scaled down, so it lands 1:1. A
doorway edge in front scales 1.7 times faster and blurs up to 1.5 x `blurOff` as it passes. Inside, the planes keep a
slow parallax push (subject 1, mid 0.55, far 0.25).

| Prop | Type | Default |
|---|---|---|
| `label`, `outside`, `inside` | string | |
| `diveAt`, `diveFrames` | frames | 16, 40 |

- Trigger: a place needs a picture.
- Compatible: 2-5d-parallax-depth, tactical-vector-maps.
- SFX: `zoom-swell` at `diveAt`, `soft-chime` at `diveAt + diveFrames`.
- Length 90, hero 40.

### 44 LayerExplode
On the explode spring the five planes of the shot (sky, ridge, town, subject, foreground) tilt into an oblique view
(scale 0.5, y 0.44, 24 degree shear) and slide apart by `explodeGap` each. Each plane gets a series-0 sheet edge and
an opaque name plate on a leader. It holds `hold` frames, then closes on the same spring. Every plane is one affine
matrix, so each plate anchors exactly to its plane's edge.

| Prop | Type | Default |
|---|---|---|
| `label` | string | |
| `names` | 5 strings | Sky · Z0, Ridge, Town · Z1, Courier · Z2, Edge · Z3 |
| `explodeAt`, `hold` | frames | 10, 20 |

- Trigger: the viewer should see the stack.
- Compatible: 2-5d-parallax-depth, holographic-wireframe, low-poly-isometric.
- SFX: `card-flick` at `explodeAt`, `click-soft` at `explodeAt + 26 + hold`.
- Length 96, hero 48.

### 45 BlowAway
The old line is set letter by letter at measured positions. A gust runs left to right over 26 frames. Each letter
lifts off at once (square-root rise, turn and shrink), drifts right on the whip easing and trails two specks, so the
line erodes from its first letter to its last. The new line pops in word by word in the same place. Both lines break
with no orphan. A counter reads letters gone.

| Prop | Type | Default |
|---|---|---|
| `label`, `from`, `to` | string (`*word*` in `to` is a power word) | |
| `blowAt` | frame | 16 |

- Trigger: an old belief replaced; "forget X, do Y".
- Compatible: hormozi-kinetic, minimalist-doodle. Not named in any style.md yet.
- SFX: `fast-whoosh` at `blowAt`, `tactile-pop` at `blowAt + 34`.
- Length 84, hero 30.

### 46 KnockoutCaptions
The default spoken caption (hormozi-kinetic style.md section 5).
- Each word pops in on its spoken frame (0.6 to 1).
- While spoken, a word sits on a `knock` block at `activeScale`. A power word sits on a `power` block at
  `powerScale`, tilted by `powerTilt`, and the stage punches in to `punch`, then settles over 14 frames.
- Once spoken, a word goes back to `text`; a power word stays `powerInk`.
- Lines are left aligned with no orphan or lone word, in pages of `maxLines`. A full page cuts to the next.
- Only the first 4 power words count.

| Prop | Type | Default |
|---|---|---|
| `label`, `text` | string (`*word*` = power) | |
| `at` | frame per word | `startAt` + i x `beat` |
| `startAt`, `maxLines` | frame, lines | 8, 3 |

- Trigger: every spoken line.
- Compatible: hormozi-kinetic.
- SFX: `tactile-pop` on each power word.
- Length 96, hero 46.

### 47 KineticHook
The first two seconds.
- The stage starts at `pullFrom` and springs back to 1.
- The kicker (accent font) fades in, then the hook slams in word by word at hero size: 1.7x to 1x on the slam
  spring, `gap` frames apart, left aligned, at most 12 characters a line, no orphan.
- The power word lands on a `power` block, the stage punches in, and a strike-colour swipe draws under it.
- A `{n}` word rolls as an Odometer to `count.to`.
- The last 4 frames whip the stage out on x with `whipBlur`.

| Prop | Type | Default |
|---|---|---|
| `label`, `kicker`, `text` | string (`*word*` = power, `{n}` = counter) | |
| `count` | `{from?, to, prefix?, suffix?}` | |
| `startAt`, `gap`, `exit`, `frames` | | 8, 6, true, 84 |

- Trigger: the hook.
- Compatible: hormozi-kinetic.
- SFX: `zoom-swell` at 0, `tactile-pop` on each word, `sub-bass-hit` on the power word, `fast-whoosh` at frames - 4.
- Length 84, hero 60.

### 48 GravityDrop
Each word is a block in the style's card look (fill, radius, border, offset shadow): `knock` blocks, with a `power`
block for `*word*`.
- Blocks fall with constant acceleration (y = h x (1 - t^2)) over `drop.fall` frames.
- On landing a block squashes to 1.1 x `drop.squash` for 2 frames and kicks two specks.
- Rows build bottom up: the lowest row first, centre out, with seeded jitter of up to ±1 frame, and starts spread
  over `drop.spread`. The finished stack reads top to bottom.
- Rows break by block width with no orphan block. A counter reads landed / total.

| Prop | Type | Default |
|---|---|---|
| `label`, `text` | string | |

- Trigger: a claim that builds; a list that stacks.
- Compatible: voxel-art.
- SFX: `click-soft` on each landing, `tactile-pop` on the last.
- Length 72, hero 66.

### 49 GiantCaptions
One word per beat at hero size, centred.
- Each word pops (0.6 to 1) and hard-cuts on the next beat.
- A power word sits on a `power` block with the tilt, and the stage punches in.
- One size holds for the whole line: the largest at which the longest word fits at `powerScale`.
- A progress row marks the current word.

| Prop | Type | Default |
|---|---|---|
| `label`, `text` | string (`*word*` = power) | |
| `beatFrames`, `startAt` | frames | 12, 4 |

- Trigger: the hook and the payoff.
- Compatible: hormozi-kinetic.
- SFX: `tactile-pop` on each word, `sub-bass-hit` on a power word.
- Length 84, hero 42.

### 50 StoryboardDeck
Three to six storyboard cards wait in a deck below the card edge and are dealt one every `dealGap` frames.
- Each card flies to its slot in a two-column grid on the whip easing, turning from 18 degrees to a seeded rest angle
  (within ±2.5 degrees), and lands on the slam spring.
- Each card is the style's card with:
  - a scene number in mono on its margin;
  - a `Scene` thumbnail, cycling wide, close, night, tower detail, mid and night close;
  - a one-line caption.
- The counter reads the cards left.

| Prop | Type | Default |
|---|---|---|
| `label` | string | |
| `scenes` | 3 to 6 captions | |
| `dealAt`, `dealGap` | frames | 8, 10 |

- Trigger: a film of 3 to 6 scenes; "here is the plan".
- Compatible: 2-5d-parallax-depth.
- SFX: `card-flick` on each deal, `click-soft` on the last landing.
- Length 96, hero 90.

## 4. Styles to avoid
- KnockoutCaptions, KineticHook and GiantCaptions outside hormozi-kinetic only with intent: the blocks, slams and
  punch-ins set a loud register.
- hormozi-kinetic: at most 4 highlighted words at once and no centred fade-in title. GiantCaptions is centred by its
  spec (hook and payoff only). PictureDive, LayerExplode and StoryboardDeck draw a scene, and this style allows only a
  narrator bust, so do not use them here.
- 2-5d-parallax-depth forbids "text on a blurred or moving plane". Its labels are on the card or on plates; the
  moving text widgets (BlowAway, LetterDive) move the words themselves, not a plane carrying them.
- minimalist-doodle: the dives and the exploded stack fight the flat marker board. HeadStack fits it.

## 5. Contact sheet and checks
- `KineticSheet` (5 x 2 cells, each widget frozen on its hero frame) and `KineticReel` (all 10 back to back, 858
  frames) are registered in `components/Root.tsx`.
  - Props: `{style, palette, pairing}`; `KineticSheet` also takes `at`.
  - Defaults: hormozi-kinetic, blackout-gold, anton-inter.
- `Sheet.tsx` exports `KINETIC_BOXES` (every widget at x 8, y 16, w 76, h 60). All sheet content is sample content
  and says so.
- Stills: `previews/kinetic-widgets/` at the repo root, both styles (hormozi-kinetic blackout-gold,
  2-5d-parallax-depth dusk-harbour).
  - Pass 1 (`pass1-*.png`):
    - HeadStack: the heads were small, the quote sat at 64 px and the middle of the card was empty; the tally was cut
      off.
    - LetterDive: hero 40 was past the dive, so the window was one solid fill.
    - PictureDive and LayerExplode: the header labels were cut off; the exploded stack ran off the left edge.
    - BlowAway: hero 34 came after the gust, so the old line could not be read.
    - KnockoutCaptions: "MOST" sat alone on the first line, and the active WEEKS block touched THREE.
    - StoryboardDeck: the last caption was cut off.
    - GravityDrop, KineticHook and GiantCaptions read cleanly in both styles.
  - Pass 2 (`pass2-*.png`; check-design and check-safezones run; orphan words and safe zones inspected):
    - HeadStack:
      - heads 0.92 of a slot (190 px cap);
      - the quote is fitted from `h1` to 4 lines and centred in the space between the heads and the tally;
      - the tally wraps.
    - KnockoutCaptions: the size steps down until no line holds a lone word, and the word gap widened by 0.1 em.
    - LayerExplode: shear 24 degrees, scale 0.5, shift 0.1 of the width.
    - Labels: shortened; the sample captions were shortened too.
    - Re-render findings:
      - LetterDive at frame 32 read as abstract bars, so its hero moved to 28, where the word is still readable as it
        grows.
      - BlowAway letters crept over their neighbours on the slow start of the whip easing and read as broken
        kerning. Letters now lift at once and drift on the whip, and the gust spans 26 frames, so hero 30 shows the
        line half eroded in both styles.
      - A hairline of the dive fill showed at the LetterDive window edge (mask anti-aliasing); the mask now runs 8 px
        past the window.
    - Orphan words: none in either style at the hero frames. Every multi-line block ends on two or more words. The
      lone WEEKS line in KnockoutCaptions is the next words not spoken yet, not a break.
    - Safe zones: every box spans x 8 to 84 and y 16 to 76.
- A storyboard mirror of these boxes, holding every text and fill pair the widgets draw, passes `check-design.js` and
  `check-safezones.js` in both rendered palettes:
  - text, label and accent on surface;
  - powerInk and the LetterDive letters (`primary`) on surface (display);
  - knock text on `primary`;
  - power text on `highlight`.
- `check-design.js --systems` passes for all 12 styles. tsc is clean.
- [CHECK] Only hormozi-kinetic (blackout-gold) and 2-5d-parallax-depth (dusk-harbour) have been rendered. The other 10
  styles resolve tokens through the same code but nobody has looked at them.
- [CHECK] Only hero frames, plus one probe at frame 27, were inspected. The dive's last frames before the cut, the
  page cut in KnockoutCaptions, the whip-out of KineticHook and the deal arcs have not been checked frame by frame.
- [CHECK] `measure` falls back to 0.56 em a character when no canvas exists (never in a Remotion render). A pairing
  whose font fails to load would break lines on that estimate.
