---
name: infographic
title: Infographic
requires: none
cost: low
status: draft
kit: components/styles/infographic/kit.tsx
---
# Infographic

An annual-report page that moves: a fixed dot grid, one coloured edge band, cards with a corner tick, numbers that count up and stop dead, and pictogram people with no faces. Calm, exact, and square to the grid.

- **Pick it when:** Data stories, business and policy explainers, comparisons, anything where the numbers are sourced and are the point.
- **Skip it when:** Scripts with no real figures, character-driven stories, comedy.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: midnight-desk, terminal, carbon.

| id | mood | best for |
|---|---|---|
| annual-report | measured, credible, corporate | business, finance, economics, serious |
| midnight-desk | analyst at 2 am, focused | tech, markets, crisis, data |
| clinic | clean, calm, clinical | health, science, wellbeing, policy |
| ledger | old money, profit and loss | finance, history, money, failure |
| signal | blunt, primary, wayfinding | news, explainer, safety, politics |
| terminal | engineering dashboard | software, security, startup, tech |
| atlas | geographic, textbook blue | geography, education, climate, history |
| clay | warm, human-scale numbers | society, food, culture, small-business |
| violet-brief | modern consultancy deck | strategy, product, marketing, psychology |
| carbon | industrial, energy, heat | energy, industry, sports, crisis |

## Font pairings
| id | mood | display / body |
|---|---|---|
| report | neutral grotesk, annual-report calm | Archivo / Inter |
| grotesk-tech | engineered, slightly quirky | Space Grotesk / Space Grotesk |
| condensed-desk | newsroom graphics desk | Barlow Condensed / Barlow |
| plex | systems, standards, documentation | IBM Plex Sans / IBM Plex Sans |
| soft-geometric | friendly product numbers | Sora / DM Sans |
| serif-figures | editorial data journalism | Fraunces / Source Sans 3 |
| public | civic, plain-spoken, accessible | Public Sans / Public Sans |
| wide-display | confident keynote slide | Red Hat Display / Red Hat Text |
| work | sturdy, utilitarian | Work Sans / Work Sans |
| manrope | airy modern dashboard | Manrope / Manrope |

## Motion
- 30 fps, held on ones. Entrance 18 frames, stagger 6, minimum hold 36 frames after the last element lands.
- Easings (named, in design-system.json): ease_out, in_out, count.
- Camera: No camera. The grid is fixed for the whole film; elements rise 60% of their line height into place with ease_out. Numbers count up with easing count and stop dead.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **The 4 u dot grid.** A dot every 4 u, radius 0.16 u, in the shadow role at 70% opacity, behind everything and never animated. Every zone edge sits on it.
2. **Count, then underline.** A statistic counts from 0 to its value over the enter time with easing count (tabular figures, same decimals as the final value); then a 0.9 u rule in the accent colour draws under it left to right, with a second rule in shadow 1.5 u below.
3. **Edge band.** One 2.2 u band in the panel accent colour runs the full height of one edge (side chosen by seed). It is the only decoration.
4. **Card with a corner tick.** Charts and pictograms sit on a card: bg mixed 45% toward shadow, radius 1.2 u, growing up from its baseline; a 3 u ink corner tick marks its top-left.
5. **Pictogram people.** People are signs: round ink head, tapered body in the cast colour, no face, no hands, no outline, limbs 1.9x width with round caps. They drop in from 12% above.

## Forbidden
- Outlines on shapes, drop shadows, gradients, 3D charts
- More than two data colours in one chart; the third series is ink
- A number without a label or a label without a unit
- Faces, expressions or speech bubbles as jokes
- Rotated or tilted elements: everything is square to the grid
- Decorative icons that carry no data
- Truncated or dual y-axes; bars always start at zero
- Centred body text

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js infographic [--palette id]`.
