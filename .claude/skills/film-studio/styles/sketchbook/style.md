---
name: sketchbook
title: Sketchbook
requires: none
cost: medium
status: draft
kit: components/styles/sketchbook/kit.tsx
---
# Sketchbook

A personal notebook page: ruled or dotted paper, pencil and felt-tip drawings with visible wobble and overdraw, handwritten notes, strips of tape, and marker emphasis. Warmer and messier than the whiteboard; it feels private.

- **Pick it when:** Personal essays, study notes, life-hacks, creative process, biography told informally.
- **Skip it when:** Corporate announcements, hard news, anything that must look official.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: black-page.

| id | mood | best for |
|---|---|---|
| composition-book | school notebook, honest | education, explainer, how-it-works, life-hacks |
| kraft | brown paper, craft, earthy | food, small-business, history, travel |
| graph-paper | engineering doodle, tidy | science, maths, tech, data |
| blue-biro | ballpoint in a lecture | study, startup, psychology, serious |
| field-notes | naturalist, outdoors, patient | nature, animals, climate, travel |
| black-page | chalk pencil on black paper | space, mystery, music, failure |
| rose-diary | personal, soft, confessional | wellbeing, dating, biography, culture |
| legal-pad | yellow pad, quick thinking | business, money, law, planning |
| sepia-journal | old travel journal, aged | history, biography, exploration, serious |
| mint-pad | fresh, light, friendly | health, kids, playful, food |

## Font pairings
| id | mood | display / body |
|---|---|---|
| class-notes | neat felt-tip handwriting | Caveat Brush / Patrick Hand |
| architect | drafting-hand capitals | Architects Daughter / Architects Daughter |
| diary | loopy personal script | Gloria Hallelujah / Handlee |
| marker-and-pen | fat marker title, pen notes | Permanent Marker / Kalam |
| quick-scrawl | fast, tall, urgent | Just Another Hand / Kalam |
| schoolroom | primary-school print | Schoolbell / Coming Soon |
| ink-pen | confident fine-liner | Kalam / Kalam |
| studio-sketch | designer annotating a spread | Shadows Into Light Two / Neucha |
| pencil-case | rounded, childlike, warm | Gaegu / Gaegu |
| typed-and-scribbled | typewriter with pen corrections | Special Elite / Cutive Mono |

## Motion
- 30 fps, held on 3s. Entrance 20 frames, stagger 8, minimum hold 36 frames after the last element lands.
- Easings (named, in design-system.json): draw, flick, hand, rest.
- Camera: Top-down on the page, locked. Everything is drawn on in reading order at pen speed; nothing fades or slides. Animate on threes (hold 3) so the line breathes like flipped pages.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **It lives on a ruled page.** Background is a notebook page: feint rules every 5.2 u in the shadow role at 40%, one primary margin rule at 55%, three punched holes down the left edge, paper grain at 14%. The page never changes inside a film.
2. **Every line drawn twice.** Outlines are two passes of the same path, each wobbled separately by 1.1 figure units, width 1.3. The two passes must visibly miss each other in places; a single clean stroke reads as vector, not pencil.
3. **Coloured-pencil fill that misses the edge.** Fills are the flat role colour at 50% through a rough displacement filter, so colour stops short of the outline in some places and spills over in others.
4. **Boxed and hatched number.** The key figure is wiped on like handwriting, then a rough box is drawn round it twice (0.22 u, 80%) and seven short hatch strokes are added on the lower right as a pencil shadow.
5. **Underline, tape, margin doodles.** Emphasis is a hand-drawn underline, never a colour swap. Hero titles get one strip of highlight tape (11 x 3.4 u, 72%, rotated -3 to -9 deg) on the top-left corner. Up to four small doodles sit only in the strips outside the platform-safe area.

## Forbidden
- Perfect geometry: straight rules, true circles, uniform stroke width
- Opaque flat fills or any gradient
- Fades, slides, scale pops: marks are drawn on
- Clean sans-serif or serif type anywhere
- More than three colours beyond ink in one panel
- Doodles inside the safe area or behind text
- Drop shadows other than pencil hatching
- A blank background: the page furniture is always there

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js sketchbook [--palette id]`.
