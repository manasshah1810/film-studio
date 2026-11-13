---
name: watercolor
title: Watercolour
requires: none
cost: high
status: draft
kit: components/styles/watercolor/kit.tsx
---
# Watercolour

Cold-press paper with three soft pigment pools bled into it, translucent fills that spill past a thin loose pencil line, a brushstroke under the hero line and the key number sitting in a drying puddle. Slow, quiet, literary.

- **Pick it when:** Reflective essays, wellbeing, nature, biography, history told gently, anything narrated in the first person.
- **Skip it when:** Fast comedy, hard-sell promos, tech specs, dense charts.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. All light grounds.

| id | mood | best for |
|---|---|---|
| spring-garden | fresh, hopeful, blooming | wellbeing, nature, biography, gentle-explainer |
| seaside | salt air, calm, open | travel, climate, ocean, health |
| autumn | warm, reflective, harvest | history, food, memoir, money |
| lavender-field | dreamy, quiet, evening | sleep, psychology, culture, poetry |
| rainy-day | grey, thoughtful, serious | serious, failure, policy, grief |
| botanical | pressed leaves, naturalist | nature, science, gardening, food |
| rose-wash | tender, romantic, personal | dating, family, biography, wellbeing |
| desert-bloom | sun-baked, teal and clay | travel, history, architecture, culture |
| ink-and-tea | sepia, scholarly, old letters | history, literature, serious, biography |
| winter-light | cold, clear, still | science, climate, serious, reflection |

## Font pairings
| id | mood | display / body |
|---|---|---|
| gallery-card | elegant high-contrast serif | Cormorant Garamond / Lora |
| storybook | warm picture-book serif | Fraunces / Nunito |
| botanical-plate | engraved caption italic | Playfair Display / EB Garamond |
| brush-letter | loose brush script title | Kaushan Script / Mulish |
| quiet-book | calm bookish serif | DM Serif Display / Spectral |
| tall-and-thin | airy hand-drawn capitals | Amatic SC / Quicksand |
| letter-home | fountain-pen script and serif | Dancing Script / Crimson Text |
| field-guide | sturdy naturalist serif | Libre Baskerville / Source Sans 3 |
| soft-modern | rounded sans, gentle | Comfortaa / Nunito Sans |
| poet | italic literary title | Cormorant / Cormorant Garamond |

## Motion
- 30 fps, held on ones. Entrance 22 frames, stagger 8, minimum hold 45 frames after the last element lands.
- Easings (named, in design-system.json): bleed, bloom, drift, dry.
- Camera: A very slow drift (under 2% scale over a scene), as if the paper is being looked over. Washes bloom outward before any line appears; nothing snaps, bounces or cuts inside a scene. Scene changes are a 12-frame wet dissolve.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **Three washes on cold-press paper.** Every background is bare paper plus exactly three pigment pools (accent, highlight, secondary) at 34% / 24% / 24%, each darker at its rim than its centre, edges roughened by 2.2 u of displacement. Paper grain (freq 0.75, 16%) goes over everything.
2. **Pigment first, pencil second.** Shapes are filled at 72% opacity through a wet-edge filter (bleed 9) so colour pools past the line, then one 1.5-unit graphite outline with 0.9 wobble is laid on top. The fill fades in over 22 frames before the line is fully there.
3. **Brushstroke under the hero line.** The hero headline sits on a single blurred highlight stroke: half a line tall, 3 u wider than the text each side, an uneven blob radius, 42% opacity, painted left to right in 16 frames.
4. **Number in a drying puddle.** The key figure sits inside one highlight wash 1.44x its width, rotated up to 12 deg, rim darker than centre, growing from 70% to 100% as the numeral fades in. No box, no ring, no underline.
5. **Ground pool under the cast.** Figures and objects never float: a flat shadow-colour wash 6 u tall sits under the visual zone at 75%, blurred 0.6 u, arriving before the subject.

## Forbidden
- Dark or saturated backgrounds: the ground is always light paper
- Hard-edged flat fills with no bleed
- Pure black outlines thicker than 2 figure units
- Snaps, bounces, overshoots and hard cuts within a scene
- More than three washes on one screen
- Body text on top of a wash rim
- Drop shadows, glows and gradients that read as digital
- Neon or fluorescent colours

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js watercolor [--palette id]`.
