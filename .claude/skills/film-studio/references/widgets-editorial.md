# Editorial widgets 11-20

Ten print and documentary micro-widgets in `components/widgets/editorial/`, used as visual proof in historical,
biographical and investigative films. Each one draws itself from the active style's `design-system.json`. In
`archival-grunge` a PressFront is a torn, grainy clipping with a soft drop shadow. In `neo-brutalist-ui` it is a white
card with a thick ink border and an offset shadow. Ids: MagazineCover, PressFront, PaperTear, ScreenplayPage,
SerifStamp, LiveMarkup, SketchWords, GreasePencilSheet, ContactSheetHook, TitleCard.

Every paper, masthead, file, person and quote on a widget is made up, or comes from `script.json` with its
`[VERIFY]` cleared. Never draw a real masthead, a real magazine cover or a real person's face; the pictures are
halftone shapes. This is the same rule as `styles/archival-grunge/style.md`.

## 1. The token contract
`editorialTokens(ds, paletteId, pairingId)` in `tokens.ts` is `socialTokens()` (see `widgets-social.md` section 1)
plus the tokens below. A widget reads only that object: no hex, no font name, no fixed border, radius or tear.

| Token | Read from | When the style lacks it |
|---|---|---|
| `text` | `ink` if it reaches 4.5:1 on `surface` | the best of `bg` and `surface` on `surface` |
| `pen` | first of `primary`, `alert`, `highlight` with 3:1 on `surface`; width `paper.pen.stroke` | `ink`; width = border width, at least 5 |
| `stamp` | the pen colour; spring `motion.springs.stamp` | `springs.press`, else the style's pop spring |
| `marker` | first of `highlight`, `primary` that is not the pen and keeps `text` at 4.5:1; blend `paper.marker.blend` | the `well` shade; normal blend |
| `paper.tear` | `paper.tear` amp, step, fibre | none: the paper is the style's card |
| `paper.grain` | `paper.grain` (feTurbulence in `text`) | none |
| `paper.drop` | `tokens.shadow` (blur, y, alpha, role) | the offset shadow, else none |
| `tearCut` | `paper.tear` | amp 12, step 24, fibre 0 (PaperTear needs an edge) |
| `rule` | `tokens.rule` thick, thin | border width (at least 4) and a third of it (at least 2) |
| `jitter` | `paper.jitter` fps, px, deg | none: marks sit still |
| `tearEase` | `motion.easings.tear` | the move easing |
| `h1` | `type_scale.h1`, capped at 96 | 84 |

- Text lives on the paper (`surface`), never on the desk (`bg`). In `archival-grunge` `bg` and `ink` are both dark.
- Text on a fill uses `tk.on(fill)` (the flash sticker, frame numbers on the film strip).
- Resolved in the two rendered palettes:
  - `archival-grunge` newsprint: text `ink`, pen and stamp `primary` (4.88:1), marker `highlight`.
  - `neo-brutalist-ui` butter-ink: text, pen and stamp `ink`, because `primary` is 1.44:1 and `highlight` 2.94:1 on
    white. The marker is `highlight`.

## 2. Shared props, parts and determinism
Every widget takes `{tk, frame, box, seed}` plus its content. `tk`, `frame` and `box` work as in `widgets-social.md`
section 2. `seed` fixes the torn edge, halftone, grain and jitter, so a widget looks the same on every render.

- Widgets never call `useCurrentFrame`, `Math.random` or the clock. Seeded values use Remotion `random(seed)`.
- Jitter is a hash of `seed` and `floor(frame * fps / 30)`.
- Each file exports a constant (`MAGAZINE_COVER`, ...) with `frames` (length), `hero` (the frame that best shows it on
  a still) and `sfx` (cue points).
- `parts.tsx` holds the shared pieces:
  - `Paper`: torn outline, fibre edge, grain and drop shadow, or the style's card. An `outline` prop gives custom
    shapes.
  - `Halftone`: dots for `portrait`, `skyline`, `building`, `crowd` or `horizon`, with one spot in the pen colour.
  - `PenOver`: a pen path stretched over an inline span, drawn on with stroke-dashoffset.
  - `ringPath`: an ellipse that overshoots by 12 percent.
- Keep the box inside the safe rectangle: `x` 6 or more, `x + w` 85 or less, `y` 8 or more, `y + h` 80 or less.

```tsx
import ds from '../../styles/archival-grunge/design-system.json';
import {editorialTokens, SerifStamp, type EditorialJson} from './widgets/editorial';
const tk = editorialTokens(ds as unknown as EditorialJson, 'newsprint', 'playfair-specialelite-reenie');
<Sequence from={120} durationInFrames={90}>
  <Local render={(f) => <SerifStamp tk={tk} frame={f} box={{x: 8, y: 24, w: 76, h: 46}} word="Classified"
    sub="File 0417 · 1962" title="Project Lantern" meta="DEPT. 9 · PAGE 2 OF 9" sign="R. Hale" seed="stamp-1" />} />
</Sequence>
```
`Local` is any wrapper that passes `useCurrentFrame()` to `render`; `Sheet.tsx` has one (`Live`).

## 3. The widgets
Frames are local. SFX ids come from `personas/sound-designer.md` section 2. "Compatible styles" lists the styles where
the widget looks native; any built style can render it.

### 11 MagazineCover
A made-up cover lands with a small tilt. The masthead wipes on in the pen colour and the halftone cover picture grows.
The headline plate rises and up to 3 cover lines pop in, then a round flash sticker pops.

| Prop | Type | Default |
|---|---|---|
| `masthead` | string | sized to fit, up to 170 px |
| `issue`, `headline` | string | headline up to 3 lines |
| `lines` | string[] | up to 3 cover lines, about 22 characters each |
| `flash` | string | optional, sized to fit the sticker |
| `subject` | Subject | `portrait` |

- Trigger: someone's rise to fame, "she made the cover", how the press saw them then.
- Compatible: archival-grunge, neo-brutalist-ui, minimalist-doodle, hormozi-kinetic.
- SFX: `card-flick` at 0, `tactile-pop` per cover line and on the flash at 52.
- Length 90, hero 72.

### 12 PressFront
A front page drops in. The masthead and its double rule draw out from the centre, then the dateline appears and the
headline words drop in one by one. The deck, a halftone photo with a caption and the column rules follow. Last, a
marker sweeps the key phrase.

| Prop | Type | Default |
|---|---|---|
| `paper`, `date`, `edition` | string | made-up paper name |
| `headline` | string | up to 4 lines |
| `mark` | string | words of `headline` the marker sweeps |
| `deck`, `caption` | string | deck clamped to 2 lines |
| `subject`, `markAt` | Subject, frame | `crowd`, 56 |

- Trigger: the moment it went public, "the next morning every paper ran it".
- Compatible: archival-grunge, neo-brutalist-ui, minimalist-doodle.
- SFX: `card-flick` at 0, `tactile-pop` at 16, `marker-stroke` on `markAt`.
- Length 90, hero 84.

### 13 PaperTear
The top sheet cracks along a jagged line down the middle. The two halves pull apart on the tear easing and leave the
frame, showing the document underneath. The statement on top tears in half; the truth underneath fades up.

| Prop | Type | Default |
|---|---|---|
| `before` | `{kicker, title}` | the sheet that tears |
| `after` | `{kicker, title, body}` | the sheet revealed; body up to 3 lines |
| `tearAt` | frame | 30 |

- Trigger: what they said against what was true, the cover story falling apart.
- Compatible: archival-grunge, neo-brutalist-ui (the border is stroked along the tear), minimalist-doodle.
- SFX: `paper-rip` on `tearAt` and again at `tearAt + 10`.
- Length 90, hero 52.

### 14 ScreenplayPage
A script page types itself in screenplay layout: scene heading, action, character, parenthetical and dialogue. The
pen then rings the speaker's name and brackets the line.

| Prop | Type | Default |
|---|---|---|
| `page` | number | |
| `heading`, `action`, `character`, `paren`, `dialogue` | string | `paren` optional |
| `typeAt`, `cps` | frame, characters per frame | 6, 2.6 |

- Untyped text is laid out but transparent, so words never jump lines while typing.
- Trigger: a quote, a scene from a film, "the line that was never meant to be said".
- Compatible: archival-grunge, neo-brutalist-ui, minimalist-doodle, scifi-hud.
- SFX: `click-soft` on every 3rd character, `pen-scratch` at `done + 4` and `done + 16`.
- Length 110, hero 104.

### 15 SerifStamp
A file with a title, a meta line, body rules and a signature. A rubber stamp comes down from 2.3x on the stamp spring.
The paper jolts on contact, and the ink has seeded dropouts.

| Prop | Type | Default |
|---|---|---|
| `word` | string | fitted to the stamp with `textLength` |
| `sub` | string | optional second line |
| `title`, `meta`, `sign` | string | |
| `stampAt`, `tilt` | frame, degrees | 30, -8 |

- The stamp colour reaches 3:1 on the paper (section 1). Dropouts remove about a fifth of the ink.
- Trigger: a verdict, "approved", "classified", "denied", "case closed".
- Compatible: archival-grunge, neo-brutalist-ui, tactical-vector-maps, hormozi-kinetic.
- SFX: `sub-bass-hit` at `stampAt + 4`. It is the loudest cue in a film: use it once.
- Length 90, hero 60.

### 16 LiveMarkup
A printed paragraph. The pen marks it up live: a ring, a marker sweep, an underline or a strike. Then an arrow and a
handwritten note appear under the paragraph.

| Prop | Type | Default |
|---|---|---|
| `lines` | string[] | up to 5 printed lines |
| `marks` | `{text, kind}[]` | kind `circle`, `underline`, `strike` or `marker`; `text` must occur in a line |
| `note` | `{text, mark}` | the note hangs under mark `mark`; put that mark on the last line |
| `startAt`, `each` | frames | 14, 20 |

- Trigger: reading between the lines, "look at the wording", a key word in a document.
- Compatible: archival-grunge, neo-brutalist-ui, minimalist-doodle.
- SFX: `pen-scratch` per pen mark, `marker-stroke` for a marker, `pen-scratch` for the note.
- Length 100, hero 94.

### 17 SketchWords
Words write themselves by hand on a ruled scrap, one line at a time. The key line is in the pen colour and gets a
double swoosh and three spark ticks.

| Prop | Type | Default |
|---|---|---|
| `lines` | string[] | up to 3 lines, about 12 characters each |
| `emphasis` | index | the line in the pen colour |
| `writeAt`, `perChar` | frames | 6, 1.6 |

- Uses the pairing's `accent` face: handwriting in archival-grunge, Space Grotesk caps in neo-brutalist-ui.
- Trigger: a thought, a lesson, the moral at the end.
- Compatible: minimalist-doodle, archival-grunge, neo-brutalist-ui.
- SFX: `pen-scratch` at each line start and on the swoosh.
- Length 90, hero 84.

### 18 GreasePencilSheet
A photo print with a halftone picture. A waxy grease pencil (displacement and dropout filter) draws four crop
corners, the area outside the crop fades back, and an arrow and note are written in the print's bottom border.

| Prop | Type | Default |
|---|---|---|
| `crop` | `{x, y, w, h}` | fractions of the picture |
| `note`, `label` | string | note up to 10 characters, written in the border |
| `subject`, `drawAt` | Subject, frame | `skyline`, 18 |

- Trigger: choosing what to show, "they cropped the photo", the detail that matters.
- Compatible: archival-grunge, neo-brutalist-ui, minimalist-doodle.
- SFX: `marker-stroke` at `drawAt + i * 6`, `pen-scratch` at `drawAt + 34`.
- Length 90, hero 80.

### 19 ContactSheetHook
Four film strips of 3 frames, with sprocket holes and frame numbers. A loupe glides from frame 1 to frame 5 to the
target, then a grease pencil rings the target. The target zooms up to the full sheet width while the strips dim, and
a caption plate with the hook pops in.

| Prop | Type | Default |
|---|---|---|
| `roll` | string | header line |
| `target` | index 0 to 11 | |
| `caption` | string | up to 2 lines |
| `subjects`, `startNo` | Subject[], number | all 5 subjects, 1 |

- Trigger: the opening hook, "one photo changed everything", the frame nobody noticed.
- Compatible: archival-grunge, neo-brutalist-ui, minimalist-doodle, 2-5d-parallax-depth.
- SFX: `click-soft` at 10, `pen-scratch` at 46, `zoom-swell` at 53 (9 frame pre-roll), `shutter-click` at 62.
- Length 100, hero 94.

### 20 TitleCard
A chapter card on paper with registration corners. The kicker rises, the title lines slide up out of a mask, a rule
draws out from the centre and the subline settles.

| Prop | Type | Default |
|---|---|---|
| `kicker` | string | pen colour when it reaches 4.5:1, else `text` |
| `title` | string[] | up to 2 lines, at `h1` |
| `sub` | string | place and year |

- Trigger: a chapter break, a jump in time or place.
- Compatible: archival-grunge, neo-brutalist-ui, minimalist-doodle, 2-5d-parallax-depth, tactical-vector-maps.
- SFX: `stop-tick` on each title line, `pen-scratch` on the rule at 34.
- Length 90, hero 70.

## 4. Styles to avoid
- dark-neon-dataviz, glowing-plexus, holographic-wireframe and scifi-hud have a dark `surface`. The paper becomes a
  dark card and the halftone turns light on dark, which reads as a screen, not print.
- low-poly-isometric and voxel-art: widgets are flat DOM over a 3D world. Place them on a plate, never in the scene.
- [CHECK] Only `archival-grunge` (newsprint) and `neo-brutalist-ui` (butter-ink) have been rendered. The other 10
  styles resolve tokens through the same code but nobody has looked at them.
- [CHECK] `PenOver` uses `vector-effect: non-scaling-stroke` with `pathLength` 1. Finished marks are drawn solid
  (verified on the stills); dash behaviour on the in-progress frames has not been inspected frame by frame.

## 5. Contact sheet and checks
- `EditorialSheet` (5 x 2 cells, each widget frozen on its hero frame) and `EditorialReel` (all 10 back to back,
  940 frames) are registered in `components/Root.tsx`.
  - Props: `{style, palette, pairing}`; `EditorialSheet` also takes `at`.
  - Defaults: archival-grunge, newsprint, playfair-specialelite-reenie.
- `Sheet.tsx` exports `EDITORIAL_BOXES`, the box of each widget on the sheet.
- A storyboard mirror of these boxes, holding every text and fill pair the widgets draw, passes `check-design.js` and
  `check-safezones.js` in both rendered palettes.
- Stills: `previews/editorial-widgets/` at the repo root (pass 1 and final sheets).
