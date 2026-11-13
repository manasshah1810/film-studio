---
name: whiteboard
title: Whiteboard
requires: none
cost: medium
status: draft
kit: components/styles/whiteboard/kit.tsx
---
# Whiteboard

A real teaching board: hand-lettered marker text written stroke by stroke, hatched drawings, one highlighter, and the faint ghost of whatever was wiped off before. It looks like someone thinking out loud, not like a font pretending to be handwriting.

- **Pick it when:** Explaining a mechanism or an argument step by step; study and how-it-works videos; topics where "because" and "so" matter more than spectacle.
- **Skip it when:** Emotional or cinematic stories, luxury or fashion, anything that needs photographs, and scripts with fewer than three causal steps.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: chalkboard, night-glass, blueprint, slate.

| id | mood | best for |
|---|---|---|
| dry-erase | clear, brisk, classroom | explainer, business, how-it-works, tech |
| chalkboard | scholarly, warm, old-school | history, science, maths, education |
| night-glass | late-night strategy, urgent | startup, strategy, crisis, finance |
| kraft | workshop, hands-on, earthy | craft, food, personal, small-business |
| blueprint | engineered, precise, planned | engineering, product, architecture, process |
| exam-paper | verdict, grading, post-mortem | failure, analysis, review, lessons |
| mint-lab | fresh, health, calm clarity | health, biology, wellbeing, environment |
| slate | quiet, considered, modern | design, psychology, culture, essay |
| sticky-wall | playful brainstorm, human | playful, animals, kids, life-hacks |
| newsprint | editorial, blunt, investigative | news, politics, economics, serious |

## Font pairings
| id | mood | display / body |
|---|---|---|
| lecturer | confident chisel-tip caps | Permanent Marker / Patrick Hand |
| architect | neat drafting hand | Architects Daughter / Kalam |
| chalk-talk | serif chalk lettering | Fredericka the Great / Schoolbell |
| fast-notes | tall, hurried, urgent | Covered By Your Grace / Gochi Hand |
| workshop | chunky poster marker | Londrina Solid / Shantell Sans |
| teachers-pen | warm, legible, patient | Kalam / Neucha |
| brush-tip | loose brush pen | Caveat Brush / Handlee |
| sketchnote | conference sketchnote | Walter Turncoat / Playpen Sans |
| kid-genius | round, bouncy, friendly | Chewy / Mali |
| field-notes | scratchy notebook hand | Rock Salt / Delicious Handrawn |

## Motion
- 30 fps, held on ones. Entrance 26 frames, stagger 11, minimum hold 24 frames after the last element lands.
- Easings (named, in design-system.json): write, flick, settle, wipe.
- Camera: Locked off. The board never moves; at most one 3% push per film, on the turn. Things arrive by being written, never by sliding or fading.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **Ghost of the last lesson.** Behind every panel, 3-5 strokes and one word of the PREVIOUS panel remain at ghost_opacity 0.06 with a 2.2 px blur and a 40 px horizontal smear. The board has a history; it is never factory-clean.
2. **Hatch, never fill.** Closed shapes are filled with parallel marker strokes: gap 3.6, width 1.5, angle -38 deg, clipped to the shape, drawn after the outline reaches 45%. Flat fills are forbidden.
3. **The circled number.** The one key figure per film is circled by a two-loop ellipse (rx = text width x 0.62, second loop offset 2%, rotated -4 deg), stroke primary, width 1.4 x marker_width, drawn in 14 frames with easing flick, after the number is written.
4. **Highlighter swipe.** The emphasis word gets a highlight-role bar BEHIND it: height 62% of the line, skew -1.6 deg, overshooting the word by 14% on the right, multiply blend on light boards, 55% opacity on dark boards. One swipe per panel at most.
5. **Because-arrow.** Text and drawing are joined by one curved arrow (cubic, bow 18% of its length, wobble 0.7, open two-stroke head) in secondary, drawn in 12 frames with easing write, starting 6 frames after the headline lands. It points from cause to effect; it is never decoration.

## Forbidden
- A photographic or clip-art hand holding a marker
- Flat colour fills, gradients, drop shadows, glows
- Centred symmetric layouts: content starts at an edge like real board writing
- More than ink + 2 marker colours + 1 highlighter in a film
- Fades, slides, zooms on entrance: marks are written or wiped
- Perfect geometric lines without wobble
- Any typeface that is not hand-lettered (the mono role is for source lines only)
- Detailed faces: two dots and one line is the limit

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js whiteboard [--palette id]`.
