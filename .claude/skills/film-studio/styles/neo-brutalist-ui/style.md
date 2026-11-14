---
id: neo-brutalist-ui
status: verified
requires: none
subject_mode: ui-first
---
# neo-brutalist-ui

Thick-bordered, hard-shadowed cards that feel like you could press them, with frosted glass metric
cards floating on a textured ground. It is the look of a product that is fun to use. The interface
is the subject: a named cursor does the acting. Read `design-system.json` for every number; this file
says how to use them. `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- SaaS, AI workflow, developer tools, creator-economy and productivity videos.
- The film shows a thing being done: a prompt typed, a button pressed, a result appearing.
- The proof is a number that can sit on a card (views, signups, minutes saved).
- The tone is friendly, quick and a little loud. The viewer should want to click.
- The user asks for "neo brutalism", "sticker UI", "glassmorphism", "tactile UI", "product demo".

## 2. When to avoid
- Serious, grave or emotional topics (loss, war, health scares). The cards play; the topic should not.
- Luxury, minimal or editorial looks that need thin lines and air (hard shadows read cheap there).
- Data-heavy stories where a chart is the proof (use `dark-neon-dataviz`).
- Films about people or places with no screen in them. There is nothing to press.
- Anything longer than about 45 s. The chunky look tires; split it.

## 3. Palettes
10 palettes in `design-system.json`, two tiers. Pick by topic, then check it reads on a phone.
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 3 to 5 | butter-ink, mint-slab, lilac-pop, tangerine-grid, night-shift | one screen, one message, under 20 s |
| Expanded | 8 to 12 | sticker-sheet, saas-sky, creator-candy, terminal-lime, concrete-orange | many cards and badges, 20 s and over |
- Colour is a role name, never a hex: `bg`, `ink`, `primary`, `highlight`, `surface` (expanded adds
  `secondary`, `tertiary`, `alert`, `positive`, `muted`).
- `ink` is the border, the hard shadow and the text colour. `surface` is a card, `bg` is the ground.
- Text on a `primary` or `highlight` fill is `ink` or `bg`, whichever has the higher contrast. Dark
  palettes (night-shift, terminal-lime) use `bg`.
- Seeded variation: `brief.design.seed` picks the palette and pairing, so the same seed repeats.

## 4. Typography hierarchy
Sizes are pixels on a 1080 x 1920 frame. Display is at least 2.2x the body.
| Level | Role | Size | Notes |
|---|---|---|---|
| Hero | display | 132 | a one-line title; at most 2 lines |
| Display | display | 108 | the title and a metric number |
| H2 | display | 64 | a card headline |
| Body | body | 44 | one short line on a card or a button |
| Accent | accent | 48 to 56 | sticker text, upper case, one to three words |
| Label | mono | 34 | prompts, file names, metric labels; the floor for any text |
- 6 SIL OFL pairings, all Google Fonts: bricolage-dmsans, grotesk-inter, archivo-workmono,
  unbounded-manrope, rubik-public, epilogue-figtree. One pairing per film.
- Sentence case for titles and card text, upper case only for stickers, chips and buttons.
- The prompt and file names are always in the mono face. That is how the UI reads as a tool.
- Text lives in x 8 to 83 percent and y 9 to 80 percent.

## 5. Border and shadow rules
Tokens are in design px on a 360 x 640 canvas and are multiplied by 3 on the 1080 frame.
1. Every card, button, chip and sticker has a 3 px solid `ink` border (9 px on the frame).
2. Every card has a hard offset shadow of 5 px right and 5 px down in `ink`, blur 0 (15 px on the frame).
3. Radius is 10 on cards, 8 on buttons, 6 on stickers and chips. Never mix a pill with a card.
4. A pressed button moves 4 px toward its shadow and the shadow shrinks to 1 px.
5. A lifted card (hover) moves 3 px up and left and its shadow grows to 8 px.
6. Stickers rotate between -8 and 8 degrees. Cards rotate at most 2 degrees. Windows do not rotate.
7. No gradient fills, no soft shadows, no glows. Flat roles only.

## 6. Frosted glass over a textured ground
Glass is the one soft thing in a hard style, so it must earn its place.
- Fill is `surface` at 74 percent alpha, backdrop blur 12 px (36 px on the frame), saturate 1.4.
- Glass keeps the 3 px `ink` border and the hard shadow. It is a card that happens to be see-through.
- Blur needs something to blur: a dot grid on `bg`, a rotated `primary` band, a `highlight` disc.
  Glass over a flat colour looks like a plain card.
- Legibility: text on glass is `ink` only, at 34 px or more. Blend `surface` at 74 percent over the
  worst ground colour and check the result is 4.5:1 or better against `ink`.
- At most 3 glass cards in one panel, and no glass over another glass card.

## 7. Top widget pairings
| Widget | Use it when | Placement |
|---|---|---|
| PostWall | social proof, a feed of reactions | a 2 column grid of cards, tilted 1 to 2 degrees |
| PromptBar | an AI or search action is the story | top of the window, typed in mono, a Generate button |
| Keycaps | a shortcut or a trigger | inside a card, 60 px caps, they depress when the action fires |
| NLETimeline | the result is an edit | back face of a card or a lower strip, 3 tracks and a playhead |
| LiveCursor | every film | a named cursor, one per film, always the last layer |
One widget family per card. Widget text comes only from the script.

## 8. Top motion pairings
| Motion | Where | Spec |
|---|---|---|
| Spring overshoot | stickers, title lines, chips | `overshoot` damping 12, stiffness 170; scale 1.6 to 1 for a stamp |
| 3D axis card flip | draft to result, question to answer | Y axis, perspective 1400 px, 18 frames, `flip` bezier, back face hidden until 90 |
| Gravity drop | windows and metric cards | `gravity` damping 7, stiffness 220; falls from above, lands, squashes 6 percent |
| Press | every click | `press` spring, 5 frames down and back, the target reacts on the same frame |
Limits per 35 s: 4 gravity drops, 2 flips, 6 stamps. The camera does not move, the UI does.

## 9. Anti-patterns
- Soft blurred drop shadows. Only hard offset shadows.
- A border thinner than 3 design px, or a card with a border and no shadow.
- Glass over a flat ground, or glass text under 4.5:1.
- A cursor with no name tag, or one that teleports. It travels on a curve and slows on the target.
- A button that does not react to its click. Press and result land on the same frame.
- Everything rotated. Rotate stickers; keep windows, prompts and metrics level.
- A rainbow of fills. One `primary`, one `highlight`, the rest `surface` and `bg`.
- Default CSS ease or linear. Name a bezier or a spring.
- Placeholder copy ("Lorem ipsum", "Your text here"). Every word is from the script.

## 10. Proof
- Specimen: `components/styles/neo-brutalist-ui/Preview.tsx`, rendered in `butter-ink` and
  `night-shift`; stills in `previews/neo-brutalist-ui/`.
- Gate: `node scripts/check-design.js --systems neo-brutalist-ui`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
