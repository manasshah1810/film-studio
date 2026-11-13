---
name: cartoon
title: Cartoon
requires: none
cost: medium
status: draft
kit: components/styles/cartoon/kit.tsx
---
# Cartoon

Saturday-morning stage: big-headed rubber-hose characters with one fat ink outline, flat colour, hard offset shadows, a slowly turning sunburst sky and a ground everyone actually stands on. Everything arrives with a bounce.

- **Pick it when:** Playful explainers, stories with a hero and a rival, kids and family topics, anything where a reaction face sells the point.
- **Skip it when:** Grief, crisis, finance compliance, or scripts that are all numbers with no one to react to them.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: night-heist, arcade.

| id | mood | best for |
|---|---|---|
| saturday-morning | sunny, loud, friendly | playful, kids, life-hacks, explainer |
| bubblegum | sweet, cheeky, pop | pop-culture, fashion, dating, playful |
| jungle | lively, outdoors, curious | animals, nature, science, kids |
| night-heist | sneaky, dramatic, fun-tense | mystery, tech, crime, failure |
| blue-sky | open, optimistic, clear | travel, how-it-works, startup, weather |
| candy-lab | inventive, odd, bright | science, gadgets, internet, weird-facts |
| desert-road | warm, adventurous, dusty | history, travel, food, money |
| arcade | electric, competitive, late | gaming, sports, rivalry, tech |
| ice-cream | gentle, light, summery | food, family, wellbeing, small-business |
| monster-mash | gross-out, silly, loud | animals, halloween, biology, playful |

## Font pairings
| id | mood | display / body |
|---|---|---|
| toon-title | classic cartoon title card | Luckiest Guy / Nunito |
| round-pal | soft, round, pre-school friendly | Fredoka / Quicksand |
| comic-shout | italic action lettering | Bangers / Comic Neue |
| big-belly | fat, wobbly, comedic | Titan One / Baloo 2 |
| cereal-box | packaging shout with a wink | Lilita One / Rubik |
| heavy-hitter | chunky slab punchline | Bowlby One / Varela Round |
| show-host | bouncy game-show energy | Paytone One / Poppins |
| storybook | warm picture-book voice | Grandstander / Grandstander |
| sketch-toon | hand-inked indie cartoon | Carter One / Balsamiq Sans |
| goo | dripping monster letters | Modak / Baloo 2 |

## Motion
- 30 fps, held on ones. Entrance 12 frames, stagger 5, minimum hold 30 frames after the last element lands.
- Easings (named, in design-system.json): pop, snap, squash, settle.
- Camera: Front-on stage. Cuts only; one 6% punch-in per scene at most, 4 frames, on the gag. Everything enters with overshoot (easing pop) and lands with a 2-frame squash.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **One fat outline.** Every shape carries the same ink outline: width 2.6 figure units, round joins, never tapered, never coloured. Limbs are 1.5x their defined width so they read as rubber hose.
2. **Hard shadow, no blur.** Props and big numerals drop a solid ink copy offset 0.9 u right and down. Blur radius 0. Display type gets the same shadow in the shadow role at 0.05-0.07 em.
3. **Sunburst sky.** 12 wedges (18 on a peak panel) from a point behind the cast, colour = bg mixed 35% toward highlight, rotating 0.06 deg per frame. Never more contrast than that: it is weather, not a pattern.
4. **Starburst number.** The key figure sits on a 12-point star (inner radius 74%, each point jittered up to 12%), highlight fill, ink outline 0.5 u, hard ink shadow. Star scales from 0 and un-rotates 8 deg while the number pops.
5. **Everybody stands on the ground.** A bowed ground band in the shadow role fills the bottom 14-20% with an ink top edge; each figure has an ink squash shadow (22% opacity ellipse, 60% of its width) that widens as it lands.

## Forbidden
- Gradients, glows, blurred or soft shadows
- Thin or coloured outlines; outline width changing inside a film
- Realistic proportions: heads are at least a third of body height
- Linear easing: every entrance overshoots
- Floating figures with no ground band or squash shadow
- More than two character colours plus skin in one panel
- Small type: nothing under 3.4 u
- Detailed backgrounds that compete with the cast

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js cartoon [--palette id]`.
