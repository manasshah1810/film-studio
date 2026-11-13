---
name: cutout
title: Paper cutout
requires: none
cost: medium
status: draft
kit: components/styles/cutout/kit.tsx
---
# Paper cutout

Stop-motion paper collage under a rostrum camera: flat sugar-paper shapes with scissor-wobbled edges and no outlines, every layer casting the same soft shadow, headlines on torn ink strips, a paper sun over torn hills. Pieces drop in on twos and the edges boil.

- **Pick it when:** Warm explainers, children and education, nature, food, culture, gentle stories.
- **Skip it when:** Tech precision, finance dashboards, dark or tense subjects (there are no dark-ground palettes).
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. All light grounds.

| id | mood | best for |
|---|---|---|
| sugar-paper | classroom craft table | explainer, kids, playful, education |
| pool | cool, summery, clean | travel, wellbeing, sports, weather |
| terracotta | warm, handmade, earthy | food, culture, history, small-business |
| kindergarten | primary colours, big scissors | kids, family, life-hacks, playful |
| plum | theatrical, velvet, curious | psychology, music, fashion, mystery |
| forest-floor | leaves, moss, quiet | nature, animals, climate, science |
| newspaper-collage | grey newsprint, one red | news, politics, serious, failure |
| sherbet | sweet, fizzy, light | dating, pop-culture, food, fashion |
| sky-kite | open air, optimistic | startup, how-it-works, travel, tech |
| oat-and-ink | muted, grown-up, editorial | business, money, biography, serious |

## Font pairings
| id | mood | display / body |
|---|---|---|
| paper-poster | fat cut-paper capitals | Rubik / Rubik |
| scissor-serif | wonky soft serif | Fraunces / Fraunces |
| felt-letters | puffy felt-board letters | DynaPuff / Nunito |
| matisse | high-contrast gallery poster | Abril Fatface / Work Sans |
| block-party | heavy grotesque blocks | Archivo Black / Archivo |
| toy-shop | round, bouncy, friendly | Baloo 2 / Baloo 2 |
| ransom-note | mismatched clipped letters | Dela Gothic One / Karla |
| puppet-show | theatre bill, curly | Shrikhand / Mulish |
| collage-grotesk | bold editorial collage | Bricolage Grotesque / Bricolage Grotesque |
| craft-fair | stamped rounded slab | Rowdies / Quicksand |

## Motion
- 30 fps, held on twos. Entrance 10 frames, stagger 5, minimum hold 30 frames after the last element lands.
- Easings (named, in design-system.json): drop, slide, nudge, rest.
- Camera: Rostrum camera straight down on a table. Pieces are placed by hand: they drop in from above on twos (hold 2) and settle with a small overshoot. No zooms; a scene change is every piece lifting off, then the next set landing.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **No outlines, only edges.** Shapes are flat paper with no stroke. Edges are wobbled 1.4 figure units so every side looks scissor-cut, under 16% paper grain; a ruler-straight edge is a defect.
2. **Every layer casts a shadow.** Each piece drops a soft ink shadow: offset 0.35 u right and 0.6 u down, blur 0.9 u, 28%. Same light direction for every piece in the film. This shadow is the only depth cue.
3. **Boil on sixes.** The cut edges are re-randomised every 6 frames while everything else holds still, so the picture breathes like stop motion. Never faster: on twos it reads as jitter.
4. **Headline on ink strips.** Each headline line sits on its own strip of ink paper (padding 0.2 em, rotated up to 1.4 deg, corners clipped unevenly) with bg-coloured type and the emphasis word in highlight. Strips drop in one line at a time.
5. **Paper theatre set.** Background is a highlight paper sun (16 u, slightly off round) over three torn hills stepping bg-shadow mix, shadow, shadow-ink mix, each casting the standard shadow on the one behind. The key figure sits on a lopsided highlight blob.

## Forbidden
- Outlines or strokes round any shape
- Gradients, glows, gloss, 3D bevels
- Perfect circles and ruler-straight edges
- Hard shadows or shadows in different directions
- Smooth continuous motion: pieces move on twos and boil on sixes
- Dark-background palettes (ink is always the dark sheet)
- More than five paper colours in a panel
- Photographic textures or real magazine clippings

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js cutout [--palette id]`.
