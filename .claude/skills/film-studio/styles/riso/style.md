---
name: riso
title: Risograph
requires: none
cost: medium
status: draft
kit: components/styles/riso/kit.tsx
---
# Risograph

A two-colour zine print: flat spot-colour shapes with no outlines, two big plates overprinted so they multiply into a third colour, display type knocked out of register with a hard second-colour ghost, a corner of halftone and heavy paper grain.

- **Pick it when:** Culture, music, design, opinion, community and campaign pieces, anything that should feel made by people.
- **Skip it when:** Corporate finance, medical precision, sombre news.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. All light grounds.

| id | mood | best for |
|---|---|---|
| pink-blue | zine classic, loud, young | culture, music, internet, playful |
| red-teal | poster, confident, graphic | politics, history, rivalry, explainer |
| orange-violet | gig poster, warm clash | music, startup, events, future |
| green-coral | community print, friendly | food, climate, health, local |
| mono-blue | one-drum blue, studious | tech, science, serious, data |
| sunflower-black | yellow stock, bold, urgent | business, money, warning, sports |
| mint-plum | cool, odd, design-school | design, psychology, fashion, weird-facts |
| newsprint-red | protest flyer, direct | news, policy, history, serious |
| peach-navy | soft stock, grown-up | biography, wellbeing, travel, education |
| aqua-fluoro | swimming-pool fluorescent | summer, kids, gaming, playful |

## Font pairings
| id | mood | display / body |
|---|---|---|
| zine-grotesk | quirky modern grotesk | Space Grotesk / Space Grotesk |
| art-school | wide, strange, expressive | Syne / Syne |
| gig-poster | fat rounded display | Unbounded / Outfit |
| print-shop | heavy black grotesk | Archivo Black / Archivo |
| serif-clash | big serif against grotesk | DM Serif Display / DM Sans |
| wonky | characterful variable grotesk | Bricolage Grotesque / Bricolage Grotesque |
| wheat-paste | street-poster condensed | Anton / Work Sans |
| editorial | magazine italic serif | Instrument Serif / Instrument Sans |
| small-press | geometric, bookish, neat | Epilogue / Epilogue |
| rubber-stamp | inline block capitals | Bungee / Rubik |

## Motion
- 30 fps, held on twos. Entrance 12 frames, stagger 5, minimum hold 30 frames after the last element lands.
- Easings (named, in design-system.json): press, slip, stamp, lift.
- Camera: Flat and locked, held on twos. Layers slide in as separate plates: the secondary ghost arrives 2 frames before the main shape and stops a hair short. No zoom, no rotation after landing. Scene changes are a full-bleed colour-plate wipe.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **Two plates overprinted.** Every background carries one highlight circle (62% of the short side) and one shadow rectangle (90% x 62% of that), both multiplied onto the paper at 78% so their overlap makes a third colour. They share one corner of the frame and move corner per scene.
2. **Out of register.** Display type and numerals carry a hard secondary-colour copy offset 0.045 em right and 0.03 em down with no blur. Shapes carry the same ghost at 0.5 u, 70% opacity. The offset direction never changes within a film.
3. **No outlines, ever.** Shapes are flat spot-colour fills with butt-capped lines at 1.9x weight. Edges come from colour meeting colour or colour meeting paper; an ink keyline around a fill is forbidden.
4. **Halftone fade from one corner.** A 15-degree dot screen in the accent colour (cell 1.5 u, radius 34%, 30%) is multiplied in from one corner and fades out by 46% of the frame. It is the only tonal gradient allowed.
5. **Sun behind the number.** The key figure rises in front of a multiplied highlight circle 1.24x the numeral height, scaled from 0 to full in 10 frames, offset up to 20% sideways so it is never centred on the digits.

## Forbidden
- Ink outlines around filled shapes
- More than four ink colours on paper in one frame
- Smooth gradients, blurs, glows and soft shadows
- Dark backgrounds: multiply needs light stock
- Perfect registration: the ghost offset is always visible on display type
- Photographic or 3D imagery
- Pure black used as a fill colour for large areas
- Motion on ones: everything is held on twos

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js riso [--palette id]`.
