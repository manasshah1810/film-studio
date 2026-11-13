---
name: kinetic
title: Kinetic type
requires: none
cost: low
status: draft
kit: components/styles/kinetic/kit.tsx
---
# Kinetic type

The words are the picture: huge condensed type that slams in and stops, one boxed word per screen, a giant outlined ghost letter cropped by the frame, and a single flat slab of colour. Three colours, no illustration.

- **Pick it when:** Punchy opinion pieces, quotes, hooks, manifestos, audio-led shorts where the voice carries the content.
- **Skip it when:** Anything that needs a diagram or data chart to be understood, and scripts with long sentences.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: blackout, ultramarine, deep-forest, graphite-mint.

| id | mood | best for |
|---|---|---|
| newsroom | urgent, front-page, blunt | news, politics, failure, serious |
| blackout | manifesto, stark, loud | crisis, sports, music, tech |
| ultramarine | bold, institutional, electric | startup, product, explainer, politics |
| hot-press | burning, impatient, sale-now | marketing, rivalry, food, playful |
| concrete | brutalist, cold, exact | architecture, design, economics, essay |
| acid | rave flyer, cheeky, loud | internet, gaming, pop-culture, playful |
| bone-and-blood | grave, historical, final | history, crime, failure, war |
| deep-forest | quiet power, considered | climate, finance, strategy, psychology |
| pink-slip | sharp, ironic, fashion | fashion, dating, work, pop-culture |
| graphite-mint | product launch, cool, clean | tech, software, gadgets, health |

## Font pairings
| id | mood | display / body |
|---|---|---|
| poster | tall compressed shout | Anton / Inter |
| marquee | cinema marquee caps | Bebas Neue / Barlow |
| black-grotesk | heavy swiss, no nonsense | Archivo Black / Archivo |
| wide-load | extended, techno, flat | Unbounded / Sora |
| slab-hammer | wood-type slab headline | Alfa Slab One / Roboto Slab |
| fashion-contrast | high-contrast serif, magazine | Playfair Display / DM Sans |
| stencil-gothic | narrow protest placard | League Gothic / Oswald |
| big-shoulders | civic, industrial, tall | Big Shoulders / Public Sans |
| syne-shift | odd, expressive, wide | Syne / Syne |
| didone-drama | fat-face theatrical | Abril Fatface / Figtree |

## Motion
- 30 fps, held on ones. Entrance 7 frames, stagger 3, minimum hold 18 frames after the last element lands.
- Easings (named, in design-system.json): slam, snap, whip.
- Camera: The frame is the page. Hard cuts on the beat; words slam from 150% to 100% in 7 frames, then hold dead still. The ghost glyph drifts 6 u per panel; nothing else moves while a word is being read.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **Ghost glyph.** The first letter of the panel's key word, set at 95% of the long side, outline only (0.5 u, secondary role, 50% opacity), cropped by at least one edge, drifting 6 u across the panel.
2. **The slab.** One full-width slab in the shadow role, 16-30% of the height, flush to the top or bottom (by seed). Text may cross its edge; the slab never has a border.
3. **Slam and stop.** Each line scales 150% to 100% in 7 frames with easing slam, lines staggered 3 frames. No settle, no bounce. The hold after the slam is at least 18 frames.
4. **Boxed word.** The emphasis word sits in a solid accent box (padding 0.13 em each side) that wipes in left to right after the line lands; the word flips to whichever of ink or bg reads best on the box.
5. **Signs, not people.** A figure is a single-colour block silhouette: no face, no hair, no outline, square caps, limbs 2.4x width. It cuts in on one frame.

## Forbidden
- Illustration, texture, gradients, photographs
- More than three colours visible in a panel
- Fades, eases longer than 8 frames, drifting text
- Centred paragraphs; more than 9 words on screen
- Mixing two display faces in one film
- Text set in the secondary role
- Faces or outlined figures
- Motion while the viewer is meant to be reading

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js kinetic [--palette id]`.
