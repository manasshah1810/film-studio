---
name: comic
title: Comic
requires: none
cost: medium
status: draft
kit: components/styles/comic/kit.tsx
---
# Comic

A printed comic page: one skewed ink-bordered panel per screen with a paper gutter, caption-box headlines, brush-inked figures with Ben-Day dot shading, and an impact burst behind the number. Things cut in; nothing fades.

- **Pick it when:** Rivalries, origin stories, rise-and-fall business tales, history told as drama, anything with a clear hero and a clear blow.
- **Skip it when:** Gentle wellbeing topics, dense data, anything where shouting would be in bad taste.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: midnight-issue, cosmic.

| id | mood | best for |
|---|---|---|
| newsprint | four-colour press, classic | explainer, history, rivalry, playful |
| silver-age | heroic, primary, optimistic | origin-story, startup, sports, kids |
| midnight-issue | night city, high stakes | crime, tech, failure, crisis |
| pulp | yellowed paperback, lurid | mystery, history, money, scandal |
| manga-ink | black and white with one red | serious, biography, sports, drama |
| toxic | radioactive, villainous, loud | science, weird-facts, internet, halloween |
| cosmic | space opera, purple void | space, future, gaming, big-ideas |
| sunday-strip | gentle newspaper funnies | family, life-hacks, food, playful |
| blueline | cool, procedural, detective | how-it-works, policy, tech, weather |
| western | dust, sun, showdown | rivalry, travel, business, history |

## Font pairings
| id | mood | display / body |
|---|---|---|
| splash-page | italic action lettering | Bangers / Comic Neue |
| letterer | hand-lettered balloons | Luckiest Guy / Patrick Hand |
| marker-cover | indie zine, marker pen | Permanent Marker / Kalam |
| tabloid | condensed newsstand shout | Anton / Archivo Narrow |
| block-buster | chunky 3D block title | Bungee / Rubik |
| pulp-slab | paperback slab serif | Alfa Slab One / Bitter |
| war-comic | stencil and typewriter | Black Ops One / Roboto Condensed |
| funnies | friendly newspaper strip | Boogaloo / Comic Neue |
| shonen | fat impact, tight leading | Passion One / Nunito Sans |
| creature-feature | B-movie horror title | Creepster / Kalam |

## Motion
- 30 fps, held on twos. Entrance 6 frames, stagger 4, minimum hold 30 frames after the last element lands.
- Easings (named, in design-system.json): cut, punch, whip, settle.
- Camera: Locked page. Elements appear on hard cuts (2 frames or fewer) the way the eye jumps between panels. One whip pan between scenes at most; speed lines only on the single peak panel.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **One inked panel per screen.** Every scene sits inside one four-sided panel: 3 u gutter of bare paper all round, each corner pushed up to 1.2 u off square, 0.7 u ink border with mitred corners. Nothing but a speech bubble tail may cross the border.
2. **Caption-box headline.** Headlines are set in the dark role on a highlight box: 0.5 u ink border, hard ink shadow 0.8 u right and down, the whole box rotated -1.2 deg. The box scales 90% to 100% in 4 frames; the text cuts in, it does not fade.
3. **Ben-Day tone, never a gradient.** Shade with dots only: a 45-degree ink dot screen at 30% over the right half of bodies and solid props, and a secondary-colour screen (cell 1.7 u, 40%) fading out of one panel corner.
4. **Impact burst behind the number.** The key figure is italic, outlined 0.04 em in ink with a hard 0.05 em ink shadow, ringed by 26 butt-capped ink strokes 3-10 u long that shoot outward as it pops.
5. **Speed lines on the peak only.** On the one panel marked peak, radial ink speed lines at 22% converge behind the subject. Used on any other panel the effect is forbidden: it has to mean something.

## Forbidden
- Gradients, blurs, glows, soft shadows
- Fades and slow eases: elements cut in
- More than one panel border style in a film
- Speed lines or bursts on more than one panel per scene
- Thin outlines: ink width never drops under 3 figure units
- Lowercase body copy inside a speech bubble
- Real comic characters, logos or publisher trade dress
- Type crossing the panel border

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js comic [--palette id]`.
