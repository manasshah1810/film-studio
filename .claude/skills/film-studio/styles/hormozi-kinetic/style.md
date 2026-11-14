---
id: hormozi-kinetic
status: verified
requires: none
subject_mode: layered
---
# hormozi-kinetic

Bold condensed uppercase captions that pop word by word, a colour block that follows the spoken word,
punch-in zooms on power words, and a small Narrator bust that reacts. It is the look of business,
mindset and storytelling Reels that hold viewers past the first 3 seconds. Read `design-system.json`
for every number; this file says how to use them. `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Business, money, sales, productivity, mindset, founder stories, blunt advice.
- A paradox or a number can be said in one line (a company that owned half a market and lost it).
- The film is a voiced or captioned monologue: one person's opinion, said fast.
- The first frame must stop a thumb: the hook is a flip of a belief, in giant type.
- The hook can be split into 10 to 14 short words, so each one can land as its own beat.
- The user asks for "Hormozi style", "creator captions", "word by word captions".

## 2. When to avoid
- Quiet, emotional or lyrical topics (grief, nature, art). The type shouts; the topic should not.
- Data-heavy topics where charts carry the proof (use `dark-neon-dataviz`).
- Maps, history with places, war (use `tactical-vector-maps`).
- Films with many characters or scenes of people doing things (use a Mode B style).
- A film with no spoken or captioned line to pop. Nothing to knock out means nothing to show.
- Anything longer than about 60 s. The caption rhythm tires; split it.

## 3. Palettes
10 palettes in `design-system.json`, two tiers. Pick by topic, then by contrast with the topic's feel.
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 3 to 5 | blackout-gold, paper-red, ultramarine-pop, money-green, concrete-cobalt | one blunt message, under 30 s |
| Expanded | 8 to 12 | newsroom-broadsheet, midnight-signal, sunset-hustle, forest-ledger, ice-terminal | a story with a cast of ideas, 30 s and over |
- Colour is a role name, never a hex: `bg`, `ink`, `primary`, `highlight`, `shadow` (expanded adds
  `secondary`, `surface`, `alert`, `positive`, `muted`).
- Roles in use: `ink` is the default word colour, `primary` is the active word block and the colour
  a power word keeps after it is spoken, `highlight` is the block on a power word and the hair.
- Seeded variation: `brief.design.seed` picks the palette and pairing, so the same seed repeats.

## 4. Typography hierarchy
Sizes are pixels on a 1080 x 1920 frame. Display is always uppercase and at least 2.2x the body.
| Level | Role | Size | Notes |
|---|---|---|---|
| Hero | display | 150 to 180 | the hook line; at most 5 lines, at most 12 characters a line |
| H1 | display | 120 | a second beat or a stat |
| H2 | accent | 70 to 84 | a label over a stat, a sub-line |
| Body | body | 56 | one short supporting line, never a paragraph |
| Label | mono | 38 | handles, counts, timestamps; the floor for any text |
- 6 SIL OFL pairings, all Google Fonts: anton-inter, bebas-barlow, league-work, oswald-dmsans,
  archivo-manrope, passion-public. One pairing per film.
- Tracking 0 to 0.02em on display, line height 0.9 to 1.0. Tight lines make a block.
- Left align the hook. Centred hooks read as a poster, not as speech.
- Text lives in x 8 to 83 percent and y 10 to 78 percent (a 4% punch-in still clears the platform UI).

## 5. The active word
1. A word appears on its spoken frame with the `pop` spring: scale 0.6 to 1, overshoot once.
2. While it is spoken it sits on a `primary` block with `bg` text (knockout), scale 1.06.
3. A power word (the number, the turn, the payoff) sits on a `highlight` block, scale 1.1, tilt -2 degrees.
4. After it is spoken a normal word returns to `ink`; a power word stays `primary`.
5. Never more than 4 words highlighted at once; one active block at a time is better.

## 6. Mode A Narrator bust integration
The one subject this style allows. Duotone, flat, layered; never a full figure.
- Placement: lower left, face box inside x 8 to 46, y 52 to 78, clear of the bottom 20%.
- Layers back to front: `shadow`, `hair-back`, `torso`, `neck`, `arm`, `head`, `face`, `hair-front`.
- Duotone fills: head `ink`, features `bg`, shirt `primary`, hair and glasses frame from `highlight`
  and `primary`. Shade side is `bg` at 22% opacity on top, never a new colour.
- Rig: 3 eye states (open, half, closed), brows `inner` and `outer` with neutral, raised, furrowed,
  5 visemes (MBP, AA, OH, EE, FV), an arm with an upper and fore joint.
- Reaction rules: brows raise and the arm lifts on every power word; brows furrow on the loss word;
  blink every 2.5 to 4.5 s; breathing sway under 1.5 degrees.
- The bust never speaks over the caption: it sits below it and to the left of the widget.

## 7. Top widget pairings
| Widget | Use it when | Placement |
|---|---|---|
| KnockoutCaptions | every spoken line, the default | headline box, x 8 to 83 |
| GiantCaptions | the hook and the payoff, one word per beat at 180 px | centre of the safe zone |
| CommentDrop | public reaction, proof that people noticed | right of the bust, tilted 2 degrees |
| Banknote | money gained or lost, a price | right of the bust, count up over 20 frames |
| ImpactFrame | the payoff word, once per film | full frame, 3 frame ink flash plus shake |
One widget per panel. Widget text comes only from the script.

## 8. Top motion pairings
| Motion | Where | Spec |
|---|---|---|
| Spring overshoot | every word entrance, the CommentDrop landing | `pop` damping 11, stiffness 190; `slam` damping 9, stiffness 240 |
| Elastic pull-back zoom | the first frame and each new beat, on the background layer | scale 1.15 to 1, `pullback` spring |
| Whip pan | between beats | x blur 12 to 20 px on the last 4 frames, `whip` bezier |
| Punch-in | each power word | 1.00 to 1.04, back over 14 frames, `settle` bezier |
Limits per 35 s: 4 spring overshoots as scene entrances, 3 whip pans, 2 pull-backs. Word pops are exempt.

## 9. Anti-patterns
- A centred title that fades in at the start. This style never fades; it pops.
- Lowercase or sentence-case captions. Uppercase only.
- Highlighting every word. When all is loud nothing is.
- Captions in the bottom 20% or right 15%, where the platform UI covers them.
- A stick figure, a full-body character, or a face drawn as one flat circle.
- Gradient fills, soft drop shadows or glows on captions. Hard offset shadows only.
- Default CSS ease or linear. Name a `punch`, `overshoot`, `whip` or `settle` curve or a spring.
- A caption that stays static for more than 45 frames. Breathe, drift or move on.
- A bust that faces away or sits over the caption. It reacts beside the text, never on it.
- Placeholder copy ("Lorem ipsum", "Your text here"). Every word is from the script.

## 10. Proof
- Specimen: `components/styles/hormozi-kinetic/Preview.tsx`, rendered in `blackout-gold` and
  `paper-red`; stills in `previews/hormozi-kinetic/`.
- Gate: `node scripts/check-design.js --systems hormozi-kinetic`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
