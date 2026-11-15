---
id: archival-grunge
status: verified
requires: none
subject_mode: layered
---
# archival-grunge

A film that feels dug out of an archive. One torn paper clipping lies on a dark desk. The type is printed,
a yellow highlighter sweeps across the line that matters, and a red pen adds notes in the margin. A thin film
gate flicker sits over all of it. The subject is the document, not a person. Read `design-system.json` for every
number; this file says how to use them. `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Historical scandals, corporate downfalls, leaked memos, court cases, biographies, true-crime mysteries.
- A story that rests on a document: a memo, a headline, a letter, a case file, a screenplay page.
- A hook that must feel investigated and serious, with one fact underlined by a hand.
- The user asks for "documentary", "newspaper", "press clipping", "archive", "evidence board", "found footage".

## 2. When to avoid
- Clean product demos, finance dashboards, kids content (use `neo-brutalist-ui` or `dark-neon-dataviz`).
- Long reading. The page holds one headline, four lines of body and two notes at most.
- Real people's faces or real newspaper mastheads. The paper in a film is a made-up one.
- Unbroken flicker and jitter. Past 40 s, give each re-hook (every 12 to 15 s) a still paper beat to rest on; length itself is no limit.

## 3. Tactile paper layering
Draw bottom to top. Each layer has one job, and text only ever sits on the paper.
| # | Layer | How |
|---|---|---|
| 1 | Desk | `bg`, with 10 percent boiling grain re-rolled at 12 fps |
| 2 | Drop shadow | one soft shadow under the whole clipping, role `shadow` |
| 3 | Fibre edge | a lighter polygon with a jagged outline, 6 px outside the paper |
| 4 | Paper | `surface`, clipped by a second jagged polygon (a point every 18 px, moved up to 14 px) |
| 5 | Grain and stains | feTurbulence: fine grain in `ink`, big blotches in `stain`, a burnt edge, one fold |
| 6 | Printed type | `ink` with a 1.5 px bleed shadow; the headline, the body, the caption |
| 7 | Halftone | dots in `ink`, one spot of `primary`; no photographs |
| 8 | Marker | `highlight`, drawn over the type with multiply so the ink stays dark |
| 9 | Red pen | `primary`: a circle, an arrow, an underline, two notes in a handwriting face |
| 10 | Stamp | one boxed word in `primary`, with ink dropouts |
| 11 | Tape | two pieces in `tape` on the top corners |
| 12 | Film gate | flicker, vignette, dust, one scratch; on top of everything |
- The clipping sits at x 54, y 77, 972 x 1498 px, turned -1 degree. Text lives in x 9 to 85 and y 7 to 80 percent.
- Never a flat colour block for the paper. If feTurbulence is missing the page reads as a slide.
- The bottom 20 percent is the empty dark desk. It is the safe zone for captions the platform adds.

## 4. Palettes
10 palettes, two tiers. Pick by era, then check the pen reads on the paper.
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | newsprint, cold-war, true-crime, xerox, sepia-album | one paper, one pen, one marker |
| Expanded | 10 | front-page-1970s, wall-street-80s, war-time-dispatch, boardroom-2011, tabloid-90s | stains, tape and rules |
- Roles: `bg` (the desk), `surface` (the paper), `ink`, `primary` (the red pen), `highlight` (the marker).
  Expanded adds `dim`, `stain`, `rule`, `shadow` and `tape`. A focused palette derives them by blending.
- `ink`, `primary` and `dim` are 4.5:1 or better on `surface` (ink 11.2 or better, pen 4.5 or better).
- `ink` on the marker colour is 7.5:1 or better, so a highlighted line stays readable.
- Colour is a role name. There is no hex in a component.

## 5. Typography
Sizes are pixels on the 1080 x 1920 frame. Display is at least 2.2x the body.
| Level | Size | Notes |
|---|---|---|
| Display | 108 | the headline, upper case, 3 lines at most, a serif |
| Body | 44 | a typewriter or a book serif, about 29 characters a line |
| Hand | 52 to 68 | the red pen notes, 2 or 3 lines in a 27 percent column |
| Label | 34 | typewriter caps for the masthead and the caption |
- 6 pairings, all Google Fonts: playfair-specialelite-reenie, abril-courier-caveat, oldstandard-crimson-marker,
  bodoni-lora-kalam, dmserif-specialelite-reenie, baskerville-spectral-caveat.
- Handwriting needs a size set per face: Reenie Beanie is thin and wants 68, Permanent Marker is wide and wants 52.
- Fixed line breaks on the typewriter body, so the marker lands on the same words in every font.

## 6. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| MagazineCover | the film opens on a cover | a masthead in the display face, a big headline, three cover lines, a barcode box |
| PressFront | a headline carries the hook | masthead, 5 px and 2 px rules, a 3 line headline, a 4 line column, a halftone figure |
| PaperTear | a new document arrives | a ragged edge sweeps down the page in 18 frames over a lighter fibre edge |
| LiveMarkup | a fact must be pointed at | a marker sweep, a pen circle, an arrow and margin notes, each drawn on |
| SerifStamp | the verdict lands | one boxed word, -9 degrees, a spring from 1.7x, ink dropouts |
| FilmLook | always, on the last layer | flicker, vignette, dust, a scratch, a 1 px weave, all at 12 fps |
| ScreenplayPage | the film shows a script or a transcript | a typewriter page, 12 pt look, a character cue and a dialogue block, scene numbers in the margin |
One widget family per scene, plus FilmLook. PressFront, PaperTear, LiveMarkup, SerifStamp and FilmLook are built in the
specimen; MagazineCover and ScreenplayPage are specified here and not yet built.

## 7. Top motions
| Motion | Where | Spec |
|---|---|---|
| Paper tear reveal | the first 18 frames | a ragged horizontal edge sweeps down; ease in out; tape slaps on after it |
| Marker draw-on | the key line | a highlighter grows left to right in 24 frames, ragged at the end, multiply |
| High frequency stop-motion jitter | headline, notes, stamp | a new pose of 1.6 px and 0.5 degrees, 12 times a second; body text stays still |
| Film gate flicker | the whole film | up to 7 percent black, a 1 px weave, 14 specks and a scratch, re-rolled at 12 fps |
Limits per 10 s: 1 tear, 1 stamp, 1 marker line, 2 pen notes, readable body text with no jitter.

## 8. Beats
- 0 to 18: the clipping tears in. 14 to 30: the headline lands line by line, 6 frames apart.
- 30 to 60: the body types itself. 58 to 74: the pen circles one word.
- 74 to 98: the marker sweeps the key line. 100 to 146: the arrow and two notes.
- 146 on: the stamp lands and the frame holds for at least 30 frames.

## 9. Anti-patterns
- A photograph, a video, or a face. Draw the picture as halftone dots.
- Text on the dark desk, or text under the tape or the stamp.
- A straight, clean paper edge, or paper with no grain.
- Marker without multiply, which hides the type.
- Jitter on the body text, or flicker above 8 percent.
- A handwriting face under 48 px, or a pen colour under 4.5:1.
- Real mastheads and real quotes. Facts in the copy are marked `[CHECK]` until verified.

## 10. Proof
- Specimen: `components/styles/archival-grunge/Preview.tsx`, rendered in `newsprint` and `boardroom-2011`;
  stills in `previews/archival-grunge/`.
- Gate: `node scripts/check-design.js --systems archival-grunge`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
