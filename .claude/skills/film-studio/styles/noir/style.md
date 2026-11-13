---
name: noir
title: Noir
requires: none
cost: medium
status: draft
kit: components/styles/noir/kit.tsx
---
# Noir

A dark room at 24 fps: one shaft of light cut by venetian blinds, featureless silhouettes with a thin rim of light, typewritten evidence, a heavy vignette and film grain that never stops breathing. One colour in a grey world.

- **Pick it when:** Failures, scandals, mysteries, true-crime framings of business stories, serious history, cautionary tales.
- **Skip it when:** Children, celebration, product launches, anything cheerful.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: classic, blue-hour, sepia-reel, neon-rain, green-room, red-light, fog, gold-tooth, cold-case, violet-hour.

| id | mood | best for |
|---|---|---|
| classic | black and white with one red | crime, failure, scandal, serious |
| blue-hour | cold city before dawn | tech, mystery, finance, investigation |
| sepia-reel | old film stock, period piece | history, biography, war, archive |
| neon-rain | wet street, signage glow | internet, gaming, future, nightlife |
| green-room | backroom money, envy | money, fraud, gambling, business |
| red-light | danger, heat, alarm | crisis, true-crime, rivalry, warning |
| fog | grey dockside, one lamp | policy, weather, serious, whodunnit |
| gold-tooth | smoke and brass, heist | luxury, heist, money, jazz |
| cold-case | forensic teal, clinical | science, medicine, investigation, data |
| violet-hour | late bar, velvet, regret | music, culture, psychology, biography |

## Font pairings
| id | mood | display / body |
|---|---|---|
| case-file | typewritten report | Special Elite / Courier Prime |
| marquee | cinema title card | Limelight / Old Standard TT |
| headline-extra | condensed front-page shout | Bebas Neue / Libre Franklin |
| femme-fatale | razor-thin didone | Bodoni Moda / Old Standard TT |
| precinct | stamped institutional gothic | League Gothic / Roboto Condensed |
| monument | carved capitals, fate | Cinzel / Cormorant Garamond |
| late-edition | newsprint serif, hard news | Playfair Display / Source Serif 4 |
| wire-report | narrow gothic and teletype | Oswald / Courier Prime |
| deco-club | art-deco nightclub sign | Poiret One / Josefin Sans |
| confession | italic serif, first person | Cormorant Garamond / EB Garamond |

## Motion
- 24 fps, held on ones. Entrance 18 frames, stagger 6, minimum hold 40 frames after the last element lands.
- Easings (named, in design-system.json): creep, reveal, cutaway, smoke.
- Camera: Shot at 24 fps. A slow push-in (2-3% over a scene) and nothing else: no whip, no shake, no rotation. Type is typed on; figures fade up out of the dark. Scene changes are a hard cut to black for 2 frames.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **One shaft of blind-cut light.** Each scene has exactly one light source: a highlight shaft 48% of the short side wide at 16%, tilted up to 18 deg, cut into slats by a 3.4 u venetian-blind mask (56% dark, 44% light) and blurred 0.5 u. Its position changes per scene; its count never does.
2. **Silhouettes with a rim.** Figures and props collapse to the shadow role with no outline and no face. A highlight copy offset 0.45 u toward the light at 85% sits behind each shape, so only the lit edge shows as a thin rim.
3. **One colour in a grey world.** primary appears on exactly 1 element per scene: the accessory, the key bar, the emphasised word. Everything else is bg, shadow, ink and highlight. Two accented things on one screen breaks the style.
4. **Typed evidence.** Headlines and labels type on character by character over 18 frames with a soft bg halo (0.5 em) behind them so they survive the light shaft. Attributions are prefixed with a dash, like a file note.
5. **Vignette and breathing grain.** A 78% vignette starting 38% from centre closes every frame, under overlay film grain (freq 0.85, 20%) whose seed changes every 2 frames. The grain is the only thing on screen that never stops moving.

## Forbidden
- Light or mid-tone backgrounds
- More than one accent-coloured element per scene
- Faces, outlines or interior detail on figures
- Bounces, pops, overshoots, shakes and whip pans
- More than one light shaft, or light with no source
- Flat even lighting with no vignette
- Rounded friendly type or rounded corners
- Real film stills, actors or studio logos

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js noir [--palette id]`.
